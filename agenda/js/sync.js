// Agenda — Worker sync: pushes provider state outward, polls the account's inbox.
// All admin requests are authenticated with a session token stored in settings.
// No-op silently when no valid session is present.

(function () {
  function baseUrl(settings) {
    const s = (settings.workerUrl || '').trim();
    if (s) return s.replace(/\/+$/, '');
    return location.origin;
  }

  function authHeaders(settings) {
    return {
      'content-type': 'application/json',
      'authorization': 'Bearer ' + (settings.session || ''),
    };
  }

  function configured(settings) {
    if (!settings.session) return false;
    if (settings.sessionExpiresAt && settings.sessionExpiresAt * 1000 < Date.now()) return false;
    return true;
  }

  // Signals to the caller that the session is gone so it should log out.
  class SessionExpiredError extends Error {
    constructor() { super('session_expired'); this.name = 'SessionExpiredError'; }
  }

  function apptToBusy(a) {
    if (!a || a.status === 'anulat') return null;
    const [h, m] = (a.time || '00:00').split(':').map(Number);
    const start = h * 60 + m;
    const end = start + (Number(a.duration) || 0);
    return { date: a.date, start_min: start, end_min: end };
  }

  function busyPayload(appointments) {
    const blocks = (appointments || [])
      .map(apptToBusy)
      .filter(b => b && b.end_min > b.start_min);
    return { blocks };
  }

  function configPayload(settings) {
    return {
      hours: settings.hours || {},
      buffer_min: settings.bufferMin ?? 15,
      advance_min: settings.advanceMin ?? 30,
      max_days: settings.maxDays ?? 7,
      public_enabled: !!settings.publicEnabled,
      services: settings.services || [],
    };
  }

  async function doFetch(settings, path, init = {}) {
    const url = baseUrl(settings) + path;
    const res = await fetch(url, init);
    if (res.status === 401) throw new SessionExpiredError();
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${res.status} ${text.slice(0, 120)}`);
    }
    return res.json();
  }

  async function login(workerUrl, username, password) {
    const base = (workerUrl || '').trim().replace(/\/+$/, '') || location.origin;
    const res = await fetch(base + '/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'login_failed');
      err.status = res.status;
      err.retryAfter = data.retry_after;
      throw err;
    }
    return data;  // { session, expires_at, slug }
  }

  async function logout(settings) {
    if (!settings.session) return { ok: true };
    try {
      await fetch(baseUrl(settings) + '/api/logout', {
        method: 'POST',
        headers: authHeaders(settings),
      });
    } catch {}
    return { ok: true };
  }

  async function pushBusy(settings, appointments) {
    if (!configured(settings)) return { skipped: true };
    return doFetch(settings, '/api/busy', {
      method: 'PUT',
      headers: authHeaders(settings),
      body: JSON.stringify(busyPayload(appointments)),
    });
  }

  async function pushConfig(settings) {
    if (!configured(settings)) return { skipped: true };
    return doFetch(settings, '/api/config', {
      method: 'PUT',
      headers: authHeaders(settings),
      body: JSON.stringify(configPayload(settings)),
    });
  }

  async function fetchInbox(settings) {
    if (!configured(settings)) return { skipped: true, requests: [] };
    return doFetch(settings, '/api/inbox', {
      method: 'GET',
      headers: authHeaders(settings),
    });
  }

  async function decide(settings, id, decision) {
    if (!configured(settings)) return { skipped: true };
    const url = baseUrl(settings) + '/api/requests/' + encodeURIComponent(id) + '/decision';
    const res = await fetch(url, {
      method: 'POST',
      headers: authHeaders(settings),
      body: JSON.stringify({ decision }),
    });
    if (res.status === 401) throw new SessionExpiredError();
    if (res.status === 409) return { conflict: true };
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`${res.status} ${t.slice(0, 120)}`);
    }
    return res.json();
  }

  function debounce(fn, delay) {
    let h = null;
    return (...args) => {
      if (h) clearTimeout(h);
      h = setTimeout(() => fn(...args), delay);
    };
  }

  async function resetRemote(settings) {
    if (!configured(settings)) return { skipped: true };
    return doFetch(settings, '/api/reset', {
      method: 'POST',
      headers: authHeaders(settings),
      body: '{}',
    });
  }

  window.AG_SYNC = {
    login, logout,
    pushBusy, pushConfig, fetchInbox, decide, resetRemote,
    configured, debounce, busyPayload, configPayload,
    SessionExpiredError,
  };
})();
