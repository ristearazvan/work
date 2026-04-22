// Agenda — Worker: routes /api/* + /book, otherwise falls through to static assets.

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const NO_STORE = { 'cache-control': 'no-store' };

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
const json = (body, init = {}) => new Response(JSON.stringify(body), {
  ...init,
  headers: { ...JSON_HEADERS, ...NO_STORE, ...(init.headers || {}) },
});

const bad   = (msg, status = 400) => json({ error: msg }, { status });
const uid = () => crypto.randomUUID().replace(/-/g, '');

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function getIp(request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '0.0.0.0';
}

async function ipHash(request) {
  return (await sha256Hex('agenda-salt:' + getIp(request))).slice(0, 24);
}

// Validate the provider-side bearer token against the ADMIN_TOKEN secret.
function authed(request, env) {
  const h = request.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  return env.ADMIN_TOKEN && m[1] === env.ADMIN_TOKEN;
}

// ─────────────────────────────────────────────
// Rate limiting (D1-backed fixed-window)
// bucket: 'submit' (3/hr), 'read' (120/hr), 'status' (60/hr)
// ─────────────────────────────────────────────
const BUCKETS = {
  submit: { limit: 3,   window_s: 3600 },
  submit_day: { limit: 10, window_s: 86400 },
  read:   { limit: 120, window_s: 3600 },
  status: { limit: 60,  window_s: 3600 },
  admin_auth: { limit: 5, window_s: 900 },
};

async function rateLimit(env, key, bucket) {
  const def = BUCKETS[bucket];
  if (!def) return { ok: true };
  const now = Math.floor(Date.now() / 1000);
  const fullKey = `${key}:${bucket}`;
  const row = await env.DB.prepare(
    'SELECT window_start, count FROM rate_limit WHERE key = ?'
  ).bind(fullKey).first();
  if (!row || now - row.window_start >= def.window_s) {
    await env.DB.prepare(
      'INSERT INTO rate_limit (key, window_start, count) VALUES (?, ?, 1) ' +
      'ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, count = 1'
    ).bind(fullKey, now).run();
    return { ok: true };
  }
  if (row.count >= def.limit) {
    return { ok: false, retry_after: def.window_s - (now - row.window_start) };
  }
  await env.DB.prepare(
    'UPDATE rate_limit SET count = count + 1 WHERE key = ?'
  ).bind(fullKey).run();
  return { ok: true };
}

// Check without consuming; used for admin auth so a valid request doesn't
// eat into the failure budget.
async function rateLimitPeek(env, key, bucket) {
  const def = BUCKETS[bucket];
  if (!def) return { ok: true };
  const now = Math.floor(Date.now() / 1000);
  const fullKey = `${key}:${bucket}`;
  const row = await env.DB.prepare(
    'SELECT window_start, count FROM rate_limit WHERE key = ?'
  ).bind(fullKey).first();
  if (!row || now - row.window_start >= def.window_s) return { ok: true };
  if (row.count >= def.limit) {
    return { ok: false, retry_after: def.window_s - (now - row.window_start) };
  }
  return { ok: true };
}

async function rateLimitBump(env, key, bucket) {
  const def = BUCKETS[bucket];
  if (!def) return;
  const now = Math.floor(Date.now() / 1000);
  const fullKey = `${key}:${bucket}`;
  const row = await env.DB.prepare(
    'SELECT window_start FROM rate_limit WHERE key = ?'
  ).bind(fullKey).first();
  if (!row || now - row.window_start >= def.window_s) {
    await env.DB.prepare(
      'INSERT INTO rate_limit (key, window_start, count) VALUES (?, ?, 1) ' +
      'ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, count = 1'
    ).bind(fullKey, now).run();
  } else {
    await env.DB.prepare(
      'UPDATE rate_limit SET count = count + 1 WHERE key = ?'
    ).bind(fullKey).run();
  }
}

// Bundled admin check: rate-limit peek → bearer check → bump on failure.
// Returns { ok: true } or { response } with the exact 401/429 to return.
async function checkAuth(request, env) {
  const ih = await ipHash(request);
  const rl = await rateLimitPeek(env, ih, 'admin_auth');
  if (!rl.ok) return { response: json({ error: 'rate_limited', retry_after: rl.retry_after }, { status: 429 }) };
  if (authed(request, env)) return { ok: true };
  await rateLimitBump(env, ih, 'admin_auth');
  return { response: bad('unauthorized', 401) };
}

