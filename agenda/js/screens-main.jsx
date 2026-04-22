// Agenda — main screens (Home, Calendar, Appointment Detail)

// ──────────────────────────────────────────────────────────────
// HOME / TODAY
// ──────────────────────────────────────────────────────────────
function HomeScreen({ c, state, onNav, onOpenAppt, pendingCount = 0 }) {
  const T = window.AG_T;
  const todayIso = isoOf(new Date());

  const todayAppts = state.appointments
    .filter(a => a.date === todayIso && a.status !== 'anulat')
    .sort((a, b) => a.time.localeCompare(b.time));

  const scheduledTotal = todayAppts
    .filter(a => a.status !== 'verificare')
    .reduce((s, a) => s + a.rate, 0);
  const earnedToday = state.income
    .filter(i => i.date === todayIso)
    .reduce((s, i) => s + i.amount + (i.tip || 0), 0);
  const doneToday = todayAppts.filter(a => a.status === 'finalizat').length;

  const weekStart = startOfWeek(new Date());
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i);
    const iso = isoOf(d);
    const dayAppts = state.appointments.filter(a => a.date === iso && a.status !== 'anulat');
    return {
      d: T.daysShort[d.getDay()], n: d.getDate(),
      count: dayAppts.length,
      total: dayAppts.reduce((s, a) => s + a.rate, 0),
      today: iso === todayIso,
    };
  });

  const thisWeek = week.reduce((s, d) => s + d.total, 0);
  const flaggedCount = state.flagged.length;

  const progress = scheduledTotal > 0 ? Math.min(1, earnedToday / scheduledTotal) : 0;

  return (
    <div style={{ padding: '20px 20px 140px', fontFamily: FONTS.ui, color: c.ink, background: c.bg, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>{T.today}</div>
          <div style={{ fontFamily: FONTS.serif, fontSize: 30, fontWeight: 400, letterSpacing: -0.5, marginTop: 2, lineHeight: 1.1 }}>
            {fmtShort(todayIso)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onNav('inbox')} aria-label="Cereri" style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `1px solid ${c.hairline}`, background: c.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: c.ink2, position: 'relative',
          }}>
            {I.inboxIcon(16, c.ink2)}
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px',
                borderRadius: 8, background: c.accent, color: '#fff',
                fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 0 2px ${c.bg}`, fontVariantNumeric: 'tabular-nums',
              }}>{pendingCount > 99 ? '99+' : pendingCount}</span>
            )}
          </button>
          <button onClick={() => onNav('settings')} aria-label="Setări" style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `1px solid ${c.hairline}`, background: c.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: c.ink2,
          }}>
            {I.gear(16, c.ink2)}
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('agenda-toggle-theme'))} aria-label="Schimbă tema" style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `1px solid ${c.hairline}`, background: c.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: c.ink2,
          }}>
            {c.dark ? I.bulbOn(16, c.accent) : I.bulb(16, c.ink2)}
          </button>
        </div>
      </div>

      {/* Daily summary */}
      <div style={{
        background: c.surface, borderRadius: 3, padding: '18px 18px 20px',
        border: `1px solid ${c.hairline}`, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: c.muted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{T.scheduled}</div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 32, letterSpacing: -0.5, marginTop: 4, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {money(scheduledTotal)}
            </div>
            <div style={{ fontSize: 11, color: c.muted, marginTop: 8 }}>{todayAppts.length} {T.meetings}</div>
          </div>
          <div style={{ width: 1, background: c.hairline }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: c.muted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{T.received}</div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 32, letterSpacing: -0.5, marginTop: 4, color: c.accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {money(earnedToday)}
            </div>
            <div style={{ fontSize: 11, color: c.muted, marginTop: 8 }}>{doneToday} {T.of} {todayAppts.length} {T.complete}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, height: 3, background: c.hairline2, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${progress * 100}%`, height: '100%', background: c.accent, transition: 'width 300ms ease' }} />
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>{T.schedule}</div>
        <div style={{ fontSize: 11, color: c.muted }}>{todayAppts.length} {T.items}</div>
      </div>

      {todayAppts.length === 0 ? (
        <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3 }}>
          <Empty c={c} title={T.empty} hint={T.emptyHint} />
        </div>
      ) : (
        <div style={{ background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3 }}>
          {todayAppts.map((a, i) => (
            <button key={a.id} onClick={() => onOpenAppt(a)} style={{
              width: '100%', textAlign: 'left', background: 'transparent', cursor: 'pointer',
              display: 'flex', gap: 14, padding: '14px',
              border: 'none',
              borderBottom: i < todayAppts.length - 1 ? `1px solid ${c.hairline2}` : 'none',
              fontFamily: FONTS.ui, color: c.ink,
            }}>
              <div style={{ width: 48, flexShrink: 0 }}>
                <div style={{ fontFamily: FONTS.serif, fontSize: 17, fontVariantNumeric: 'tabular-nums', color: c.ink, lineHeight: 1.1 }}>{a.time}</div>
                <div style={{ fontSize: 10, color: c.muted, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{a.duration}m</div>
              </div>
              <div style={{ width: 2, background: c.hairline, borderRadius: 1, flexShrink: 0, position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: -3, top: 6, width: 8, height: 8, borderRadius: '50%',
                  background: a.status === 'confirmat' ? c.accent : a.status === 'în așteptare' ? c.warn : a.status === 'finalizat' ? c.accent : c.muted,
                  border: `2px solid ${c.surface}`,
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: c.ink, letterSpacing: -0.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.contact}</div>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 16, fontVariantNumeric: 'tabular-nums', color: c.ink }}>{money(a.rate)}</div>
                </div>
                <div style={{ fontSize: 12, color: c.muted, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span>{a.locationType}{a.address ? ` — ${a.address}` : ''}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>{a.method}</span>
                </div>
                {a.status !== 'confirmat' && a.status !== 'finalizat' && (
                  <div style={{ marginTop: 8 }}>
                    <Chip c={c} tone={a.status === 'verificare' ? 'neutral' : 'accent'}>
                      {a.status === 'în așteptare' ? T.depositPending : T.screening}
                    </Chip>
                  </div>
                )}
                {a.status === 'finalizat' && (
                  <div style={{ marginTop: 8 }}>
                    <Chip c={c} tone="accent">{T.markedComplete}</Chip>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
        <button onClick={() => onNav('flagged')} style={{
          background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3,
          padding: '14px', textAlign: 'left', cursor: 'pointer', fontFamily: FONTS.ui,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            {I.shield(18, c.ink2)}
            {I.chevR(12, c.muted)}
          </div>
          <div style={{ fontSize: 13, color: c.ink, fontWeight: 500 }}>{T.flaggedRefs}</div>
          <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{flaggedCount} {T.entries}</div>
        </button>
        <button onClick={() => onNav('stats')} style={{
          background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3,
          padding: '14px', textAlign: 'left', cursor: 'pointer', fontFamily: FONTS.ui,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            {I.stats(18, c.ink2)}
            {I.chevR(12, c.muted)}
          </div>
          <div style={{ fontSize: 13, color: c.ink, fontWeight: 500 }}>{T.thisWeek}</div>
          <div style={{ fontSize: 11, color: c.muted, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{money(thisWeek)}</div>
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// CALENDAR (week view)
// ──────────────────────────────────────────────────────────────
function CalendarScreen({ c, state, onOpenAppt }) {
  const T = window.AG_T;
  const todayIso = isoOf(new Date());
  const [anchor, setAnchor] = React.useState(() => startOfWeek(new Date()));
  const [selectedIdx, setSelectedIdx] = React.useState(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ws = startOfWeek(new Date());
    return Math.round((today - ws) / (24 * 3600 * 1000));
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor); d.setDate(d.getDate() + i);
    return d;
  });

  const selectedIso = isoOf(weekDays[selectedIdx]);
  const monthLabel = `${T.monthsLong[weekDays[3].getMonth()]} ${weekDays[3].getFullYear()}`;

  const hours = Array.from({ length: 14 }, (_, i) => String(10 + i).padStart(2, '0'));
  const hourH = 54;

  const dayAppts = state.appointments
    .filter(a => a.date === selectedIso && a.status !== 'anulat')
    .sort((a, b) => a.time.localeCompare(b.time));

  const placed = dayAppts.map(a => {
    const [h, m] = a.time.split(':').map(Number);
    const top = (h - 10) * hourH + (m / 60) * hourH;
    const height = (a.duration / 60) * hourH;
    return { ...a, top, height };
  });

  const dayTotal = dayAppts.reduce((s, a) => s + a.rate, 0);
  const weekDots = weekDays.map(d => {
    const iso = isoOf(d);
    return state.appointments.filter(a => a.date === iso && a.status !== 'anulat').length;
  });

  const shiftWeek = (n) => {
    const next = new Date(anchor); next.setDate(next.getDate() + n * 7); setAnchor(next);
    setSelectedIdx(3);
  };

  const now = new Date();
  const nowOnSelected = selectedIso === todayIso;
  const nowTop = (now.getHours() - 10 + now.getMinutes() / 60) * hourH;

  return (
    <div style={{ padding: '20px 0 140px', fontFamily: FONTS.ui, color: c.ink, background: c.bg, minHeight: '100%' }}>
      <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 500 }}>{monthLabel}</div>
          <div style={{ fontFamily: FONTS.serif, fontSize: 24, fontWeight: 400, marginTop: 2, letterSpacing: -0.3 }}>{fmtShort(selectedIso)}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => shiftWeek(-1)} style={iconBtn(c)}>{I.chevL(14, c.ink2)}</button>
          <button onClick={() => shiftWeek(1)} style={iconBtn(c)}>{I.chevR(14, c.ink2)}</button>
        </div>
      </div>

      {/* Week strip */}
      <div style={{ display: 'flex', padding: '0 16px', marginBottom: 16, gap: 4 }}>
        {weekDays.map((d, i) => {
          const active = i === selectedIdx;
          const isToday = isoOf(d) === todayIso;
          const count = weekDots[i];
          return (
            <button key={i} onClick={() => setSelectedIdx(i)} style={{
              flex: 1, padding: '10px 0 12px', border: 'none',
              background: active ? c.ink : 'transparent',
              color: active ? c.bg : c.ink,
              borderRadius: 2, cursor: 'pointer', fontFamily: FONTS.ui,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              position: 'relative',
            }}>
              <span style={{ fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', opacity: active ? 0.7 : 0.6 }}>{T.daysShort[d.getDay()]}</span>
              <span style={{ fontFamily: FONTS.serif, fontSize: 20, fontWeight: 400, fontVariantNumeric: 'tabular-nums', textDecoration: isToday && !active ? 'underline' : 'none', textDecorationColor: c.accent, textUnderlineOffset: 3 }}>{d.getDate()}</span>
              {count > 0 && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: Math.min(count, 4) }).map((_, j) =>
                    <div key={j} style={{ width: 3, height: 3, borderRadius: '50%', background: active ? c.bg : c.accent, opacity: active ? 0.7 : 1 }} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '0 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: c.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
        <span>{fmtShort(selectedIso)} · {dayAppts.length} {T.bookings}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(dayTotal)}</span>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{
          position: 'relative', background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3,
          padding: '8px 0 8px 48px',
        }}>
          {hours.map((h, i) => (
            <div key={i} style={{
              position: 'relative', height: hourH,
              borderTop: i === 0 ? 'none' : `1px solid ${c.hairline2}`,
            }}>
              <span style={{
                position: 'absolute', left: -40, top: -7, width: 32, textAlign: 'right',
                fontSize: 10, color: c.muted, fontVariantNumeric: 'tabular-nums',
              }}>{h}:00</span>
            </div>
          ))}

          {placed.map(a => (
            <button key={a.id} onClick={() => onOpenAppt(a)} style={{
              position: 'absolute', left: 52, right: 12,
              top: a.top + 8, height: Math.max(28, a.height - 3),
              background: a.status === 'confirmat' ? c.accentSoft : a.status === 'finalizat' ? c.surface2 : c.surface2,
              borderLeft: `2px solid ${a.status === 'confirmat' || a.status === 'finalizat' ? c.accent : a.status === 'în așteptare' ? c.warn : c.muted}`,
              borderTop: 'none', borderRight: 'none', borderBottom: 'none',
              borderRadius: 2, padding: '8px 10px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
              overflow: 'hidden', textAlign: 'left', fontFamily: FONTS.ui, color: c.ink,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: c.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.contact}</span>
                <span style={{ fontFamily: FONTS.serif, fontSize: 13, fontVariantNumeric: 'tabular-nums', color: c.ink }}>{money(a.rate)}</span>
              </div>
              <div style={{ fontSize: 10, color: c.ink2, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{a.time}–{a.end} · {a.locationType}</div>
            </button>
          ))}

          {nowOnSelected && nowTop > 0 && nowTop < hours.length * hourH && (
            <div style={{
              position: 'absolute', left: 12, right: 12,
              top: nowTop + 8, height: 1, background: c.accent, opacity: 0.5,
            }}>
              <div style={{ position: 'absolute', left: 36, top: -3, width: 6, height: 6, borderRadius: '50%', background: c.accent }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// APPOINTMENT DETAIL
// ──────────────────────────────────────────────────────────────
function AppointmentDetail({ c, appt, onBack, onUpdate, onDelete }) {
  const T = window.AG_T;
  if (!appt) return null;
  const a = appt;

  const markComplete = () => onUpdate({ ...a, status: 'finalizat' });
  const cancel = () => onUpdate({ ...a, status: 'anulat' });
  const del = () => { if (confirm(T.confirmDelete)) { onDelete(a.id); onBack(); } };

  const isDone = a.status === 'finalizat';
  const isCanceled = a.status === 'anulat';

  const statusTone = a.status === 'confirmat' || a.status === 'finalizat' ? 'accent' : 'neutral';
  const statusColor = a.status === 'confirmat' || a.status === 'finalizat' ? c.accent
    : a.status === 'în așteptare' ? c.warn
    : a.status === 'anulat' ? c.danger : c.muted;

  return (
    <div style={{ padding: '16px 0 140px', fontFamily: FONTS.ui, color: c.ink, background: c.bg, minHeight: '100%' }}>
      <div style={{ padding: '0 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ ...iconBtn(c), width: 34, height: 34 }} aria-label="Înapoi">{I.chevL(14, c.ink2)}</button>
        <button onClick={del} style={{ ...iconBtn(c), width: 34, height: 34 }} aria-label="Șterge">{I.trash(16, c.ink2)}</button>
      </div>

      <div style={{ padding: '0 20px 22px' }}>
        <Chip c={c} tone={statusTone}>
          <Dot color={statusColor} /> {a.status}
        </Chip>
        <div style={{ fontFamily: FONTS.serif, fontSize: 36, letterSpacing: -0.7, marginTop: 10, lineHeight: 1.1 }}>
          {a.contact}
        </div>
        <div style={{ fontSize: 13, color: c.muted, marginTop: 4 }}>
          {fmtLong(a.date)} · {a.time} – {a.end}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ background: c.surface, borderRadius: 3, border: `1px solid ${c.hairline}`, padding: '4px 0' }}>
          {[
            { label: T.service,  value: a.service },
            { label: T.duration, value: `${a.duration} ${T.minutes}` },
            { label: T.rate,     value: money(a.rate), accent: true },
            { label: T.payment,  value: a.method },
            { label: T.location, value: `${a.locationType}${a.address ? ' — ' + a.address : ''}` },
          ].map((row, i, arr) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: i < arr.length - 1 ? `1px solid ${c.hairline2}` : 'none',
            }}>
              <span style={{ fontSize: 12, color: c.muted, letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: 500, flexShrink: 0 }}>{row.label}</span>
              <span style={{
                fontSize: 14, color: row.accent ? c.accent : c.ink,
                fontFamily: row.accent ? FONTS.serif : FONTS.ui,
                fontVariantNumeric: 'tabular-nums',
                fontWeight: row.accent ? 400 : 500, textAlign: 'right',
              }}>
                {row.accent ? <span style={{ fontSize: 18 }}>{row.value}</span> : row.value}
              </span>
            </div>
          ))}
        </div>

        {a.notes && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 11, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>{T.notes}</div>
            <div style={{
              background: c.surface, borderRadius: 3, border: `1px solid ${c.hairline}`,
              padding: '14px 16px', fontSize: 13, lineHeight: 1.55, color: c.ink2, whiteSpace: 'pre-wrap',
            }}>{a.notes}</div>
          </div>
        )}

        {!isDone && !isCanceled && (
          <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
            <button onClick={() => onUpdate({ ...a, status: a.status === 'în așteptare' ? 'confirmat' : a.status })} style={{
              flex: 1, padding: '14px', border: `1px solid ${c.hairline}`, background: c.surface,
              borderRadius: 3, fontFamily: FONTS.ui, fontSize: 13, fontWeight: 500, color: c.ink, cursor: 'pointer',
              letterSpacing: 0.2,
            }}>{T.reschedule}</button>
            <button onClick={markComplete} style={{
              flex: 1, padding: '14px', border: 'none', background: c.accent,
              borderRadius: 3, fontFamily: FONTS.ui, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
              letterSpacing: 0.3,
            }}>{T.markComplete}</button>
          </div>
        )}

        {!isCanceled && (
          <button onClick={cancel} style={{
            marginTop: 10, width: '100%', padding: '12px', border: 'none', background: 'transparent',
            borderRadius: 3, fontFamily: FONTS.ui, fontSize: 12, color: c.danger, cursor: 'pointer',
            letterSpacing: 0.3,
          }}>{T.cancelAppt}</button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, CalendarScreen, AppointmentDetail });
