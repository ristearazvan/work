// Agenda — Worker sync: pushes provider state outward, polls the public inbox.
// No-op silently when workerUrl/adminToken aren't configured yet.

(function () {
  const BASE_KEY = 'agenda-state-v1';

  function baseUrl(settings) {
    const s = (settings.workerUrl || '').trim();
    if (s) return s.replace(/\/+$/, '');
    // Same origin — works when the app is served by the Worker itself.
    return location.origin;
  }

  function authHeaders(settings) {
    return {
      'content-type': 'application/json',
      'authorization': 'Bearer ' + (settings.adminToken || ''),
    };
  }

  function configured(settings) {
    return !!(settings.adminToken && settings.adminToken.trim());
  }

  // Convert HH:MM time + duration to {date, start_min, end_min} used by the worker.
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
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${res.status} ${text.slice(0, 120)}`);
    }
    return res.json();
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
      headers: { 'authorization': 'Bearer ' + settings.adminToken },
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
    if (res.status === 409) return { conflict: true };
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`${res.status} ${t.slice(0, 120)}`);
    }
    return res.json();
  }

  // Debounced push: calls onSuccess/onError with the result (used to update
  // lastSyncAt/lastSyncError state).
  function debounce(fn, delay) {
    let h = null;
    return (...args) => {
      if (h) clearTimeout(h);
      h = setTimeout(() => fn(...args), delay);
    };
  }

  window.AG_SYNC = {
    pushBusy, pushConfig, fetchInbox, decide,
    configured, debounce, busyPayload, configPayload,
  };
})();