// ─────────────────────────────────────────────
// Availability computation
// Free slot = inside that day's working window, not overlapping any busy block
// or any pending/approved request (with buffer around both), and starting at
// or after (now + advance_min) on today.
// ─────────────────────────────────────────────
// All scheduling ("today", "now", day-of-week) is keyed to Romania local
// time. Workers run in UTC, so we derive Bucharest-local wallclock parts via
// Intl.DateTimeFormat and do date arithmetic over those.
const TZ = 'Europe/Bucharest';
function tzParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const p = {};
  for (const x of fmt.formatToParts(date)) p[x.type] = x.value;
  // Intl sometimes emits hour '24' at midnight; normalize.
  const h = Number(p.hour) % 24;
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h, min: Number(p.minute) };
}

function parseHoursJson(s) {
  try { return JSON.parse(s) || {}; } catch { return {}; }
}

async function computeAvailability(env) {
  const cfg = await env.DB.prepare('SELECT * FROM config WHERE id = 1').first();
  if (!cfg) return { enabled: false, days: [], services: [], buffer_min: 15, max_days: 7 };

  const hours = parseHoursJson(cfg.hours_json);
  const maxDays = cfg.max_days ?? 7;
  const bufferMin = cfg.buffer_min ?? 15;
  const advanceMin = cfg.advance_min ?? 30;
  const services = JSON.parse(cfg.services_json || '[]');

  if (!cfg.public_enabled) {
    return { enabled: false, days: [], services, buffer_min: bufferMin, advance_min: advanceMin, max_days: maxDays };
  }

  // "Today" = Bucharest-local date. Represent it as a UTC-midnight Date so
  // setUTCDate/getUTCDay arithmetic stays aligned with the wallclock date.
  const bToday = tzParts();
  const today = new Date(Date.UTC(bToday.y, bToday.m - 1, bToday.d));
  const windowEnd = new Date(today);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + maxDays);
  const isoStart = today.toISOString().slice(0, 10);
  const isoEnd = windowEnd.toISOString().slice(0, 10);

  const busyRows = await env.DB.prepare(
    'SELECT date, start_min, end_min FROM busy WHERE date >= ? AND date < ?'
  ).bind(isoStart, isoEnd).all();

  const reqRows = await env.DB.prepare(
    "SELECT date, start_min, duration_min FROM requests WHERE status IN ('pending','approved') AND date >= ? AND date < ?"
  ).bind(isoStart, isoEnd).all();

  const blocks = {};
  const add = (date, start, end) => {
    if (!blocks[date]) blocks[date] = [];
    blocks[date].push({ start: start - bufferMin, end: end + bufferMin });
  };
  for (const r of busyRows.results || []) add(r.date, r.start_min, r.end_min);
  for (const r of reqRows.results  || []) add(r.date, r.start_min, r.start_min + r.duration_min);

  const earliestToday = bToday.h * 60 + bToday.min + advanceMin;

  const days = [];
  for (let i = 0; i < maxDays; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    const win = hours[String(dow)];
    if (!win) { days.push({ date: iso, dow, free: [] }); continue; }

    const dayBlocks = (blocks[iso] || []).slice().sort((a, b) => a.start - b.start);
    // Merge overlapping blocks
    const merged = [];
    for (const b of dayBlocks) {
      if (merged.length && b.start <= merged[merged.length - 1].end) {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, b.end);
      } else {
        merged.push({ ...b });
      }
    }
    // Gaps between windowStart and windowEnd minus blocks
    let cursor = Math.max(win.open, i === 0 ? earliestToday : 0);
    const ranges = [];
    for (const b of merged) {
      if (b.end <= cursor) continue;
      if (b.start > cursor) ranges.push({ start: cursor, end: Math.min(b.start, win.close) });
      cursor = Math.max(cursor, b.end);
      if (cursor >= win.close) break;
    }
    if (cursor < win.close) ranges.push({ start: cursor, end: win.close });

    days.push({
      date: iso,
      dow,
      window: win,
      free: ranges.filter(r => r.end - r.start >= 30),
    });
  }

  return {
    enabled: true,
    services,
    buffer_min: bufferMin,
    advance_min: advanceMin,
    max_days: maxDays,
    days,
  };
}

// ─────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────
async function handleGetAvailability(request, env) {
  const ih = await ipHash(request);
  const rl = await rateLimit(env, ih, 'read');
  if (!rl.ok) return json({ error: 'rate_limited', retry_after: rl.retry_after }, { status: 429 });
  const data = await computeAvailability(env);
  return json(data);
}

