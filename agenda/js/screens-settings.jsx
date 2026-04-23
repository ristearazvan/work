// Agenda — Settings and Inbox screens (public booking admin).

// ──────────────────────────────────────────────────────────────
// SETTINGS
// ──────────────────────────────────────────────────────────────
function SettingsScreen({ c, state, onBack, onUpdateSettings, onSyncNow, syncStatus, onLogout, onOpenAlbum }) {
  const T = window.AG_T;
  window.__AG_C = c;
  const s = state.settings;

  const setS = (patch) => onUpdateSettings({ ...s, ...patch });
  const hasToken = !!(s.session && s.session.trim());
  const bookingUrl = s.slug ? `${location.origin}/book/${s.slug}` : '';
  const copyBookingUrl = async () => {
    if (!bookingUrl) return;
    try { await navigator.clipboard.writeText(bookingUrl); } catch {}
  };
  const setHours = (dow, patch) => {
    const next = { ...(s.hours || {}) };
    const cur = next[dow] || { open: 600, close: 1320 };
    next[dow] = { ...cur, ...patch };
    setS({ hours: next });
  };
  const toggleClosed = (dow) => {
    const next = { ...(s.hours || {}) };
    next[dow] = next[dow] ? null : { open: 600, close: 1320 };
    setS({ hours: next });
  };
  const copyToAll = (dow) => {
    const src = s.hours?.[dow];
    const next = { ...(s.hours || {}) };
    [0,1,2,3,4,5,6].forEach(d => { if (d !== dow) next[d] = src ? { ...src } : null; });
    setS({ hours: next });
  };

  const fmtTime = (mins) => {
    const h = Math.floor((mins ?? 0) / 60);
    const m = (mins ?? 0) % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };
  const parseTime = (hhmm) => {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    return h * 60 + m;
  };

  const lastSyncLabel = (() => {
    if (syncStatus?.state === 'error') return `${T.syncError}: ${syncStatus.message || ''}`;
    if (!s.lastSyncAt) return T.syncNever;
    const diff = Math.floor((Date.now() - s.lastSyncAt) / 1000);
    return `${T.syncedJust} · ${T.ago(diff)}`;
  })();

  return (
    <div style={{ padding: '16px 0 140px', fontFamily: FONTS.ui, color: c.ink, background: c.bg, minHeight: '100%' }}>
      <div style={{ padding: '0 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ ...iconBtn(c), width: 34, height: 34 }} aria-label="Înapoi">{I.chevL(14, c.ink2)}</button>
        <div style={{ fontSize: 12, color: c.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>{T.settings}</div>
        <div style={{ width: 34 }} />
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>{T.settings}</div>
        <div style={{ fontFamily: FONTS.serif, fontSize: 28, marginTop: 2, letterSpacing: -0.4 }}>{T.settingsSub}</div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Account section */}
        <Section c={c} title={T.syncSection}>
          <FieldBlock label={T.accountLabel}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: c.ink }}>{s.username || '—'}</div>
          </FieldBlock>
          <FieldBlock label={T.bookingUrl}>
            <div onClick={copyBookingUrl} style={{
              fontFamily: FONTS.mono, fontSize: 12, color: c.accent, wordBreak: 'break-all',
              cursor: bookingUrl ? 'pointer' : 'default', padding: '8px 10px',
              border: `1px solid ${c.hairline}`, borderRadius: 2, background: c.surface2,
            }}>{bookingUrl || '—'}</div>
            <div style={{ fontSize: 11, color: c.muted, marginTop: 6 }}>{T.bookingUrlHint}</div>
          </FieldBlock>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onSyncNow} disabled={!hasToken} style={{
              flex: 1, padding: '12px', border: 'none',
              background: hasToken ? c.accent : c.hairline,
              borderRadius: 3, fontFamily: FONTS.ui, fontSize: 13, fontWeight: 600,
              color: hasToken ? '#fff' : c.muted,
              cursor: hasToken ? 'pointer' : 'not-allowed',
              letterSpacing: 0.3,
            }}>{T.syncNow}</button>
            <button onClick={onLogout} style={{
              padding: '12px 16px', border: `1px solid ${c.hairline}`, background: c.surface,
              borderRadius: 3, fontFamily: FONTS.ui, fontSize: 12, color: c.ink2, cursor: 'pointer',
              letterSpacing: 0.3,
            }}>{T.logout}</button>
          </div>
          <div style={{ fontSize: 11, color: syncStatus?.state === 'error' ? c.danger : c.muted, marginTop: 10 }}>
            {lastSyncLabel}
          </div>
        </Section>

        {/* Album submenu */}
        <Section c={c} title={T.album}>
          <div style={{ fontSize: 12, color: c.muted, marginBottom: 12, lineHeight: 1.5 }}>{T.albumSub}</div>
          <button onClick={onOpenAlbum} style={{
            width: '100%', padding: '12px', border: `1px solid ${c.hairline}`, background: c.surface,
            borderRadius: 3, fontFamily: FONTS.ui, fontSize: 13, color: c.ink, cursor: 'pointer',
            letterSpacing: 0.3, fontWeight: 500,
          }}>{T.albumManage}</button>
        </Section>

        {/* Booking section */}
        <Section c={c} title={T.bookingSection}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: `1px solid ${c.hairline2}`,
          }}>
            <div>
              <div style={{ fontSize: 13, color: c.ink, fontWeight: 500 }}>{T.publicEnabled}</div>
              <div style={{ fontSize: 11, color: c.muted, marginTop: 3 }}>{T.publicEnabledHint}</div>
            </div>
            <Toggle c={c} on={!!s.publicEnabled} onClick={() => setS({ publicEnabled: !s.publicEnabled })} />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: `1px solid ${c.hairline2}`,
            opacity: s.publicEnabled ? 1 : 0.4,
          }}>
            <div>
              <div style={{ fontSize: 13, color: c.ink, fontWeight: 500 }}>{T.bookingsEnabled}</div>
              <div style={{ fontSize: 11, color: c.muted, marginTop: 3 }}>{T.bookingsEnabledHint}</div>
            </div>
            <Toggle c={c} on={s.bookingsEnabled !== false} onClick={() => setS({ bookingsEnabled: !(s.bookingsEnabled !== false) })} />
          </div>

          <FieldBlock label={T.pageTitle}>
            <input type="text" maxLength={60} value={s.pageTitle || ''} placeholder={T.pageTitlePlaceholder}
              onChange={e => setS({ pageTitle: e.target.value.slice(0, 60) })}
              style={inp(c, FONTS.ui, 14)} />
            <div style={{ fontSize: 11, color: c.muted, marginTop: 6 }}>{T.pageTitleHint}</div>
          </FieldBlock>

          <FieldBlock label={T.workingHours}>
            <div style={{ fontSize: 11, color: c.muted, marginBottom: 12 }}>{T.workingHoursHint}</div>
            {[1,2,3,4,5,6,0].map(dow => {
              const h = s.hours?.[dow];
              const closed = !h;
              return (
                <div key={dow} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, rowGap: 6, padding: '8px 0', borderTop: `1px solid ${c.hairline2}` }}>
                  <div style={{ flex: '1 0 100%', fontSize: 11, color: c.muted, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>{T.weekdayLong[dow]}</div>
                  {closed ? (
                    <>
                      <div style={{ flex: 1, fontSize: 12, color: c.muted, fontStyle: 'italic' }}>{T.closed}</div>
                      <button onClick={() => toggleClosed(dow)} style={miniBtn(c)}>{T.open}</button>
                    </>
                  ) : (
                    <>
                      <input type="time" value={fmtTime(h.open)} onChange={e => setHours(dow, { open: parseTime(e.target.value) })}
                        style={{ ...inp(c, FONTS.ui, 13), padding: '8px 10px', flex: '1 1 90px', minWidth: 0 }} />
                      <span style={{ fontSize: 11, color: c.muted }}>–</span>
                      <input type="time" value={fmtTime(h.close)} onChange={e => setHours(dow, { close: parseTime(e.target.value) })}
                        style={{ ...inp(c, FONTS.ui, 13), padding: '8px 10px', flex: '1 1 90px', minWidth: 0 }} />
                      <button onClick={() => toggleClosed(dow)} style={miniBtn(c)} title={T.close} aria-label={T.close}>✕</button>
                      <button onClick={() => copyToAll(dow)} style={miniBtn(c)} title={T.copyToAll} aria-label={T.copyToAll}>⇅</button>
                    </>
                  )}
                </div>
              );
            })}
          </FieldBlock>

          <FieldBlock label={`${T.bufferMin} (${T.mins})`}>
            <input type="number" min="0" max="120" value={s.bufferMin ?? 15}
              onChange={e => setS({ bufferMin: Math.max(0, Math.min(120, Number(e.target.value) || 0)) })}
              style={inp(c, FONTS.ui, 14)} />
          </FieldBlock>
          <FieldBlock label={`${T.advanceMin} (${T.mins})`}>
            <input type="number" min="0" max="1440" value={s.advanceMin ?? 30}
              onChange={e => setS({ advanceMin: Math.max(0, Math.min(1440, Number(e.target.value) || 0)) })}
              style={inp(c, FONTS.ui, 14)} />
          </FieldBlock>
          <FieldBlock label={`${T.maxDays} (${T.days})`}>
            <input type="number" min="1" max="30" value={s.maxDays ?? 7}
              onChange={e => setS({ maxDays: Math.max(1, Math.min(30, Number(e.target.value) || 7)) })}
              style={inp(c, FONTS.ui, 14)} />
          </FieldBlock>
        </Section>

        {/* Data section — destructive */}
        <Section c={c} title={T.dataSection}>
          <div style={{ fontSize: 12, color: c.muted, marginBottom: 12, lineHeight: 1.5 }}>{T.clearDataDesc}</div>
          <button onClick={async () => {
            if (!window.confirm(T.clearDataConfirm)) return;
            // Wipe remote D1 (busy blocks + requests) if the Worker sync is configured,
            // otherwise the /book page will still show previously-taken slots as busy.
            try {
              const res = await window.AG_SYNC.resetRemote(s);
              if (res && res.skipped !== true && res.ok !== true) {
                if (!window.confirm(T.resetRemoteFailed)) return;
              }
            } catch (e) {
              if (!window.confirm(T.resetRemoteFailed + ' (' + (e.message || e) + ')')) return;
            }
            try {
              window.AG_STORE.saveStateFor(s.slug, {
                settings: window.AG_STORE.DEFAULT_SETTINGS,
                appointments: [], income: [], flagged: [], inbox: [],
              });
            } catch (e) {}
            window.location.reload();
          }} disabled={!hasToken} style={{
            width: '100%', padding: '12px',
            border: `1px solid ${hasToken ? c.danger : c.hairline}`,
            background: 'transparent', borderRadius: 3, fontFamily: FONTS.ui, fontSize: 12, fontWeight: 500,
            color: hasToken ? c.danger : c.muted,
            cursor: hasToken ? 'pointer' : 'not-allowed',
            letterSpacing: 0.3,
          }}>{T.clearData}</button>
        </Section>

        {/* Services section — names, flat/timed, per-duration prices */}
        <Section c={c} title={T.servicesSection}>
          <div style={{ fontSize: 11, color: c.muted, marginBottom: 14, lineHeight: 1.5 }}>{T.servicesHint}</div>
          <ServicesEditor c={c} s={s} setS={setS} T={T} />
        </Section>
      </div>
    </div>
  );
}

