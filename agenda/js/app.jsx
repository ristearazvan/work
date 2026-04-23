// Agenda — root App: routing, state, theme, persistence, worker sync

function App() {
  const T = window.AG_T;
  // State is loaded per-session on demand. On boot, read the persisted session
  // bundle; if valid, load that slug's per-account state. Otherwise state stays
  // null and the LoginScreen renders until the user signs in.
  const [state, setState] = React.useState(() => {
    const session = window.AG_STORE.loadSession();
    if (!session) return null;
    const base = window.AG_STORE.loadStateFor(session.slug);
    return { ...base, settings: { ...base.settings, ...session } };
  });
  const [tab, setTab] = React.useState('home');
  const [appt, setAppt] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [syncStatus, setSyncStatus] = React.useState({ state: 'idle' });
  const [refreshingInbox, setRefreshingInbox] = React.useState(false);

  const theme = state?.settings.theme === 'dark' ? 'dark' : 'light';
  const c = AG[theme];

  // Persist per-slug state on every change — but only when logged in.
  React.useEffect(() => {
    if (!state || !state.settings.slug) return;
    window.AG_STORE.saveStateFor(state.settings.slug, state);
  }, [state]);

  React.useEffect(() => {
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.setAttribute('content', c.bg);
    document.body.style.background = c.bg;
  }, [c.bg]);

  React.useEffect(() => {
    const toggle = () => {
      setState(s => s ? ({ ...s, settings: { ...s.settings, theme: s.settings.theme === 'dark' ? 'light' : 'dark' } }) : s);
    };
    window.addEventListener('agenda-toggle-theme', toggle);
    return () => window.removeEventListener('agenda-toggle-theme', toggle);
  }, []);

  // ── Worker sync ────────────────────────────────────────────────
  const SYNC = window.AG_SYNC;
  const stateRef = React.useRef(state);
  stateRef.current = state;

  // Session gate: if no valid session, render the login screen instead of the app.
  const hasSession = !!state && SYNC.configured(state.settings);

  const handleLoggedIn = React.useCallback((sessionData) => {
    // Persist the session bundle and load the per-slug state bucket. First
    // login for a slug gets the SEED; subsequent logins restore what was there.
    window.AG_STORE.saveSession(sessionData);
    const base = window.AG_STORE.loadStateFor(sessionData.slug);
    setState({ ...base, settings: { ...base.settings, ...sessionData } });
    setTab('home');
  }, []);

  const handleLogout = React.useCallback(async () => {
    const cur = stateRef.current;
    if (cur) await SYNC.logout(cur.settings);
    window.AG_STORE.clearSession();
    setState(null);
    setTab('home');
  }, [SYNC]);

  // Auto-logout if any sync call surfaces a SessionExpiredError.
  const handleSyncError = React.useCallback((e) => {
    if (e instanceof SYNC.SessionExpiredError) {
      window.AG_STORE.clearSession();
      setState(null);
      setTab('home');
      return true;
    }
    return false;
  }, [SYNC]);

  const markSynced = React.useCallback((ok, err) => {
    setSyncStatus(ok ? { state: 'ok' } : { state: 'error', message: err || '' });
    if (ok) {
      setState(s => s ? ({ ...s, settings: { ...s.settings, lastSyncAt: Date.now(), lastSyncError: '' } }) : s);
    } else {
      setState(s => s ? ({ ...s, settings: { ...s.settings, lastSyncError: err || '' } }) : s);
    }
  }, []);

  const pushAll = React.useCallback(async () => {
    const cur = stateRef.current;
    if (!cur || !SYNC.configured(cur.settings)) return;
    setSyncStatus({ state: 'busy' });
    try {
      await SYNC.pushConfig(cur.settings);
      await SYNC.pushBusy(cur.settings, cur.appointments);
      markSynced(true);
    } catch (e) {
      if (handleSyncError(e)) return;
      markSynced(false, e.message || String(e));
    }
  }, [SYNC, markSynced, handleSyncError]);

  // Debounced pushers — push busy when appointments change, config when relevant settings change.
  const pushBusyDebounced = React.useMemo(() => SYNC.debounce(async () => {
    const cur = stateRef.current;
    if (!cur || !SYNC.configured(cur.settings)) return;
    try {
      await SYNC.pushBusy(cur.settings, cur.appointments);
      markSynced(true);
    } catch (e) {
      if (handleSyncError(e)) return;
      markSynced(false, e.message || String(e));
    }
  }, 1500), [SYNC, markSynced, handleSyncError]);

  const pushConfigDebounced = React.useMemo(() => SYNC.debounce(async () => {
    const cur = stateRef.current;
    if (!cur || !SYNC.configured(cur.settings)) return;
    try {
      await SYNC.pushConfig(cur.settings);
      markSynced(true);
    } catch (e) {
      if (handleSyncError(e)) return;
      markSynced(false, e.message || String(e));
    }
  }, 1500), [SYNC, markSynced, handleSyncError]);

  // Trigger debounced busy push when appointments change
  const firstApptRun = React.useRef(true);
  React.useEffect(() => {
    if (firstApptRun.current) { firstApptRun.current = false; return; }
    pushBusyDebounced();
  }, [state?.appointments, pushBusyDebounced]);

  // Trigger debounced config push when booking settings change
  const bookingKey = state ? JSON.stringify({
    h: state.settings.hours, b: state.settings.bufferMin, a: state.settings.advanceMin,
    d: state.settings.maxDays, e: state.settings.publicEnabled, bk: state.settings.bookingsEnabled, s: state.settings.services,
    pt: state.settings.pageTitle, sp: state.settings.servicePrices,
  }) : '';
  const firstCfgRun = React.useRef(true);
  React.useEffect(() => {
    if (firstCfgRun.current) { firstCfgRun.current = false; return; }
    pushConfigDebounced();
  }, [bookingKey, pushConfigDebounced]);

  // Fetch inbox on mount + whenever user opens it
  const refreshInbox = React.useCallback(async () => {
    const cur = stateRef.current;
    if (!cur || !SYNC.configured(cur.settings)) return;
    setRefreshingInbox(true);
    try {
      const data = await SYNC.fetchInbox(cur.settings);
      const reqs = (data.requests || []).filter(r => r.status === 'pending');
      setState(s => s ? ({ ...s, inbox: reqs }) : s);
      markSynced(true);
    } catch (e) {
      if (!handleSyncError(e)) markSynced(false, e.message || String(e));
    } finally {
      setRefreshingInbox(false);
    }
  }, [SYNC, markSynced, handleSyncError]);

  React.useEffect(() => {
    if (hasSession) refreshInbox();
    // Periodic refresh while app is open.
    const h = setInterval(() => {
      const cur = stateRef.current;
      if (document.visibilityState === 'visible' && cur && SYNC.configured(cur.settings)) refreshInbox();
    }, 60000);
    return () => clearInterval(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession]);

  // ── Actions ────────────────────────────────────────────────────
  const openAppt = (a) => { setAppt(a); setTab('detail'); };
  const backHome = () => { setAppt(null); setEditing(null); setTab('home'); };
  const backToDetail = () => { setTab('detail'); setEditing(null); };

  const saveAppt = (a) => {
    setState(s => {
      const existing = s.appointments.findIndex(x => x.id === a.id);
      if (existing >= 0) {
        const next = [...s.appointments]; next[existing] = a;
        return { ...s, appointments: next };
      }
      const created = { ...a, id: window.AG_STORE.uid() };
      return { ...s, appointments: [...s.appointments, created] };
    });
    setEditing(null);
    setTab('cal');
  };

  const updateAppt = (a) => {
    setState(s => ({
      ...s,
      appointments: s.appointments.map(x => x.id === a.id ? a : x),
    }));
    setAppt(a);
    if (a.status === 'finalizat') {
      setState(s => {
        const hasIncome = s.income.some(i => i.apptId === a.id);
        if (hasIncome) return s;
        const entry = {
          id: window.AG_STORE.uid(),
          date: a.date,
          amount: a.rate,
          tip: 0,
          method: a.method,
          apptId: a.id,
          contact: a.contact,
        };
        return { ...s, income: [...s.income, entry] };
      });
    }
  };

  const deleteAppt = (id) => {
    setState(s => ({ ...s, appointments: s.appointments.filter(x => x.id !== id) }));
  };

  const saveIncome = (entry) => {
    setState(s => ({ ...s, income: [...s.income, { ...entry, id: window.AG_STORE.uid() }] }));
    setTab('home');
  };

  const addFlagged = (f) => {
    setState(s => ({ ...s, flagged: [{ ...f, id: window.AG_STORE.uid() }, ...s.flagged] }));
  };
  const removeFlagged = (id) => {
    setState(s => ({ ...s, flagged: s.flagged.filter(f => f.id !== id) }));
  };

  const updateSettings = (next) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...next } }));
  };

  // Approve a public request: create a local appointment and notify the worker.
  const approveRequest = async (r) => {
    const cur = stateRef.current;
    try {
      const res = await SYNC.decide(cur.settings, r.id, 'approved');
      if (res && res.conflict) {
        alert(T.alreadyDecided);
        setState(s => ({ ...s, inbox: s.inbox.filter(x => x.id !== r.id) }));
        return;
      }
      const startHH = `${String(Math.floor(r.start_min / 60)).padStart(2, '0')}:${String(r.start_min % 60).padStart(2, '0')}`;
      const endTotal = r.start_min + r.duration_min;
      const endHH = `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;
      const priceTable = cur.settings.servicePrices || {};
      const svcCfg = priceTable[r.service];
      let rate = 0;
      if (svcCfg) {
        if (svcCfg.flat) rate = Number(svcCfg.price) || 0;
        else {
          const row = (svcCfg.rows || []).find(x => Number(x.duration) === r.duration_min);
          rate = row ? Number(row.price) || 0 : 0;
        }
      }
      const appt = {
        id: window.AG_STORE.uid(),
        date: r.date, time: startHH, end: endHH, duration: r.duration_min,
        contact: r.name, service: r.service, rate,
        locationType: 'La mine', address: 'Apt. — principal',
        method: 'Numerar', status: 'confirmat',
        notes: (r.phone ? `Tel: ${r.phone}` : '') + (r.notes ? `\n${r.notes}` : ''),
      };
      setState(s => ({
        ...s,
        appointments: [...s.appointments, appt],
        inbox: s.inbox.filter(x => x.id !== r.id),
      }));
      markSynced(true);
    } catch (e) {
      if (handleSyncError(e)) return;
      markSynced(false, e.message || String(e));
      alert(e.message || T.syncError);
    }
  };

  const rejectRequest = async (r) => {
    const cur = stateRef.current;
    try {
      const res = await SYNC.decide(cur.settings, r.id, 'rejected');
      if (res && res.conflict) alert(T.alreadyDecided);
      setState(s => ({ ...s, inbox: s.inbox.filter(x => x.id !== r.id) }));
      markSynced(true);
    } catch (e) {
      if (handleSyncError(e)) return;
      markSynced(false, e.message || String(e));
      alert(e.message || T.syncError);
    }
  };

  const nav = (to) => {
    if (to === 'new') { setEditing(null); setTab('new'); }
    else { setTab(to); }
    if (to === 'inbox') refreshInbox();
  };

  window.__AG_C = c;

  // Not logged in → login screen only. Skip screen tree building since it
  // dereferences state fields that are null when logged out.
  if (!hasSession) {
    return (
      <div style={{ height: '100%', background: c.bg, color: c.ink, overflow: 'auto' }}>
        <LoginScreen c={c} workerUrl={state?.settings.workerUrl || ''} onLoggedIn={handleLoggedIn} />
      </div>
    );
  }

  let screen = null;
  if (tab === 'home')     screen = <HomeScreen c={c} state={state} onNav={nav} onOpenAppt={openAppt} pendingCount={(state.inbox || []).length} />;
  else if (tab === 'cal') screen = <CalendarScreen c={c} state={state} onOpenAppt={openAppt} />;
  else if (tab === 'detail') screen = <AppointmentDetail c={c} appt={appt} onBack={backHome} onUpdate={updateAppt} onDelete={deleteAppt} />;
  else if (tab === 'new') screen = <NewAppointmentScreen c={c} state={state} editing={editing} onCancel={editing ? backToDetail : backHome} onSave={saveAppt} />;
  else if (tab === 'money') screen = <AddIncomeScreen c={c} state={state} onCancel={backHome} onSave={saveIncome} />;
  else if (tab === 'stats') screen = <AnalyticsScreen c={c} state={state} />;
  else if (tab === 'flagged') screen = <FlaggedScreen c={c} state={state} onBack={backHome} onAdd={addFlagged} onRemove={removeFlagged} />;
  else if (tab === 'settings') screen = <SettingsScreen c={c} state={state} onBack={backHome} onUpdateSettings={updateSettings} onSyncNow={pushAll} syncStatus={syncStatus} onLogout={handleLogout} onOpenAlbum={() => setTab('album')} />;
  else if (tab === 'album') screen = <AlbumScreen c={c} state={state} onBack={() => setTab('settings')} onSessionExpired={handleLogout} />;
  else if (tab === 'inbox') screen = <InboxScreen c={c} state={state} onBack={backHome} onRefresh={refreshInbox} onApprove={approveRequest} onReject={rejectRequest} refreshing={refreshingInbox} />;

  const hiddenTabs = ['detail', 'flagged', 'settings', 'album', 'inbox', 'new'];
  const bottomTab = hiddenTabs.includes(tab) ? null : tab === 'money' ? 'money' : tab;

  return (
    <div style={{ height: '100%', background: c.bg, color: c.ink, position: 'relative', overflow: 'hidden', transition: 'background 200ms ease, color 200ms ease' }}>
      <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {screen}
      </div>
      {bottomTab != null && (
        <AgTabBar tab={bottomTab} onNav={nav} c={c} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