async function handlePostRequest(request, env) {
  const ih = await ipHash(request);
  const rlH = await rateLimit(env, ih, 'submit');
  if (!rlH.ok) return json({ error: 'rate_limited', retry_after: rlH.retry_after }, { status: 429 });
  const rlD = await rateLimit(env, ih, 'submit_day');
  if (!rlD.ok) return json({ error: 'rate_limited', retry_after: rlD.retry_after }, { status: 429 });

  let body;
  try { body = await request.json(); } catch { return bad('invalid_json'); }

  // Honeypot: the public form includes a hidden "hp_field" input that real
  // users never fill. Any value = bot; silently accept + discard.
  if (body.hp_field) return json({ id: 'ok', token: 'ok' });

  const name = (body.name || '').toString().trim();
  const phone = (body.phone || '').toString().trim();
  const service = (body.service || '').toString().trim();
  const duration = Number(body.duration_min);
  const date = (body.date || '').toString().trim();
  const startMin = Number(body.start_min);
  const notes = (body.notes || '').toString().trim().slice(0, 1000);

  if (!name || name.length > 80) return bad('invalid_name');
  if (!phone || phone.length > 40) return bad('invalid_phone');
  if (!service || service.length > 40) return bad('invalid_service');
  if (!Number.isFinite(duration) || duration < 30 || duration > 180) return bad('invalid_duration');
  if (duration % 15 !== 0) return bad('invalid_duration');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad('invalid_date');
  if (!Number.isFinite(startMin) || startMin < 0 || startMin >= 1440) return bad('invalid_start');

  // Revalidate against current availability — slot must still be free.
  const avail = await computeAvailability(env);
  if (!avail.enabled) return bad('bookings_disabled', 403);
  const day = avail.days.find(d => d.date === date);
  if (!day) return bad('date_out_of_range');
  const fits = day.free.some(r => startMin >= r.start && startMin + duration <= r.end);
  if (!fits) return bad('slot_unavailable', 409);

  const id = uid();
  const token = uid();
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT INTO requests
       (id, token, created_at, name, phone, service, duration_min, date, start_min, notes, status, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).bind(id, token, now, name, phone, service, duration, date, startMin, notes, ih).run();

  return json({ id, token });
}

async function handleGetRequestStatus(request, env, token) {
  const ih = await ipHash(request);
  const rl = await rateLimit(env, ih, 'status');
  if (!rl.ok) return json({ error: 'rate_limited', retry_after: rl.retry_after }, { status: 429 });
  const row = await env.DB.prepare(
    'SELECT token, created_at, name, service, duration_min, date, start_min, status, decided_at FROM requests WHERE token = ?'
  ).bind(token).first();
  if (!row) return json({ error: 'not_found' }, { status: 404 });
  return json(row);
}

async function handlePutConfig(request, env) {
  const auth = await checkAuth(request, env);
  if (!auth.ok) return auth.response;
  let body;
  try { body = await request.json(); } catch { return bad('invalid_json'); }

  const hours = body.hours && typeof body.hours === 'object' ? body.hours : null;
  if (!hours) return bad('invalid_hours');
  // Normalize: keys "0".."6", values null or {open,close} in minutes
  const normalized = {};
  for (let i = 0; i < 7; i++) {
    const v = hours[String(i)];
    if (!v || v.open == null || v.close == null) { normalized[i] = null; continue; }
    const o = Number(v.open), cl = Number(v.close);
    if (!Number.isFinite(o) || !Number.isFinite(cl) || o < 0 || cl > 1440 || o >= cl) return bad('invalid_hours');
    normalized[i] = { open: o, close: cl };
  }
  const bufferMin  = Math.max(0, Math.min(120, Number(body.buffer_min)  ?? 15));
  const advanceMin = Math.max(0, Math.min(1440, Number(body.advance_min) ?? 30));
  const maxDays    = Math.max(1, Math.min(30,  Number(body.max_days)    ?? 7));
  const enabled    = body.public_enabled ? 1 : 0;
  const services = Array.isArray(body.services) && body.services.length
    ? body.services.map(s => String(s).slice(0, 40)).slice(0, 12)
    : ['Standard', 'Extins', 'Cină', 'Peste noapte'];

  await env.DB.prepare(
    `INSERT INTO config (id, hours_json, buffer_min, advance_min, max_days, public_enabled, services_json, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       hours_json = excluded.hours_json,
       buffer_min = excluded.buffer_min,
       advance_min = excluded.advance_min,
       max_days = excluded.max_days,
       public_enabled = excluded.public_enabled,
       services_json = excluded.services_json,
       updated_at = excluded.updated_at`
  ).bind(
    JSON.stringify(normalized), bufferMin, advanceMin, maxDays, enabled,
    JSON.stringify(services), Math.floor(Date.now() / 1000)
  ).run();

  return json({ ok: true });
}

