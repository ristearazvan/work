// Agenda — design tokens, icons, shared components

const AG = {
  light: {
    dark: false,
    bg: '#F5F3EE', surface: '#FFFFFF', surface2: '#FAF8F3',
    ink: '#1C1C1A', ink2: '#3A3A36', muted: '#8A867C',
    hairline: '#E5E1D8', hairline2: '#EFEBE2',
    accent: '#556B3D', accentSoft: '#EAEEE1',
    danger: '#8B3A2E', warn: '#A67C3A',
  },
  dark: {
    dark: true,
    bg: '#131311', surface: '#1C1C1A', surface2: '#242420',
    ink: '#F0EDE4', ink2: '#CFCBBF', muted: '#84807A',
    hairline: '#2C2C28', hairline2: '#242420',
    accent: '#A4B87F', accentSoft: '#2A3022',
    danger: '#C06A5A', warn: '#C7A166',
  },
};

const FONTS = {
  ui: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  serif: "'Fraunces', 'Iowan Old Style', Georgia, serif",
  mono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
};

const money = (n, sign = true) => {
  const s = (Number(n) || 0).toLocaleString('en-US');
  return sign ? `${s} RON` : s;
};

// Date helpers — all RO locale
const T = window.AG_T;
function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function isoOf(d) { return d.toISOString().slice(0, 10); }
function sameDay(a, b) { return a.slice(0, 10) === b.slice(0, 10); }
function fmtShort(iso) {
  const d = parseISO(iso);
  return `${T.daysShort[d.getDay()]}, ${d.getDate()} ${T.months[d.getMonth()]}`;
}
function fmtLong(iso) {
  const d = parseISO(iso);
  return `${T.daysShort[d.getDay()]}, ${d.getDate()} ${T.monthsLong[d.getMonth()].toLowerCase()}`;
}
function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  const h2 = Math.floor(total / 60) % 24;
  const m2 = total % 60;
  return `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`;
}

function Hair({ c, style = {} }) { return <div style={{ height: 1, background: c.hairline, ...style }} />; }

function Chip({ children, c, tone = 'neutral', style = {} }) {
  const bg = tone === 'accent' ? c.accentSoft : c.surface2;
  const fg = tone === 'accent' ? c.accent : c.ink2;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px', borderRadius: 4,
      background: bg, color: fg,
      fontSize: 11, fontWeight: 500, letterSpacing: 0.2,
      textTransform: 'uppercase', ...style,
    }}>{children}</span>
  );
}

function Dot({ color = '#7A8A5A', size = 6 }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: color }} />;
}

const I = {
  calendar: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/>
      <path d="M3.5 9.5h17M8 3v4M16 3v4"/>
    </svg>
  ),
  plus: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  chevR: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6"/>
    </svg>
  ),
  chevL: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6"/>
    </svg>
  ),
  stats: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round">
      <path d="M4 20V10M10 20V4M16 20v-6M22 20H2"/>
    </svg>
  ),
  home: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10l8-6 8 6v10a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1V10z"/>
    </svg>
  ),
  search: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round">
      <circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>
    </svg>
  ),
  clock: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>
    </svg>
  ),
  bulb: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 21h4"/>
      <path d="M12 3a6 6 0 00-4 10.5c.8.8 1.3 1.7 1.5 2.5h5c.2-.8.7-1.7 1.5-2.5A6 6 0 0012 3z"/>
    </svg>
  ),
  bulbOn: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 21h4"/>
      <path d="M12 3a6 6 0 00-4 10.5c.8.8 1.3 1.7 1.5 2.5h5c.2-.8.7-1.7 1.5-2.5A6 6 0 0012 3z" fill={c} fillOpacity="0.15"/>
      <path d="M12 1v1.5M20.5 5.5l-1 1M22 12h-1.5M3.5 12H2M4.5 5.5l1 1" strokeWidth="1.3"/>
    </svg>
  ),
  shield: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>
    </svg>
  ),
  wallet: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="12" rx="1.5"/>
      <circle cx="12" cy="13" r="2.2"/>
      <path d="M6 10.5v5M18 10.5v5"/>
    </svg>
  ),
  map: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"/>
      <circle cx="12" cy="11" r="2.5"/>
    </svg>
  ),
  arrowUp: (s = 12, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7"/>
    </svg>
  ),
  more: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>
    </svg>
  ),
  trash: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M10 11v6M14 11v6"/>
      <path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13M9 7V4h6v3"/>
    </svg>
  ),
};

