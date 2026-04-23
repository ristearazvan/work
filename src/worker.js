// Agenda — Worker: routes /api/* + /book/:slug, otherwise falls through to static assets.

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

const SLUG_RE = /^[a-z0-9-]{2,40}$/;
const SESSION_TTL_S = 30 * 86400;

// ─────────────────────────────────────────────
// Media constants
// ─────────────────────────────────────────────
const MEDIA_LIMIT_BYTES = 500 * 1024 * 1024;  // 500 MB per account
const ALLOWED_MEDIA = {
  'image/jpeg': { kind: 'image', max: 10 * 1024 * 1024, ext: 'jpg' },
  'image/png':  { kind: 'image', max: 10 * 1024 * 1024, ext: 'png' },
  'image/webp': { kind: 'image', max: 10 * 1024 * 1024, ext: 'webp' },
  'video/mp4':  { kind: 'video', max: 50 * 1024 * 1024, ext: 'mp4' },
  'video/webm': { kind: 'video', max: 50 * 1024 * 1024, ext: 'webm' },
};

function b64ToBytes(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// Verify a password against a stored "pbkdf2$<iter>$<saltB64>$<hashB64>" hash.
async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1000) return false;
  const salt = b64ToBytes(parts[2]);
  const expected = b64ToBytes(parts[3]);
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key, expected.length * 8,
  );
  return timingSafeEqual(new Uint8Array(bits), expected);
}

// ─────────────────────────────────────────────
// Rate limiting (D1-backed fixed-window)
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

// ─────────────────────────────────────────────
// Session auth
// Bearer <session_id> → looks up row in sessions table, checks expiry.
// Returns { account_id, slug } or { response } with the 401 to return.
// ─────────────────────────────────────────────
async function requireSession(request, env) {
  const h = request.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return { response: bad('unauthorized', 401) };
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    `SELECT s.account_id, s.expires_at, a.slug
       FROM sessions s JOIN accounts a ON a.id = s.account_id
      WHERE s.id = ?`
  ).bind(m[1]).first();
  if (!row || row.expires_at <= now) return { response: bad('unauthorized', 401) };
  return { account_id: row.account_id, slug: row.slug };
}

async function handlePostLogin(request, env) {
  const ih = await ipHash(request);
  const rl = await rateLimit(env, ih, 'admin_auth');
  if (!rl.ok) return json({ error: 'rate_limited', retry_after: rl.retry_after }, { status: 429 });

  let body;
  try { body = await request.json(); } catch { return bad('invalid_json'); }
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!username || !password) return bad('invalid_credentials', 401);

  const acct = await env.DB.prepare(
    'SELECT id, slug, password_hash FROM accounts WHERE username = ?'
  ).bind(username).first();
  // Verify a dummy hash even when the account is missing to keep timing
  // roughly constant between "no such user" and "wrong password".
  const hash = acct ? acct.password_hash : 'pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  const ok = await verifyPassword(password, hash);
  if (!acct || !ok) {
    await rateLimitBump(env, ih, 'admin_auth');
    return bad('invalid_credentials', 401);
  }

  const sessionId = uid() + uid();
  const now = Math.floor(Date.now() / 1000);
  const expires = now + SESSION_TTL_S;
  await env.DB.prepare(
    'INSERT INTO sessions (id, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(sessionId, acct.id, now, expires).run();

  return json({ session: sessionId, expires_at: expires, slug: acct.slug });
}

async function handlePostLogout(request, env) {
  const h = request.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (m) await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(m[1]).run();
  return json({ ok: true });
}

async function handleGetMe(request, env) {
  const auth = await requireSession(request, env);
  if (!auth.account_id) return auth.response;
  return json({ account_id: auth.account_id, slug: auth.slug });
}

// ─────────────────────────────────────────────
// Availability computation (per-account)
// ─────────────────────────────────────────────
const TZ = 'Europe/Bucharest';
function tzParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const p = {};
  for (const x of fmt.formatToParts(date)) p[x.type] = x.value;
  const h = Number(p.hour) % 24;
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h, min: Number(p.minute) };
}

function parseHoursJson(s) {
  try { return JSON.parse(s) || {}; } catch { return {}; }
}

