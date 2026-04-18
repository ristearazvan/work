// Agenda — secondary screens (New Appt, Add Income, Analytics, Flagged)

// ──────────────────────────────────────────────────────────────
// NEW / EDIT APPOINTMENT
// ──────────────────────────────────────────────────────────────
function NewAppointmentScreen({ c, state, editing, onCancel, onSave }) {
  const T = window.AG_T;
  window.__AG_C = c;
  const todayIso = new Date().toISOString().slice(0, 10);
  const nextHour = (() => {
    const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1);
    return `${String(d.getHours()).padStart(2, '0')}:00`;
  })();

  const init = editing || {
    id: null, date: todayIso, time: nextHour, duration: 60,
    contact: '', service: 'Standard', rate: 300,
    locationType: 'La mine', address: 'Apt. — principal',
    method: 'Numerar', status: 'confirmat', notes: '',
  };

  const [form, setForm] = React.useState(init);
  const [err, setErr] = React.useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const hourly = form.duration > 0 ? Math.round((form.rate / form.duration) * 60) : 0;

  const handleSave = () => {
    if (!form.contact.trim() || !form.rate || form.rate <= 0) {
      setErr(T.fillRequired);
      return;
    }
    const end = addMinutes(form.time, form.duration);
    onSave({ ...form, end, rate: Number(form.rate), duration: Number(form.duration) });
  };

  const disabled = !form.contact.trim() || !form.rate || form.rate <= 0;

  return (
    <div style={{ padding: '16px 0 140px', fontFamily: FONTS.ui, color: c.ink, background: c.bg, minHeight: '100%' }}>
      <div style={{ padding: '0 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onCancel} style={{ fontSize: 14, color: c.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONTS.ui, padding: 0 }}>{T.cancel}</button>
        <div style={{ fontSize: 12, color: c.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>{editing ? T.reschedule : T.newBooking}</div>
        <button onClick={handleSave} disabled={disabled} style={{
          fontSize: 14, color: c.accent, background: 'none', border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          fontFamily: FONTS.ui, padding: 0, fontWeight: 600,
        }}>{T.save}</button>
      </div>

      <div style={{ padding: '0 16px' }}>
        {err && <div style={{ background: c.accentSoft, color: c.danger, padding: '10px 12px', borderRadius: 3, fontSize: 12, marginBottom: 14 }}>{err}</div>}

        <FieldBlock label={T.contact}>
          <input placeholder={T.contactPh} value={form.contact} onChange={e => set('contact', e.target.value)}
            style={inp(c, FONTS.serif, 20)} />
          <div style={{ fontSize: 11, color: c.muted, marginTop: 6 }}>{T.contactHint}</div>
        </FieldBlock>

        <FieldBlock label={T.when}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inp(c, FONTS.ui, 14)} />
            <input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={inp(c, FONTS.ui, 14)} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {[30, 45, 60, 90, 120, 180].map(m => (
              <button key={m} onClick={() => set('duration', m)} style={{ ...seg(c, form.duration === m), flex: '1 0 60px' }}>
                {m}m
              </button>
            ))}
          </div>
        </FieldBlock>

        <FieldBlock label={T.service}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {T.services.map(s => (
              <button key={s} onClick={() => set('service', s)} style={{ ...seg(c, form.service === s), flex: '1 0 80px' }}>{s}</button>
            ))}
          </div>
        </FieldBlock>

        <FieldBlock label={T.rate}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8,
            background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3, padding: '14px 16px',
          }}>
            <input type="number" inputMode="numeric" value={form.rate} onChange={e => set('rate', e.target.value === '' ? '' : +e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: FONTS.serif, fontSize: 28, color: c.ink, padding: 0,
                fontVariantNumeric: 'tabular-nums', minWidth: 0,
              }} />
            <span style={{ fontSize: 16, color: c.muted, letterSpacing: 0.5 }}>RON</span>
            {form.duration > 0 && form.rate > 0 && (
              <span style={{ fontSize: 12, color: c.muted, fontVariantNumeric: 'tabular-nums', marginLeft: 8 }}>≈ {money(hourly)}/oră</span>
            )}
          </div>
        </FieldBlock>

        <FieldBlock label={T.location}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {T.locationTypes.map(l => (
              <button key={l} onClick={() => set('locationType', l)} style={seg(c, form.locationType === l)}>{l}</button>
            ))}
          </div>
          <input placeholder={T.addressPh} value={form.address} onChange={e => set('address', e.target.value)}
            style={inp(c, FONTS.ui, 14)} />
        </FieldBlock>

        <FieldBlock label={T.payment}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {T.paymentTypes.map(p => (
              <button key={p} onClick={() => set('method', p)} style={seg(c, form.method === p)}>{p}</button>
            ))}
          </div>
        </FieldBlock>

        <FieldBlock label={T.notes}>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder={T.notesPh}
            style={{ ...inp(c, FONTS.ui, 14), resize: 'vertical', lineHeight: 1.5 }} />
        </FieldBlock>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ADD INCOME
// ──────────────────────────────────────────────────────────────
function AddIncomeScreen({ c, state, onCancel, onSave }) {
  const T = window.AG_T;
  window.__AG_C = c;
  const todayIso = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = React.useState('');
  const [tip, setTip] = React.useState('0');
  const [method, setMethod] = React.useState('Numerar');
  const [link, setLink] = React.useState(T.linkOpts[2]);
  const [apptId, setApptId] = React.useState(null);
  const [contact, setContact] = React.useState('');
  const [err, setErr] = React.useState('');

  const recent = [...state.income]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 6);

  const openAppts = state.appointments
    .filter(a => a.status !== 'anulat')
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .slice(0, 10);

  const handleSave = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { setErr(T.amountRequired); return; }
    let resolvedContact = contact.trim();
    if (link === T.linkOpts[0] && apptId) {
      const a = state.appointments.find(x => x.id === apptId);
      if (a) resolvedContact = a.contact;
    }
    onSave({
      date: todayIso,
      amount: amt,
      tip: Number(tip) || 0,
      method,
      apptId: link === T.linkOpts[0] ? apptId : null,
      contact: resolvedContact || (apptId ? '' : '—'),
    });
  };

  return (
    <div style={{ padding: '16px 0 140px', fontFamily: FONTS.ui, color: c.ink, background: c.bg, minHeight: '100%' }}>
      <div style={{ padding: '0 16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onCancel} style={{ fontSize: 14, color: c.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONTS.ui, padding: 0 }}>{T.cancel}</button>
        <div style={{ fontSize: 12, color: c.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>{T.income}</div>
        <button onClick={handleSave} style={{ fontSize: 14, color: c.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONTS.ui, padding: 0, fontWeight: 600 }}>{T.save}</button>
      </div>

      <div style={{ padding: '10px 20px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500, marginBottom: 12 }}>{T.amountReceived}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, borderBottom: `1px solid ${c.hairline}`, paddingBottom: 8 }}>
          <input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
            style={{
              width: 220, maxWidth: '70%', border: 'none', outline: 'none', background: 'transparent',
              fontFamily: FONTS.serif, fontSize: 68, color: c.ink, letterSpacing: -2,
              fontVariantNumeric: 'tabular-nums', lineHeight: 1, textAlign: 'right', padding: 0,
            }} />
          <span style={{ fontFamily: FONTS.serif, fontSize: 26, color: c.muted, letterSpacing: 0.5 }}>RON</span>
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 12, color: c.muted }}>
          <span>{T.plusTip}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <input type="number" inputMode="decimal" value={tip} onChange={e => setTip(e.target.value)}
              style={{ width: 50, border: 'none', borderBottom: `1px solid ${c.hairline}`, background: 'transparent', outline: 'none', fontFamily: FONTS.ui, color: c.ink, fontSize: 13, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }} />
            <span style={{ fontSize: 11, color: c.muted }}>RON</span>
          </div>
        </div>
        {err && <div style={{ color: c.danger, fontSize: 12, marginTop: 10 }}>{err}</div>}
      </div>

      <div style={{ padding: '0 16px' }}>
        <FieldBlock label={T.method}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {T.paymentTypes.map(p => (
              <button key={p} onClick={() => setMethod(p)} style={seg(c, method === p)}>{p}</button>
            ))}
          </div>
        </FieldBlock>

        <FieldBlock label={T.linkTo}>
          <div style={{ display: 'flex', gap: 6 }}>
            {T.linkOpts.map(l => (
              <button key={l} onClick={() => { setLink(l); if (l !== T.linkOpts[0]) setApptId(null); }} style={seg(c, link === l)}>{l}</button>
            ))}
          </div>
          {link === T.linkOpts[0] && (
            <div style={{ marginTop: 10, background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3, maxHeight: 220, overflow: 'auto' }}>
              {openAppts.length === 0 && <div style={{ padding: 14, fontSize: 12, color: c.muted }}>{T.noData}</div>}
              {openAppts.map(a => {
                const active = apptId === a.id;
                return (
                  <button key={a.id} onClick={() => setApptId(a.id)} style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: active ? c.accentSoft : 'transparent',
                    border: 'none', borderBottom: `1px solid ${c.hairline2}`, cursor: 'pointer',
                    color: c.ink, textAlign: 'left', fontFamily: FONTS.ui,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.contact}</div>
                      <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{fmtShort(a.date)} · {a.time}</div>
                    </div>
                    <div style={{ fontFamily: FONTS.serif, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{money(a.rate)}</div>
                  </button>
                );
              })}
            </div>
          )}
          {link === T.linkOpts[1] && (
            <input placeholder={T.contactPh} value={contact} onChange={e => setContact(e.target.value)}
              style={{ ...inp(c, FONTS.ui, 14), marginTop: 10 }} />
          )}
        </FieldBlock>

        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 10, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>{T.recentEntries}</div>
          <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3 }}>
            {recent.length === 0 && <div style={{ padding: 18, fontSize: 13, color: c.muted, textAlign: 'center' }}>{T.noRecent}</div>}
            {recent.map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px',
                borderBottom: i < recent.length - 1 ? `1px solid ${c.hairline2}` : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: c.ink, fontWeight: 500 }}>{r.contact || '—'}</div>
                  <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{fmtShort(r.date)} · {r.method}</div>
                </div>
                <div style={{ fontFamily: FONTS.serif, fontSize: 16, color: c.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {money(r.amount + (r.tip || 0))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ANALYTICS
// ──────────────────────────────────────────────────────────────
function AnalyticsScreen({ c, state }) {
  const T = window.AG_T;
  const [period, setPeriod] = React.useState(1); // Săpt, Lună, Trimestru, An
  const now = new Date();
  const thisMonth = now.getMonth(), thisYear = now.getFullYear();

  const withinPeriod = (iso) => {
    const d = parseISO(iso);
    if (period === 0) { // week
      const ws = startOfWeek(now);
      const we = new Date(ws); we.setDate(we.getDate() + 7);
      return d >= ws && d < we;
    }
    if (period === 1) return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    if (period === 2) {
      const q = Math.floor(thisMonth / 3);
      const m = d.getMonth();
      return d.getFullYear() === thisYear && Math.floor(m / 3) === q;
    }
    return d.getFullYear() === thisYear;
  };

  const incomeInPeriod = state.income.filter(i => withinPeriod(i.date));
  const apptsInPeriod = state.appointments.filter(a => withinPeriod(a.date) && a.status !== 'anulat');
  const completedInPeriod = apptsInPeriod.filter(a => a.status === 'finalizat');

  const revenue = incomeInPeriod.reduce((s, i) => s + i.amount + (i.tip || 0), 0);

  // previous period for delta
  const prevPeriod = (iso) => {
    const d = parseISO(iso);
    if (period === 0) {
      const ws = startOfWeek(now); const prevStart = new Date(ws); prevStart.setDate(prevStart.getDate() - 7);
      return d >= prevStart && d < ws;
    }
    if (period === 1) {
      const m = thisMonth === 0 ? 11 : thisMonth - 1;
      const y = thisMonth === 0 ? thisYear - 1 : thisYear;
      return d.getFullYear() === y && d.getMonth() === m;
    }
    if (period === 2) {
      const q = Math.floor(thisMonth / 3) - 1;
      const y = q < 0 ? thisYear - 1 : thisYear;
      const qq = q < 0 ? 3 : q;
      return d.getFullYear() === y && Math.floor(d.getMonth() / 3) === qq;
    }
    return d.getFullYear() === thisYear - 1;
  };
  const prevRevenue = state.income.filter(i => prevPeriod(i.date)).reduce((s, i) => s + i.amount + (i.tip || 0), 0);
  const delta = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;

  // hourly avg
  const totalMinutes = completedInPeriod.reduce((s, a) => s + a.duration, 0);
  const completedRevenue = completedInPeriod.reduce((s, a) => s + a.rate, 0);
  const hourlyAvg = totalMinutes > 0 ? Math.round((completedRevenue / totalMinutes) * 60) : 0;

  // repeat rate
  const contactCounts = {};
  apptsInPeriod.forEach(a => { contactCounts[a.contact] = (contactCounts[a.contact] || 0) + 1; });
  const totalContacts = Object.keys(contactCounts).length;
  const repeats = Object.values(contactCounts).filter(n => n >= 2).length;
  const repeatRate = totalContacts > 0 ? Math.round((repeats / totalContacts) * 100) : 0;

  // monthly bars — last 6 months
  const bars = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(thisYear, thisMonth - i, 1);
    const y = d.getFullYear(), m = d.getMonth();
    const v = state.income.filter(it => {
      const id = parseISO(it.date);
      return id.getFullYear() === y && id.getMonth() === m;
    }).reduce((s, it) => s + it.amount + (it.tip || 0), 0);
    bars.push({ m: T.months[m], v, current: i === 0 });
  }
  const maxV = Math.max(1, ...bars.map(b => b.v));

  // Payment mix
  const methodTotals = {};
  incomeInPeriod.forEach(i => { methodTotals[i.method] = (methodTotals[i.method] || 0) + i.amount + (i.tip || 0); });
  const totalPay = Object.values(methodTotals).reduce((s, v) => s + v, 0);
  const pct = (m) => totalPay === 0 ? 0 : Math.round(((methodTotals[m] || 0) / totalPay) * 100);
  const cashPct = pct('Numerar'), trPct = pct('Transfer');
  const otherPct = Math.max(0, 100 - cashPct - trPct);

  // Top contacts
  const byContact = {};
  apptsInPeriod.forEach(a => {
    if (!byContact[a.contact]) byContact[a.contact] = { label: a.contact, visits: 0, total: 0 };
    byContact[a.contact].visits += 1;
    byContact[a.contact].total += a.rate;
  });
  const top = Object.values(byContact).sort((a, b) => b.total - a.total).slice(0, 5);
  const periodLabel = period === 0 ? fmtShort(isoOf(startOfWeek(now)))
    : period === 1 ? `${T.monthsLong[thisMonth]} ${thisYear}`
    : period === 2 ? `Trim. ${Math.floor(thisMonth / 3) + 1} ${thisYear}`
    : `${thisYear}`;

  return (
    <div style={{ padding: '20px 16px 140px', fontFamily: FONTS.ui, color: c.ink, background: c.bg, minHeight: '100%' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>{T.insights}</div>
        <div style={{ fontFamily: FONTS.serif, fontSize: 28, fontWeight: 400, marginTop: 2, letterSpacing: -0.4 }}>{periodLabel}</div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: c.surface, padding: 4, borderRadius: 3, border: `1px solid ${c.hairline}`, marginBottom: 20 }}>
        {T.periods.map((p, i) => (
          <button key={p} onClick={() => setPeriod(i)} style={{
            flex: 1, padding: '8px', border: 'none', borderRadius: 2, cursor: 'pointer',
            background: i === period ? c.ink : 'transparent', color: i === period ? c.bg : c.ink2,
            fontFamily: FONTS.ui, fontSize: 12, fontWeight: 500,
          }}>{p}</button>
        ))}
      </div>

      <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3, padding: '22px 20px', marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: c.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>{T.revenue}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FONTS.serif, fontSize: 42, letterSpacing: -1, color: c.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {money(revenue)}
          </span>
          {prevRevenue > 0 && (
            <span style={{ fontSize: 12, color: delta >= 0 ? c.accent : c.danger, display: 'flex', alignItems: 'center', gap: 2 }}>
              {I.arrowUp(10, delta >= 0 ? c.accent : c.danger)} {delta >= 0 ? '+' : ''}{delta}%
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>vs. {prevRevenue.toLocaleString('en-US')} RON perioada anterioară</div>

        <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-end', gap: 8, height: 88 }}>
          {bars.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: '100%', height: `${Math.max(2, (d.v / maxV) * 72)}px`,
                background: d.current ? c.accent : c.hairline, borderRadius: 1,
              }} />
              <span style={{ fontSize: 9, color: d.current ? c.ink : c.muted, letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: d.current ? 600 : 500 }}>
                {d.m}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <Metric label={T.hourlyAvg} value={money(hourlyAvg)} c={c} />
        <Metric label={T.apptsCount} value={apptsInPeriod.length} c={c} />
        <Metric label={T.repeatRate} value={`${repeatRate}%`} c={c} />
        <Metric label={T.received} value={money(revenue)} c={c} accent />
      </div>

      <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3, padding: '16px 18px', marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: c.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500, marginBottom: 14 }}>{T.paymentMix}</div>
        {totalPay === 0 ? (
          <div style={{ fontSize: 12, color: c.muted }}>{T.noData}</div>
        ) : (
          <>
            <div style={{ display: 'flex', height: 6, borderRadius: 1, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ width: `${cashPct}%`, background: c.accent }} />
              <div style={{ width: `${trPct}%`, background: c.ink }} />
              <div style={{ width: `${otherPct}%`, background: c.muted }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, flexWrap: 'wrap', gap: 8 }}>
              <LegendRow c={c} dot={c.accent} label={T.cash} val={`${cashPct}%`} />
              <LegendRow c={c} dot={c.ink} label={T.transfer} val={`${trPct}%`} />
              <LegendRow c={c} dot={c.muted} label={T.other} val={`${otherPct}%`} />
            </div>
          </>
        )}
      </div>

      <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3, padding: '16px 0 6px' }}>
        <div style={{ fontSize: 10, color: c.muted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500, padding: '0 18px 10px' }}>{T.topContacts}</div>
        {top.length === 0 && <div style={{ padding: '0 18px 16px', fontSize: 13, color: c.muted }}>{T.noData}</div>}
        {top.map((t, i) => (
          <div key={t.label} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
            borderTop: `1px solid ${c.hairline2}`,
          }}>
            <span style={{ fontFamily: FONTS.serif, fontSize: 12, color: c.muted, width: 14, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
            <Avatar initials={t.label.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()} c={c} size={30} />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, color: c.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</div>
              <div style={{ fontSize: 11, color: c.muted, marginTop: 1 }}>{t.visits} {T.meetings}</div>
            </div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 15, color: c.ink, fontVariantNumeric: 'tabular-nums' }}>
              {money(t.total)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendRow({ c, dot, label, val }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Dot color={dot} size={6} />
      <span style={{ color: c.ink2 }}>{label}</span>
      <span style={{ color: c.muted, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// FLAGGED DIRECTORY
// ──────────────────────────────────────────────────────────────
function FlaggedScreen({ c, state, onBack, onAdd, onRemove }) {
  const T = window.AG_T;
  window.__AG_C = c;
  const [query, setQuery] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [ref, setRef] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [severity, setSeverity] = React.useState('amber');

  const filtered = state.flagged.filter(f =>
    !query || f.ref.toLowerCase().includes(query.toLowerCase()) || f.reason.toLowerCase().includes(query.toLowerCase())
  );

  const handleAdd = () => {
    if (!ref.trim() || !reason.trim()) return;
    onAdd({ ref: ref.trim(), reason: reason.trim(), severity, date: new Date().toISOString().slice(0, 10) });
    setRef(''); setReason(''); setSeverity('amber'); setAdding(false);
  };

  return (
    <div style={{ padding: '16px 0 140px', fontFamily: FONTS.ui, color: c.ink, background: c.bg, minHeight: '100%' }}>
      <div style={{ padding: '0 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ ...iconBtn(c), width: 34, height: 34 }} aria-label="Înapoi">{I.chevL(14, c.ink2)}</button>
        <button onClick={() => setAdding(v => !v)} style={{ ...iconBtn(c), width: 34, height: 34 }} aria-label="Adaugă">{I.plus(16, c.ink2)}</button>
      </div>

      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>{T.directory}</div>
        <div style={{ fontFamily: FONTS.serif, fontSize: 28, marginTop: 2, letterSpacing: -0.4 }}>{T.flaggedTitle}</div>
        <div style={{ fontSize: 12, color: c.muted, marginTop: 6, lineHeight: 1.5 }}>{T.flaggedSub}</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {adding && (
          <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3, padding: '14px', marginBottom: 14 }}>
            <FieldBlock label={T.flaggedRef}>
              <input value={ref} onChange={e => setRef(e.target.value)} placeholder={T.flaggedRefPh}
                style={{ ...inp(c, FONTS.mono, 14) }} />
            </FieldBlock>
            <FieldBlock label={T.flaggedReason}>
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder={T.flaggedReasonPh}
                style={inp(c, FONTS.ui, 14)} />
            </FieldBlock>
            <FieldBlock label={T.flaggedSeverity}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setSeverity('amber')} style={seg(c, severity === 'amber')}>{T.severityAmber}</button>
                <button onClick={() => setSeverity('red')} style={seg(c, severity === 'red')}>{T.severityRed}</button>
              </div>
            </FieldBlock>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAdding(false)} style={{
                flex: 1, padding: '12px', border: `1px solid ${c.hairline}`, background: c.surface,
                borderRadius: 3, fontFamily: FONTS.ui, fontSize: 13, color: c.ink, cursor: 'pointer',
              }}>{T.cancel}</button>
              <button onClick={handleAdd} style={{
                flex: 1, padding: '12px', border: 'none', background: c.accent,
                borderRadius: 3, fontFamily: FONTS.ui, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
              }}>{T.save}</button>
            </div>
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3,
          padding: '12px 14px', marginBottom: 14,
        }}>
          {I.search(14, c.muted)}
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={T.flaggedPh}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: FONTS.ui, fontSize: 14, color: c.ink }} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3 }}>
            <Empty c={c} title={T.noFlagged} hint={T.emptyHint} />
          </div>
        ) : (
          <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3 }}>
            {filtered.map((f, i) => (
              <div key={f.id} style={{
                display: 'flex', gap: 12, padding: '14px',
                borderBottom: i < filtered.length - 1 ? `1px solid ${c.hairline2}` : 'none',
                alignItems: 'center',
              }}>
                <div style={{
                  width: 6, alignSelf: 'stretch', borderRadius: 1,
                  background: f.severity === 'red' ? c.danger : c.warn,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: c.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.ref}</div>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 3 }}>{f.reason} · {fmtShort(f.date)}</div>
                </div>
                <button onClick={() => onRemove(f.id)} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: c.muted }} aria-label="Șterge">
                  {I.trash(14, c.muted)}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { NewAppointmentScreen, AddIncomeScreen, AnalyticsScreen, FlaggedScreen });