function Metric({ label, value, sub, c, accent = false }) {
  return (
    <div style={{
      background: c.surface, borderRadius: 2, padding: '14px 14px 16px',
      border: `1px solid ${c.hairline}`, flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 10, color: c.muted, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 500 }}>{label}</div>
      <div style={{
        fontFamily: FONTS.serif, fontSize: 28, fontWeight: 400,
        color: accent ? c.accent : c.ink, marginTop: 6, letterSpacing: -0.5, lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: c.muted, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>{sub}</div>}
    </div>
  );
}

function Avatar({ initials, c, size = 36, accent = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 2,
      background: accent ? c.accentSoft : c.surface2,
      color: accent ? c.accent : c.ink2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONTS.serif, fontSize: size * 0.42, fontWeight: 500, letterSpacing: 0,
      border: `1px solid ${c.hairline}`, flexShrink: 0,
    }}>{initials}</div>
  );
}

function AgTabBar({ tab, onNav, c }) {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const tabs = [
    { k: 'home',  label: T.tabToday,    icon: I.home },
    { k: 'cal',   label: T.tabCal,      icon: I.calendar },
    { k: 'add',   label: '',            icon: null, fab: true },
    { k: 'money', label: T.tabIncome,   icon: I.wallet },
    { k: 'stats', label: T.tabInsights, icon: I.stats },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 520,
      background: c.surface, borderTop: `1px solid ${c.hairline}`,
      paddingBottom: `calc(${isIOS ? 28 : 16}px + env(safe-area-inset-bottom, 0px))`,
      paddingTop: 8,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around',
      zIndex: 40,
    }}>
      {tabs.map(t => {
        if (t.fab) {
          return (
            <button key={t.k} onClick={() => onNav('new')} aria-label="Adaugă programare" style={{
              width: 48, height: 48, borderRadius: '50%', background: c.accent,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: `0 6px 14px ${c.accent}35`, marginBottom: 4,
            }}>{I.plus(20, '#fff')}</button>
          );
        }
        const active = tab === t.k;
        return (
          <button key={t.k} onClick={() => onNav(t.k)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '4px 8px', color: active ? c.ink : c.muted,
            flex: 1, maxWidth: 72,
          }}>
            {t.icon(20, active ? c.ink : c.muted)}
            <span style={{
              fontSize: 10, letterSpacing: 0.3, fontWeight: active ? 600 : 500, fontFamily: FONTS.ui,
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function FieldBlock({ label, children }) {
  const c = window.__AG_C;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 10, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function inp(c, font, size = 16) {
  return {
    width: '100%', border: `1px solid ${c.hairline}`, background: c.surface,
    borderRadius: 3, padding: '14px 16px',
    fontFamily: font, fontSize: size, color: c.ink, outline: 'none', boxSizing: 'border-box',
  };
}

function Pseudo({ c, value, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: c.surface, border: `1px solid ${c.hairline}`, borderRadius: 3,
      padding: '14px 16px', fontSize: 14, color: c.ink2,
    }}>
      {icon}
      <span style={{ flex: 1 }}>{value}</span>
    </div>
  );
}

function seg(c, active) {
  return {
    flex: 1, padding: '10px 8px', borderRadius: 3, cursor: 'pointer',
    border: `1px solid ${active ? c.ink : c.hairline}`,
    background: active ? c.ink : c.surface,
    color: active ? c.bg : c.ink2,
    fontFamily: FONTS.ui, fontSize: 12, fontWeight: 500, letterSpacing: 0.2,
  };
}

function iconBtn(c) {
  return {
    width: 36, height: 36, borderRadius: '50%',
    border: `1px solid ${c.hairline}`, background: c.surface, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

function Empty({ c, title, hint }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontFamily: FONTS.serif, fontSize: 18, color: c.ink2 }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: c.muted, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

Object.assign(window, {
  AG, FONTS, money, Hair, Chip, Dot, I, Metric, Avatar, AgTabBar,
  FieldBlock, inp, Pseudo, seg, iconBtn, Empty,
  parseISO, isoOf, sameDay, fmtShort, fmtLong, startOfWeek, addMinutes,
});