async function resolveSlug(env, slug) {
  if (!SLUG_RE.test(slug)) return null;
  const row = await env.DB.prepare('SELECT id FROM accounts WHERE slug = ?').bind(slug).first();
  return row ? row.id : null;
}

async function computeAvailability(env, accountId) {
  const cfg = await env.DB.prepare(
    'SELECT * FROM config WHERE account_id = ?'
  ).bind(accountId).first();
  if (!cfg) return { enabled: false, days: [], services: [], buffer_min: 15, max_days: 7 };

  const hours = parseHoursJson(cfg.hours_json);
  const maxDays = cfg.max_days ?? 7;
  const bufferMin = cfg.buffer_min ?? 15;
  const advanceMin = cfg.advance_min ?? 30;
  const services = JSON.parse(cfg.services_json || '[]');

  if (!cfg.public_enabled) {
    return { enabled: false, days: [], services, buffer_min: bufferMin, advance_min: advanceMin, max_days: maxDays };
  }

  const bToday = tzParts();
  const today = new Date(Date.UTC(bToday.y, bToday.m - 1, bToday.d));
  const windowEnd = new Date(today);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + maxDays);
  const isoStart = today.toISOString().slice(0, 10);
  const isoEnd = windowEnd.toISOString().slice(0, 10);

  const busyRows = await env.DB.prepare(
    'SELECT date, start_min, end_min FROM busy WHERE account_id = ? AND date >= ? AND date < ?'
  ).bind(accountId, isoStart, isoEnd).all();

  const reqRows = await env.DB.prepare(
    "SELECT date, start_min, duration_min FROM requests WHERE account_id = ? AND status IN ('pending','approved') AND date >= ? AND date < ?"
  ).bind(accountId, isoStart, isoEnd).all();

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
    const merged = [];
    for (const b of dayBlocks) {
      if (merged.length && b.start <= merged[merged.length - 1].end) {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, b.end);
      } else {
        merged.push({ ...b });
      }
    }
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
async function handleGetAvailability(request, env, slug) {
  const ih = await ipHash(request);
  const rl = await rateLimit(env, ih, 'read');
  if (!rl.ok) return json({ error: 'rate_limited', retry_after: rl.retry_after }, { status: 429 });
  const accountId = await resolveSlug(env, slug);
  if (!accountId) return bad('not_found', 404);
  const data = await computeAvailability(env, accountId);
  return json(data);
}

async function handlePostRequest(request, env, slug) {
  const ih = await ipHash(request);
  const rlH = await rateLimit(env, ih, 'submit');
  if (!rlH.ok) return json({ error: 'rate_limited', retry_after: rlH.retry_after }, { status: 429 });
  const rlD = await rateLimit(env, ih, 'submit_day');
  if (!rlD.ok) return json({ error: 'rate_limited', retry_after: rlD.retry_after }, { status: 429 });

  const accountId = await resolveSlug(env, slug);
  if (!accountId) return bad('not_found', 404);

  let body;
  try { body = await request.json(); } catch { return bad('invalid_json'); }

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

  const avail = await computeAvailability(env, accountId);
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
       (id, account_id, token, created_at, name, phone, service, duration_min, date, start_min, notes, status, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).bind(id, accountId, token, now, name, phone, service, duration, date, startMin, notes, ih).run();

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
  const auth = await requireSession(request, env);
  if (!auth.account_id) return auth.response;
  let body;
  try { body = await request.json(); } catch { return bad('invalid_json'); }

  const hours = body.hours && typeof body.hours === 'object' ? body.hours : null;
  if (!hours) return bad('invalid_hours');
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
    `INSERT INTO config (account_id, hours_json, buffer_min, advance_min, max_days, public_enabled, services_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(account_id) DO UPDATE SET
       hours_json = excluded.hours_json,
       buffer_min = excluded.buffer_min,
       advance_min = excluded.advance_min,
       max_days = excluded.max_days,
       public_enabled = excluded.public_enabled,
       services_json = excluded.services_json,
       updated_at = excluded.updated_at`
  ).bind(
    auth.account_id,
    JSON.stringify(normalized), bufferMin, advanceMin, maxDays, enabled,
    JSON.stringify(services), Math.floor(Date.now() / 1000)
  ).run();

  return json({ ok: true });
}

