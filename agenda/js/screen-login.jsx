// Agenda — Login screen. Shown when no valid session exists in settings.

function LoginScreen({ c, workerUrl, onLoggedIn }) {
  const T = window.AG_T;
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const data = await window.AG_SYNC.login(workerUrl, username.trim().toLowerCase(), password);
      onLoggedIn({
        session: data.session,
        sessionExpiresAt: data.expires_at,
        slug: data.slug,
        username: username.trim().toLowerCase(),
      });
    } catch (err) {
      if (err.status === 429) setError(T.loginRateLimited);
      else if (err.status === 401) setError(T.loginInvalid);
      else setError(T.loginError);
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100%', background: c.bg, color: c.ink, fontFamily: FONTS.ui,
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>
        {T.loginTitle}
      </div>
      <div style={{ fontFamily: FONTS.serif, fontSize: 30, marginTop: 4, letterSpacing: -0.5 }}>
        Agenda
      </div>
      <div style={{ fontSize: 13, color: c.muted, marginTop: 8, lineHeight: 1.5 }}>
        {T.loginSub}
      </div>

      <form onSubmit={submit} style={{
        marginTop: 28, background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3,
        padding: '18px 18px 16px',
      }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            {T.loginUsername}
          </div>
          <input
            type="text" value={username} onChange={e => setUsername(e.target.value)}
            autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck="false"
            style={inp(c, FONTS.mono, 14)}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            {T.loginPassword}
          </div>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            autoComplete="current-password" style={inp(c, FONTS.ui, 14)}
          />
        </div>
        {error && (
          <div style={{
            fontSize: 12, color: c.danger, background: '#f8eae6',
            padding: '8px 10px', borderRadius: 2, marginBottom: 10,
          }}>{error}</div>
        )}
        <button type="submit" disabled={busy || !username.trim() || !password} style={{
          width: '100%', padding: '13px', border: 'none',
          background: (busy || !username.trim() || !password) ? c.hairline : c.accent,
          color: (busy || !username.trim() || !password) ? c.muted : '#fff',
          borderRadius: 3, fontFamily: FONTS.ui, fontSize: 14, fontWeight: 600,
          letterSpacing: 0.3, cursor: busy ? 'wait' : 'pointer',
        }}>{busy ? '…' : T.loginSubmit}</button>
      </form>
    </div>
  );
}

Object.assign(window, { LoginScreen });
