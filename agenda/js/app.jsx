// Agenda — root App: routing, state, theme, persistence

function App() {
  const T = window.AG_T;
  const [state, setState] = React.useState(() => window.AG_STORE.loadState());
  const [tab, setTab] = React.useState('home');
  const [appt, setAppt] = React.useState(null);
  const [editing, setEditing] = React.useState(null);

  const theme = state.settings.theme === 'dark' ? 'dark' : 'light';
  const c = AG[theme];

  // persist on every state change
  React.useEffect(() => { window.AG_STORE.saveState(state); }, [state]);

  // sync theme-color meta
  React.useEffect(() => {
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.setAttribute('content', c.bg);
    document.body.style.background = c.bg;
  }, [c.bg]);

  // light bulb dispatches this event
  React.useEffect(() => {
    const toggle = () => {
      setState(s => ({ ...s, settings: { ...s.settings, theme: s.settings.theme === 'dark' ? 'light' : 'dark' } }));
    };
    window.addEventListener('agenda-toggle-theme', toggle);
    return () => window.removeEventListener('agenda-toggle-theme', toggle);
  }, []);

  // Actions
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
    // auto-create income entry when marking complete
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

  const nav = (to) => {
    if (to === 'new') { setEditing(null); setTab('new'); }
    else { setTab(to); }
  };

  let screen = null;
  if (tab === 'home')     screen = <HomeScreen c={c} state={state} onNav={nav} onOpenAppt={openAppt} />;
  else if (tab === 'cal') screen = <CalendarScreen c={c} state={state} onOpenAppt={openAppt} />;
  else if (tab === 'detail') screen = <AppointmentDetail c={c} appt={appt} onBack={backHome} onUpdate={updateAppt} onDelete={deleteAppt} />;
  else if (tab === 'new') screen = <NewAppointmentScreen c={c} state={state} editing={editing} onCancel={editing ? backToDetail : backHome} onSave={saveAppt} />;
  else if (tab === 'money') screen = <AddIncomeScreen c={c} state={state} onCancel={backHome} onSave={saveIncome} />;
  else if (tab === 'stats') screen = <AnalyticsScreen c={c} state={state} />;
  else if (tab === 'flagged') screen = <FlaggedScreen c={c} state={state} onBack={backHome} onAdd={addFlagged} onRemove={removeFlagged} />;

  const bottomTab = tab === 'detail' ? 'home' : tab === 'flagged' ? 'home' : tab === 'money' ? 'money' : tab === 'new' ? null : tab;

  // Expose current theme to primitives (FieldBlock etc. need c)
  window.__AG_C = c;

  return (
    <div style={{ height: '100%', background: c.bg, color: c.ink, position: 'relative', overflow: 'hidden', transition: 'background 200ms ease, color 200ms ease' }}>
      <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {screen}
      </div>
      {tab !== 'new' && tab !== 'detail' && (
        <AgTabBar tab={bottomTab} onNav={nav} c={c} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