function Section({ c, title, children }) {
  return (
    <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: c.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function Toggle({ c, on, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 42, height: 24, borderRadius: 12, border: 'none',
      background: on ? c.accent : c.hairline, cursor: 'pointer', position: 'relative',
      transition: 'background 200ms ease',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)', transition: 'left 200ms ease',
      }} />
    </button>
  );
}

function miniBtn(c) {
  return {
    padding: '6px 10px', border: `1px solid ${c.hairline}`, background: c.surface,
    borderRadius: 2, fontFamily: FONTS.ui, fontSize: 11, color: c.ink2, cursor: 'pointer',
  };
}

// ──────────────────────────────────────────────────────────────
// INBOX — pending public booking requests
// ──────────────────────────────────────────────────────────────
function InboxScreen({ c, state, onBack, onRefresh, onApprove, onReject, refreshing }) {
  const T = window.AG_T;
  const requests = state.inbox || [];

  const fmtTime = (mins) => `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;

  return (
    <div style={{ padding: '16px 0 140px', fontFamily: FONTS.ui, color: c.ink, background: c.bg, minHeight: '100%' }}>
      <div style={{ padding: '0 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ ...iconBtn(c), width: 34, height: 34 }} aria-label="Înapoi">{I.chevL(14, c.ink2)}</button>
        <div style={{ fontSize: 12, color: c.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>{T.inbox}</div>
        <button onClick={onRefresh} disabled={refreshing} style={{ ...iconBtn(c), width: 34, height: 34, opacity: refreshing ? 0.4 : 1 }} aria-label="Reîmprospătează">
          {I.chevR(14, c.ink2)}
        </button>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>{T.inbox}</div>
        <div style={{ fontFamily: FONTS.serif, fontSize: 28, marginTop: 2, letterSpacing: -0.4 }}>
          {requests.length} {requests.length === 1 ? T.newRequest : T.newRequestsN}
        </div>
        <div style={{ fontSize: 12, color: c.muted, marginTop: 6, lineHeight: 1.5 }}>{T.inboxSub}</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {requests.length === 0 ? (
          <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3 }}>
            <Empty c={c} title={T.inboxEmpty} hint={T.inboxEmptyHint} />
          </div>
        ) : (
          requests.map(r => {
            const ageSec = Math.max(0, Math.floor(Date.now() / 1000) - r.created_at);
            const d = window.parseISO(r.date);
            return (
              <div key={r.id} style={{
                background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3,
                padding: '16px', marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 20, letterSpacing: -0.2 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: c.muted }}>{T.ago(ageSec)}</div>
                </div>
                <div style={{ fontSize: 13, color: c.ink2, fontFamily: FONTS.mono, marginBottom: 10 }}>{r.phone}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <Chip c={c} tone="accent">{r.service}</Chip>
                  <Chip c={c}>{r.duration_min}m</Chip>
                  <Chip c={c}>{window.fmtShort(r.date)}</Chip>
                  <Chip c={c}>{fmtTime(r.start_min)}–{fmtTime(r.start_min + r.duration_min)}</Chip>
                </div>
                {r.notes && (
                  <div style={{
                    fontSize: 13, color: c.ink2, lineHeight: 1.5,
                    padding: '10px 12px', background: c.surface2, borderRadius: 2, marginBottom: 10,
                    whiteSpace: 'pre-wrap',
                  }}>{r.notes}</div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onReject(r)} style={{
                    flex: 1, padding: '12px', border: `1px solid ${c.hairline}`, background: c.surface,
                    borderRadius: 3, fontFamily: FONTS.ui, fontSize: 13, color: c.danger, cursor: 'pointer',
                    letterSpacing: 0.3,
                  }}>{T.reject}</button>
                  <button onClick={() => onApprove(r)} style={{
                    flex: 1, padding: '12px', border: 'none', background: c.accent,
                    borderRadius: 3, fontFamily: FONTS.ui, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
                    letterSpacing: 0.3,
                  }}>{T.approve}</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ServicesEditor({ c, s, setS, T }) {
  const PRICE_DURATIONS = window.AG_STORE.PRICE_DURATIONS;
  const services = s.services || [];
  const prices = s.servicePrices || {};
  const [newName, setNewName] = React.useState('');
  const [error, setError] = React.useState('');

  const writeSvc = (name, cfg) => {
    const next = { ...prices };
    next[name] = cfg;
    setS({ servicePrices: next });
  };

  const setFlat = (name, flat) => {
    const cur = prices[name] || { flat: false, rows: [] };
    if (flat) {
      const row = (cur.rows || [])[0];
      writeSvc(name, { flat: true, duration: row?.duration || 180, price: row?.price || 0 });
    } else {
      writeSvc(name, { flat: false, rows: cur.duration ? [{ duration: cur.duration, price: cur.price || 0 }] : [] });
    }
  };

  const setRow = (name, idx, patch) => {
    const cur = prices[name] || { flat: false, rows: [] };
    const rows = (cur.rows || []).map((r, i) => i === idx ? { ...r, ...patch } : r);
    writeSvc(name, { ...cur, rows });
  };

  const removeRow = (name, idx) => {
    const cur = prices[name] || { flat: false, rows: [] };
    writeSvc(name, { ...cur, rows: (cur.rows || []).filter((_, i) => i !== idx) });
  };

  const addRow = (name) => {
    const cur = prices[name] || { flat: false, rows: [] };
    const used = new Set((cur.rows || []).map(r => r.duration));
    const next = PRICE_DURATIONS.find(d => !used.has(d));
    if (next == null) return;
    writeSvc(name, { ...cur, rows: [...(cur.rows || []), { duration: next, price: 0 }] });
  };

  const addService = () => {
    const name = newName.trim().slice(0, 40);
    if (!name) return setError(T.invalidServiceName);
    if (services.includes(name)) return setError(T.duplicateService);
    if (services.length >= 12) return;
    setError('');
    setNewName('');
    const nextServices = [...services, name];
    const nextPrices = { ...prices, [name]: { flat: false, rows: [] } };
    setS({ services: nextServices, servicePrices: nextPrices });
  };

  const removeService = (name) => {
    const nextServices = services.filter(n => n !== name);
    const nextPrices = { ...prices };
    delete nextPrices[name];
    setS({ services: nextServices, servicePrices: nextPrices });
  };

  return (
    <div>
      {services.map(name => {
        const cfg = prices[name] || { flat: false, rows: [] };
        const usedCount = (cfg.rows || []).length;
        return (
          <div key={name} style={{ marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${c.hairline2}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ fontFamily: FONTS.serif, fontSize: 16, color: c.ink, flex: 1 }}>{name}</div>
              <button onClick={() => setFlat(name, false)} style={segBtn(c, !cfg.flat)} title={T.serviceTimed}>{T.serviceTimed}</button>
              <button onClick={() => setFlat(name, true)} style={segBtn(c, !!cfg.flat)} title={T.serviceFlat}>{T.serviceFlat}</button>
              <button onClick={() => removeService(name)} style={{
                padding: '6px 10px', border: `1px solid ${c.hairline}`, background: 'transparent',
                borderRadius: 2, fontFamily: FONTS.ui, fontSize: 11, color: c.danger, cursor: 'pointer',
              }}>✕</button>
            </div>

            {cfg.flat ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={miniLabel(c)}>{T.flatDuration}</div>
                  <select value={cfg.duration || 180}
                    onChange={e => writeSvc(name, { ...cfg, duration: Number(e.target.value) })}
                    style={{ ...inp(c, FONTS.ui, 13), padding: '8px 10px' }}>
                    {PRICE_DURATIONS.map(d => <option key={d} value={d}>{d} {T.mins}</option>)}
                  </select>
                </div>
                <div>
                  <div style={miniLabel(c)}>{T.flatPrice} ({T.ron})</div>
                  <input type="number" inputMode="numeric" min="0" step="10"
                    value={cfg.price ? cfg.price : ''} placeholder="0"
                    onChange={e => writeSvc(name, { ...cfg, price: Math.max(0, Number(e.target.value) || 0) })}
                    style={{ ...inp(c, FONTS.ui, 13), padding: '8px 10px' }} />
                </div>
              </div>
            ) : (
              <div>
                {(cfg.rows || []).map((row, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <select value={row.duration}
                      onChange={e => setRow(name, idx, { duration: Number(e.target.value) })}
                      style={{ ...inp(c, FONTS.ui, 13), padding: '8px 10px', width: 88 }}>
                      {PRICE_DURATIONS.map(d => <option key={d} value={d}>{d} {T.mins}</option>)}
                    </select>
                    <input type="number" inputMode="numeric" min="0" step="10"
                      value={row.price ? row.price : ''} placeholder="0"
                      onChange={e => setRow(name, idx, { price: Math.max(0, Number(e.target.value) || 0) })}
                      style={{ ...inp(c, FONTS.ui, 13), padding: '8px 10px', flex: 1 }} />
                    <span style={{ fontSize: 11, color: c.muted }}>{T.ron}</span>
                    <button onClick={() => removeRow(name, idx)} style={{
                      padding: '6px 10px', border: `1px solid ${c.hairline}`, background: 'transparent',
                      borderRadius: 2, fontFamily: FONTS.ui, fontSize: 11, color: c.danger, cursor: 'pointer',
                    }}>✕</button>
                  </div>
                ))}
                <button onClick={() => addRow(name)} disabled={usedCount >= PRICE_DURATIONS.length} style={{
                  width: '100%', marginTop: 4, padding: '8px', border: `1px dashed ${c.hairline}`,
                  background: 'transparent', borderRadius: 2, fontFamily: FONTS.ui, fontSize: 12,
                  color: usedCount >= PRICE_DURATIONS.length ? c.muted : c.ink2,
                  cursor: usedCount >= PRICE_DURATIONS.length ? 'not-allowed' : 'pointer',
                }}>+ {T.addDuration}</button>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input type="text" maxLength={40} value={newName} placeholder={T.addServicePlaceholder}
          onChange={e => { setNewName(e.target.value); if (error) setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') addService(); }}
          style={{ ...inp(c, FONTS.ui, 13), padding: '10px 12px', flex: 1 }} />
        <button onClick={addService} disabled={services.length >= 12} style={{
          padding: '10px 14px', border: 'none', background: services.length >= 12 ? c.hairline : c.accent,
          borderRadius: 3, fontFamily: FONTS.ui, fontSize: 13, fontWeight: 600, color: '#fff',
          cursor: services.length >= 12 ? 'not-allowed' : 'pointer',
        }}>+ {T.addService}</button>
      </div>
      {error && <div style={{ fontSize: 11, color: c.danger, marginTop: 6 }}>{error}</div>}
    </div>
  );
}

function segBtn(c, active) {
  return {
    padding: '6px 10px', border: `1px solid ${active ? c.ink : c.hairline}`,
    background: active ? c.ink : c.surface, borderRadius: 2,
    fontFamily: FONTS.ui, fontSize: 11, color: active ? c.bg : c.ink2, cursor: 'pointer',
    letterSpacing: 0.3,
  };
}

function miniLabel(c) {
  return { fontSize: 10, color: c.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 };
}

Object.assign(window, { SettingsScreen, InboxScreen });