async function handlePutBusy(request, env) {
  const auth = await requireSession(request, env);
  if (!auth.account_id) return auth.response;
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

  const stmts = [env.DB.prepare('DELETE FROM busy WHERE account_id = ?').bind(auth.account_id)];
  for (const r of rows) {
    stmts.push(env.DB.prepare(
      'INSERT INTO busy (id, account_id, date, start_min, end_min) VALUES (?, ?, ?, ?, ?)'
    ).bind(r.id, auth.account_id, r.date, r.start, r.end));
  }
  await env.DB.batch(stmts);
  return json({ ok: true, count: rows.length });
}

async function handleGetInbox(request, env) {
  const auth = await requireSession(request, env);
  if (!auth.account_id) return auth.response;
  const { results } = await env.DB.prepare(
    `SELECT id, token, created_at, name, phone, service, duration_min, date, start_min, notes, status, decided_at
       FROM requests
      WHERE account_id = ? AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 200`
  ).bind(auth.account_id).all();
  return json({ requests: results || [] });
}

async function handlePostReset(request, env) {
  const auth = await requireSession(request, env);
  if (!auth.account_id) return auth.response;
  await env.DB.batch([
    env.DB.prepare('DELETE FROM busy WHERE account_id = ?').bind(auth.account_id),
    env.DB.prepare('DELETE FROM requests WHERE account_id = ?').bind(auth.account_id),
  ]);
  return json({ ok: true });
}

async function handlePostDecision(request, env, id) {
  const auth = await requireSession(request, env);
  if (!auth.account_id) return auth.response;
  let body;
  try { body = await request.json(); } catch { return bad('invalid_json'); }
  const decision = body.decision === 'approved' ? 'approved' :
                   body.decision === 'rejected' ? 'rejected' : null;
  if (!decision) return bad('invalid_decision');

  const now = Math.floor(Date.now() / 1000);
  const res = await env.DB.prepare(
    "UPDATE requests SET status = ?, decided_at = ? WHERE id = ? AND account_id = ? AND status = 'pending'"
  ).bind(decision, now, id, auth.account_id).run();

  const changes = res.meta?.changes ?? res.changes ?? 0;
  if (!changes) return json({ error: 'already_decided' }, { status: 409 });
  return json({ ok: true });
}

// ─────────────────────────────────────────────
// Media (per-account album — R2-backed, D1-cataloged)
// ─────────────────────────────────────────────
async function handleGetMyMedia(request, env) {
  const auth = await requireSession(request, env);
  if (!auth.account_id) return auth.response;
  const { results } = await env.DB.prepare(
    `SELECT id, kind, mime_type, size_bytes, original_name, display_order, uploaded_at
       FROM media WHERE account_id = ?
      ORDER BY display_order ASC, uploaded_at DESC`
  ).bind(auth.account_id).all();
  const items = results || [];
  const usedBytes = items.reduce((s, r) => s + r.size_bytes, 0);
  return json({ items, used_bytes: usedBytes, limit_bytes: MEDIA_LIMIT_BYTES });
}