async function handlePutBusy(request, env) {
  const auth = await checkAuth(request, env);
  if (!auth.ok) return auth.response;
  let body;
  try { body = await request.json(); } catch { return bad('invalid_json'); }
  if (!Array.isArray(body.blocks)) return bad('invalid_blocks');

  const rows = [];
  for (const b of body.blocks) {
    const date = String(b.date || '');
    const start = Number(b.start_min);
    const end = Number(b.end_min);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) continue;
    rows.push({ id: uid(), date, start, end });
  }

  const stmts = [env.DB.prepare('DELETE FROM busy')];
  for (const r of rows) {
    stmts.push(env.DB.prepare(
      'INSERT INTO busy (id, date, start_min, end_min) VALUES (?, ?, ?, ?)'
    ).bind(r.id, r.date, r.start, r.end));
  }
  await env.DB.batch(stmts);
  return json({ ok: true, count: rows.length });
}

async function handleGetInbox(request, env) {
  const auth = await checkAuth(request, env);
  if (!auth.ok) return auth.response;
  const { results } = await env.DB.prepare(
    `SELECT id, token, created_at, name, phone, service, duration_min, date, start_min, notes, status, decided_at
       FROM requests
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT 200`
  ).all();
  return json({ requests: results || [] });
}

async function handlePostReset(request, env) {
  const auth = await checkAuth(request, env);
  if (!auth.ok) return auth.response;
  await env.DB.batch([
    env.DB.prepare('DELETE FROM busy'),
    env.DB.prepare('DELETE FROM requests'),
    env.DB.prepare("DELETE FROM rate_limit WHERE key NOT LIKE '%:admin_auth'"),
  ]);
  return json({ ok: true });
}

async function handlePostDecision(request, env, id) {
  const auth = await checkAuth(request, env);
  if (!auth.ok) return auth.response;
  let body;
  try { body = await request.json(); } catch { return bad('invalid_json'); }
  const decision = body.decision === 'approved' ? 'approved' :
                   body.decision === 'rejected' ? 'rejected' : null;
  if (!decision) return bad('invalid_decision');

  const now = Math.floor(Date.now() / 1000);
  // Conditional update so only the first device to decide wins.
  const res = await env.DB.prepare(
    "UPDATE requests SET status = ?, decided_at = ? WHERE id = ? AND status = 'pending'"
  ).bind(decision, now, id).run();

  const changes = res.meta?.changes ?? res.changes ?? 0;
  if (!changes) return json({ error: 'already_decided' }, { status: 409 });
  return json({ ok: true });
}

// ─────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    try {
      // Public API
      if (pathname === '/api/availability' && request.method === 'GET') {
        return await handleGetAvailability(request, env);
      }
      if (pathname === '/api/requests' && request.method === 'POST') {
        return await handlePostRequest(request, env);
      }
      const statusMatch = pathname.match(/^\/api\/requests\/([A-Za-z0-9]+)$/);
      if (statusMatch && request.method === 'GET') {
        return await handleGetRequestStatus(request, env, statusMatch[1]);
      }
      // Provider API
      if (pathname === '/api/config' && request.method === 'PUT') {
        return await handlePutConfig(request, env);
      }
      if (pathname === '/api/busy' && request.method === 'PUT') {
        return await handlePutBusy(request, env);
      }
      if (pathname === '/api/inbox' && request.method === 'GET') {
        return await handleGetInbox(request, env);
      }
      if (pathname === '/api/reset' && request.method === 'POST') {
        return await handlePostReset(request, env);
      }
      const decisionMatch = pathname.match(/^\/api\/requests\/([A-Za-z0-9]+)\/decision$/);
      if (decisionMatch && request.method === 'POST') {
        return await handlePostDecision(request, env, decisionMatch[1]);
      }
      if (pathname.startsWith('/api/')) return bad('not_found', 404);

      // Pretty URLs for the public booking pages — serve the asset files.
      if (pathname === '/book' || pathname === '/book/') {
        return env.ASSETS.fetch(new Request(new URL('/book.html', url), request));
      }
      if (pathname.startsWith('/book/status/')) {
        return env.ASSETS.fetch(new Request(new URL('/book-status.html', url), request));
      }
      // Root maps to the PWA shell. html_handling is disabled so we do it here.
      if (pathname === '/' || pathname === '') {
        return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
      }

      // Everything else: static assets (the existing PWA).
      return env.ASSETS.fetch(request);
    } catch (e) {
      return json({ error: 'server_error', detail: String(e && e.message || e) }, { status: 500 });
    }
  },
};