async function handlePostMedia(request, env) {
  const auth = await requireSession(request, env);
  if (!auth.account_id) return auth.response;

  const mimeType = (request.headers.get('content-type') || '').split(';')[0].trim();
  const spec = ALLOWED_MEDIA[mimeType];
  if (!spec) return bad('invalid_mime', 415);

  const size = Number(request.headers.get('content-length'));
  if (!Number.isFinite(size) || size <= 0) return bad('invalid_size');
  if (size > spec.max) return bad('file_too_large', 413);

  const usedRow = await env.DB.prepare(
    'SELECT COALESCE(SUM(size_bytes), 0) AS used FROM media WHERE account_id = ?'
  ).bind(auth.account_id).first();
  const used = Number(usedRow?.used) || 0;
  if (used + size > MEDIA_LIMIT_BYTES) {
    return json({ error: 'quota_exceeded', used_bytes: used, limit_bytes: MEDIA_LIMIT_BYTES }, { status: 413 });
  }

  const id = uid();
  const r2Key = `${auth.account_id}/${id}.${spec.ext}`;
  const origName = (request.headers.get('x-filename') || '').slice(0, 200);

  await env.MEDIA.put(r2Key, request.body, {
    httpMetadata: { contentType: mimeType },
  });

  const orderRow = await env.DB.prepare(
    'SELECT COALESCE(MAX(display_order), -1) AS m FROM media WHERE account_id = ?'
  ).bind(auth.account_id).first();
  const order = (Number(orderRow?.m) ?? -1) + 1;
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    `INSERT INTO media (id, account_id, r2_key, kind, mime_type, size_bytes, original_name, display_order, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, auth.account_id, r2Key, spec.kind, mimeType, size, origName, order, now).run();

  return json({
    id, kind: spec.kind, mime_type: mimeType, size_bytes: size,
    original_name: origName, display_order: order, uploaded_at: now,
  });
}

async function handleDeleteMedia(request, env, id) {
  const auth = await requireSession(request, env);
  if (!auth.account_id) return auth.response;
  const row = await env.DB.prepare(
    'SELECT r2_key FROM media WHERE id = ? AND account_id = ?'
  ).bind(id, auth.account_id).first();
  if (!row) return bad('not_found', 404);
  await env.MEDIA.delete(row.r2_key);
  await env.DB.prepare(
    'DELETE FROM media WHERE id = ? AND account_id = ?'
  ).bind(id, auth.account_id).run();
  return json({ ok: true });
}

async function handlePutMediaOrder(request, env) {
  const auth = await requireSession(request, env);
  if (!auth.account_id) return auth.response;
  let body;
  try { body = await request.json(); } catch { return bad('invalid_json'); }
  if (!Array.isArray(body.order)) return bad('invalid_order');
  const ids = body.order.filter(x => typeof x === 'string' && /^[a-f0-9]{32}$/.test(x)).slice(0, 500);
  if (!ids.length) return json({ ok: true });

  // Scope to this account's ids only — silently drop any that aren't owned.
  const placeholders = ids.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT id FROM media WHERE account_id = ? AND id IN (${placeholders})`
  ).bind(auth.account_id, ...ids).all();
  const owned = new Set((results || []).map(r => r.id));

  const stmts = [];
  let order = 0;
  for (const id of ids) {
    if (!owned.has(id)) continue;
    stmts.push(env.DB.prepare(
      'UPDATE media SET display_order = ? WHERE id = ? AND account_id = ?'
    ).bind(order++, id, auth.account_id));
  }
  if (stmts.length) await env.DB.batch(stmts);
  return json({ ok: true });
}

async function handlePublicListMedia(request, env, slug) {
  const accountId = await resolveSlug(env, slug);
  if (!accountId) return bad('not_found', 404);
  const { results } = await env.DB.prepare(
    `SELECT id, kind, mime_type FROM media WHERE account_id = ?
      ORDER BY display_order ASC, uploaded_at DESC`
  ).bind(accountId).all();
  return json({ items: results || [] });
}

// Stream R2 bytes, honoring HTTP Range so <video> can seek.
async function handlePublicGetMedia(request, env, slug, id) {
  const accountId = await resolveSlug(env, slug);
  if (!accountId) return bad('not_found', 404);
  const row = await env.DB.prepare(
    'SELECT r2_key, mime_type, size_bytes FROM media WHERE id = ? AND account_id = ?'
  ).bind(id, accountId).first();
  if (!row) return bad('not_found', 404);

  const size = row.size_bytes;
  const common = {
    'content-type': row.mime_type,
    'accept-ranges': 'bytes',
    'cache-control': 'public, max-age=31536000, immutable',
  };

  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (!m) {
      return new Response(null, { status: 416, headers: { 'content-range': `bytes */${size}` } });
    }
    let start, end;
    if (m[1] === '' && m[2] !== '') {
      // Suffix range: "-N" = last N bytes.
      const n = Number(m[2]);
      start = Math.max(0, size - n);
      end = size - 1;
    } else {
      start = m[1] === '' ? 0 : Number(m[1]);
      end = m[2] === '' ? size - 1 : Number(m[2]);
    }
    if (!(start <= end && end < size)) {
      return new Response(null, { status: 416, headers: { 'content-range': `bytes */${size}` } });
    }
    const length = end - start + 1;
    const obj = await env.MEDIA.get(row.r2_key, { range: { offset: start, length } });
    if (!obj) return bad('not_found', 404);
    return new Response(obj.body, {
      status: 206,
      headers: {
        ...common,
        'content-length': String(length),
        'content-range': `bytes ${start}-${end}/${size}`,
      },
    });
  }

  const obj = await env.MEDIA.get(row.r2_key);
  if (!obj) return bad('not_found', 404);
  return new Response(obj.body, {
    status: 200,
    headers: { ...common, 'content-length': String(size) },
  });
}

// ─────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    try {
      // Auth
      if (pathname === '/api/login' && request.method === 'POST') {
        return await handlePostLogin(request, env);
      }
      if (pathname === '/api/logout' && request.method === 'POST') {
        return await handlePostLogout(request, env);
      }
      if (pathname === '/api/me' && request.method === 'GET') {
        return await handleGetMe(request, env);
      }

      // Public API (slug-scoped)
      const availMatch = pathname.match(/^\/api\/([a-z0-9-]+)\/availability$/);
      if (availMatch && request.method === 'GET') {
        return await handleGetAvailability(request, env, availMatch[1]);
      }
      const reqMatch = pathname.match(/^\/api\/([a-z0-9-]+)\/requests$/);
      if (reqMatch && request.method === 'POST') {
        return await handlePostRequest(request, env, reqMatch[1]);
      }
      const pubMediaGet = pathname.match(/^\/api\/([a-z0-9-]+)\/media\/([a-f0-9]{32})$/);
      if (pubMediaGet && request.method === 'GET') {
        return await handlePublicGetMedia(request, env, pubMediaGet[1], pubMediaGet[2]);
      }
      const pubMediaList = pathname.match(/^\/api\/([a-z0-9-]+)\/media$/);
      if (pubMediaList && request.method === 'GET') {
        return await handlePublicListMedia(request, env, pubMediaList[1]);
      }
      // Status lookup by unique token — no slug needed.
      const statusMatch = pathname.match(/^\/api\/requests\/([A-Za-z0-9]+)$/);
      if (statusMatch && request.method === 'GET') {
        return await handleGetRequestStatus(request, env, statusMatch[1]);
      }

      // Provider API (session-scoped)
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
      if (pathname === '/api/media' && request.method === 'GET') {
        return await handleGetMyMedia(request, env);
      }
      if (pathname === '/api/media' && request.method === 'POST') {
        return await handlePostMedia(request, env);
      }
      if (pathname === '/api/media/order' && request.method === 'PUT') {
        return await handlePutMediaOrder(request, env);
      }
      const mediaDelete = pathname.match(/^\/api\/media\/([a-f0-9]{32})$/);
      if (mediaDelete && request.method === 'DELETE') {
        return await handleDeleteMedia(request, env, mediaDelete[1]);
      }
      const decisionMatch = pathname.match(/^\/api\/requests\/([A-Za-z0-9]+)\/decision$/);
      if (decisionMatch && request.method === 'POST') {
        return await handlePostDecision(request, env, decisionMatch[1]);
      }
      if (pathname.startsWith('/api/')) return bad('not_found', 404);

      // Pretty URLs for public booking pages.
      // /book/<slug>             → book.html (slug parsed from location)
      // /book/<slug>/status/<tk> → book-status.html
      const bookStatus = pathname.match(/^\/book\/([a-z0-9-]+)\/status\/([A-Za-z0-9]+)\/?$/);
      if (bookStatus) {
        return env.ASSETS.fetch(new Request(new URL('/book-status.html', url), request));
      }
      const bookAlbum = pathname.match(/^\/book\/([a-z0-9-]+)\/album\/?$/);
      if (bookAlbum) {
        return env.ASSETS.fetch(new Request(new URL('/book-album.html', url), request));
      }
      const bookPage = pathname.match(/^\/book\/([a-z0-9-]+)\/?$/);
      if (bookPage) {
        return env.ASSETS.fetch(new Request(new URL('/book.html', url), request));
      }

      // Root maps to the PWA shell.
      if (pathname === '/' || pathname === '') {
        return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
      }

      return env.ASSETS.fetch(request);
    } catch (e) {
      return json({ error: 'server_error', detail: String(e && e.message || e) }, { status: 500 });
    }
  },
};
