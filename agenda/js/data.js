// Agenda — seed data, Romanian strings, localStorage store
// Local-first. No network calls.

// Per-account local storage. SESSION_KEY holds the login bundle (shared by
// all accounts on this device — only one can be active at a time). Per-slug
// state (appointments, income, hours, prices, etc.) lives under a key derived
// from the account slug, so switching accounts doesn't leak data between them.
const SESSION_KEY = 'agenda-session-v1';
const STATE_KEY_PREFIX = 'agenda-state-v1:';
// Fields written into settings from the session bundle — stripped out before
// persisting per-slug state to avoid drift between the two stores.
const SESSION_FIELDS = ['session', 'sessionExpiresAt', 'username', 'slug', 'workerUrl'];

// Scrub the pre-migration shared-state key on boot. Harmless if it's already
// gone; on upgraded devices it reclaims the quota and prevents confusion.
try { localStorage.removeItem('agenda-state-v1'); } catch (e) {}

// ────────────────────────────────────────────────────────────────
// Romanian UI strings
// ────────────────────────────────────────────────────────────────
const AG_T = {
  today: 'Astăzi',
  scheduled: 'Programat',
  received: 'Încasat',
  meetings: 'întâlniri',
  of: 'din',
  complete: 'finalizate',
  schedule: 'Program',
  items: 'intrări',
  flaggedRefs: 'Referințe marcate',
  entries: 'intrări',
  thisWeek: 'Săptămâna aceasta',
  depositPending: 'Avans în curs',
  screening: 'Verificare',
  empty: 'Nicio programare',
  emptyHint: 'Apasă + pentru a adăuga',
  // Calendar
  week: 'Săptămâna',
  bookings: 'programări',
  // Detail
  service: 'Serviciu',
  duration: 'Durată',
  minutes: 'minute',
  rate: 'Tarif',
  payment: 'Plată',
  location: 'Locație',
  notes: 'Note',
  notesPh: 'Observații private — stocate local',
  reschedule: 'Reprogramează',
  markComplete: 'Marchează finalizat',
  markedComplete: 'Finalizat',
  cancelAppt: 'Anulează programarea',
  deleteAppt: 'Șterge programarea',
  confirmDelete: 'Ștergi această programare?',
  // New booking
  cancel: 'Anulează',
  save: 'Salvează',
  newBooking: 'Programare nouă',
  contact: 'Contact',
  contactPh: 'Nume sau inițiale',
  contactHint: 'Stocat local. Folosește inițiale sau un alias.',
  when: 'Când',
  date: 'Dată',
  time: 'Ora',
  services: ['Standard', 'Extins', 'Cină', 'Peste noapte'],
  locationTypes: ['La mine', 'Deplasare', 'Călătorie'],
  locationPrimary: 'Apt. — principal',
  locationAdd: 'Adaugă adresă',
  addressPh: 'Adresă sau hotel',
  paymentTypes: ['Numerar', 'Transfer', 'Crypto', 'Altul'],
  fillRequired: 'Completează contactul și tariful',
  saved: 'Salvat',
  // Income
  income: 'Încasare',
  amountReceived: 'Suma încasată',
  plusTip: '+ bacșiș',
  method: 'Metodă',
  linkTo: 'Asociază cu',
  linkOpts: ['programare', 'contact', 'neasociat'],
  linkPickAppt: 'Alege programarea',
  recentEntries: 'Intrări recente',
  noRecent: 'Nicio încasare încă',
  amountRequired: 'Suma trebuie să fie mai mare decât 0',
  // Analytics
  insights: 'Statistici',
  aprilMonth: 'Aprilie 2026',
  periods: ['Săpt.', 'Lună', 'Trimestru', 'An'],
  revenue: 'Venit',
  vsLast: 'vs. {n} RON luna trecută',
  hourlyAvg: 'Medie/oră',
  apptsCount: 'Întâlniri',
  repeatRate: 'Clienți fideli',
  paymentMix: 'Distribuție plăți',
  cash: 'Numerar',
  transfer: 'Transfer',
  other: 'Altele',
  topContacts: 'Contacte top',
  noData: 'Nu sunt date încă',
  // Flagged
  directory: 'Directorul',
  flaggedTitle: 'Referințe marcate',
  flaggedSub: 'Verifică un număr sau handle față de lista raportată înainte să accepți.',
  flaggedPh: 'Număr, handle sau email',
  addFlagged: 'Adaugă referință',
  flaggedRef: 'Referință',
  flaggedRefPh: '+40 7** *** ***',
  flaggedReason: 'Motiv',
  flaggedReasonPh: 'Scurtă descriere',
  flaggedSeverity: 'Severitate',
  severityAmber: 'Atenție',
  severityRed: 'Pericol',
  noFlagged: 'Nimic marcat încă',
  // Data management
  dataSection: 'Date',
  clearData: 'Șterge toate datele',
  clearDataDesc: 'Elimină toate programările, încasările și referințele de pe acest dispozitiv.',
  clearDataConfirm: 'Ștergi toate datele? Această acțiune nu poate fi anulată.',
  resetRemoteFailed: 'Resetarea serverului a eșuat. Continui oricum cu ștergerea locală?',
  // Settings
  settings: 'Setări',
  settingsSub: 'Configurare programări publice.',
  syncSection: 'Cont',
  accountLabel: 'Cont',
  bookingUrl: 'Link public',
  bookingUrlHint: 'Trimite acest link clienților pentru a face programări.',
  logout: 'Deconectează-te',
  // Album
  album: 'Album',
  albumSub: 'Fotografii și clipuri afișate pe pagina ta publică.',
  albumManage: 'Gestionează albumul',
  albumEmpty: 'Nicio imagine încă',
  albumEmptyHint: 'Încarcă poze sau clipuri pentru a fi afișate pe pagina publică.',
  albumAdd: 'Adaugă',
  albumUploading: 'Se încarcă…',
  albumUsage: '{used} din {total} folosiți',
  albumFull: 'Album plin — șterge ceva înainte de a adăuga.',
  albumMoveUp: 'Sus',
  albumMoveDown: 'Jos',
  albumDelete: 'Șterge',
  albumDeleteConfirm: 'Ștergi această intrare din album?',
  albumError: 'Eroare la încărcare',
  albumUnsupported: 'Format neacceptat. Folosește JPEG, PNG, WebP, MP4 sau WebM.',
  albumTooLarge: 'Fișierul depășește limita pe articol (10 MB poze / 50 MB clipuri).',
  albumQuotaExceeded: 'Nu mai ai spațiu. Șterge ceva și încearcă din nou.',
  albumLinkLabel: 'Vezi album',
  // Page background
  bgSection: 'Fundal pagină',
  bgHint: 'Imaginea afișată ca fundal pe pagina publică. JPEG/PNG/WebP, max 10 MB.',
  bgUpload: 'Încarcă imagine',
  bgReplace: 'Înlocuiește',
  bgRemove: 'Șterge fundalul',
  bgRemoveConfirm: 'Ștergi imaginea de fundal?',
  bgUploading: 'Se încarcă…',
  bgNone: 'Fără fundal',
  bgTooLarge: 'Imaginea depășește 10 MB.',
  bgUnsupported: 'Format neacceptat. Folosește JPEG, PNG sau WebP.',
  bgError: 'Eroare la încărcare',
  // Login screen
  loginTitle: 'Conectare',
  loginSub: 'Introdu contul pentru a continua.',
  loginUsername: 'Utilizator',
  loginPassword: 'Parolă',
  loginSubmit: 'Intră',
  loginInvalid: 'Utilizator sau parolă greșite.',
  loginRateLimited: 'Prea multe încercări. Încearcă mai târziu.',
  loginError: 'Eroare de conectare.',
  bookingSection: 'Programări publice',
  publicEnabled: 'Permite cereri publice',
  publicEnabledHint: 'Când e oprit, pagina publică afișează „închis".',
  bookingsEnabled: 'Acceptă cereri de programare',
  bookingsEnabledHint: 'Când e oprit, pagina publică rămâne vizibilă, dar nu se pot trimite cereri.',
  pageTitle: 'Titlu pagină',
  pageTitleHint: 'Textul afișat ca titlu pe pagina publică. Lasă gol pentru „Program".',
  pageTitlePlaceholder: 'Program',
  pageNotes: 'Notă pe pagină',
  pageNotesHint: 'Text scurt afișat sub titlu (ex. detalii, instrucțiuni). Lasă gol pentru a ascunde.',
  pageNotesPlaceholder: 'Detalii, instrucțiuni scurte…',
  servicesSection: 'Servicii',
  servicesHint: 'Adaugă, șterge sau editează tarifele pe durată.',
  serviceModeTimed: 'Durată multiplă',
  serviceModeSingle: 'Durată unică',
  serviceModeNone: 'Fără durată',
  addService: 'Adaugă serviciu',
  addServicePlaceholder: 'Nume serviciu',
  addDuration: 'Adaugă durată',
  removeService: 'Șterge',
  ron: 'RON',
  flatDuration: 'Durată (min)',
  flatPrice: 'Preț',
  duplicateService: 'Serviciul există deja.',
  invalidServiceName: 'Nume invalid.',
  workingHours: 'Program zilnic',
  workingHoursHint: 'Oră deschidere/închidere pe fiecare zi. Lasă gol pentru zi liberă.',
  open: 'Deschis',
  close: 'Închis',
  closed: 'Liber',
  bufferMin: 'Pauză între programări',
  advanceMin: 'Preaviz minim',
  maxDays: 'Zile în avans',
  mins: 'min',
  days: 'zile',
  copyToAll: 'Copiază la toate zilele',
  syncNow: 'Sincronizează acum',
  syncedJust: 'Sincronizat',
  syncError: 'Eroare la sincronizare',
  syncNever: 'Nesincronizat',
  // Inbox
  inbox: 'Cereri',
  inboxSub: 'Cereri publice de programare în așteptare.',
  inboxEmpty: 'Nicio cerere nouă',
  inboxEmptyHint: 'Cererile publice apar aici.',
  approve: 'Aprobă',
  reject: 'Respinge',
  alreadyDecided: 'Deja procesată pe alt dispozitiv',
  requestReceived: 'Primită',
  requestFor: 'pentru',
  newRequest: 'cerere nouă',
  newRequestsN: 'cereri noi',
  ago: (s) => {
    const mins = Math.max(0, Math.floor(s / 60));
    if (mins < 1) return 'acum';
    if (mins < 60) return `acum ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `acum ${hrs} h`;
    return `acum ${Math.floor(hrs / 24)} zile`;
  },
  weekdayLong: ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'],
  // Tabs
  tabToday: 'Astăzi',
  tabCal: 'Calendar',
  tabIncome: 'Venit',
  tabInsights: 'Analiză',
  // Months (short)
  months: ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Noi','Dec'],
  monthsLong: ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'],
  daysShort: ['Dum','Lun','Mar','Mie','Joi','Vin','Sâm'],
};

// ────────────────────────────────────────────────────────────────
// Seed data — shown on first launch. Written to storage once.
// ────────────────────────────────────────────────────────────────
function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const DEFAULT_HOURS = {
  0: null,
  1: { open: 600, close: 1320 },
  2: { open: 600, close: 1320 },
  3: { open: 600, close: 1320 },
  4: { open: 600, close: 1320 },
  5: { open: 600, close: 1320 },
  6: { open: 600, close: 1320 },
};

const PRICE_DURATIONS = [30, 60, 90, 120, 180];

function _rowsFor(defaults) {
  return PRICE_DURATIONS.map(d => ({ duration: d, price: defaults[d] ?? 0 }));
}

const DEFAULT_SERVICE_PRICES = {
  'Standard':     { mode: 'timed', rows: _rowsFor({ 30: 300, 60: 500, 90: 700, 120: 900, 180: 1300 }) },
  'Extins':       { mode: 'timed', rows: _rowsFor({}) },
  'Cină':         { mode: 'timed', rows: _rowsFor({}) },
  'Peste noapte': { mode: 'timed', rows: _rowsFor({}) },
};

// Canonical per-service shape is one of:
//   { mode: 'timed',  rows: [{ duration, price }, ...] }
//   { mode: 'single', duration, price }
//   { mode: 'none',   price }
// Legacy shapes (flat: true/false, or { "30": 300, ... }) are coerced here.
function normalizeServicePrices(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  const validDuration = d => Number.isFinite(d) && d >= 30 && d <= 180 && d % 15 === 0;
  for (const [name, v] of Object.entries(raw)) {
    if (!v || typeof v !== 'object') continue;
    const key = String(name).slice(0, 40);
    const mode = v.mode || (v.flat === true ? 'single' : v.flat === false ? 'timed' : null);
    if (mode === 'none') {
      out[key] = { mode: 'none', price: Math.max(0, Number(v.price) || 0) };
    } else if (mode === 'single') {
      const d = Number(v.duration);
      out[key] = {
        mode: 'single',
        duration: validDuration(d) ? d : 180,
        price: Math.max(0, Number(v.price) || 0),
      };
    } else if (mode === 'timed' || Array.isArray(v.rows)) {
      const rows = (v.rows || [])
        .map(r => ({ duration: Number(r && r.duration), price: Number(r && r.price) }))
        .filter(r => validDuration(r.duration))
        .map(r => ({ duration: r.duration, price: Math.max(0, Number.isFinite(r.price) ? r.price : 0) }));
      out[key] = { mode: 'timed', rows };
    } else {
      // Legacy flat map: { "30": 300, "60": 500, ... }
      const rows = [];
      for (const [dur, price] of Object.entries(v)) {
        const d = Number(dur);
        if (validDuration(d)) rows.push({ duration: d, price: Math.max(0, Number(price) || 0) });
      }
      rows.sort((a, b) => a.duration - b.duration);
      out[key] = { mode: 'timed', rows };
    }
  }
  return out;
}

const DEFAULT_SETTINGS = {
  theme: 'light',
  workerUrl: '',
  session: '',
  sessionExpiresAt: 0,
  username: '',
  slug: '',
  publicEnabled: false,
  bookingsEnabled: true,
  pageTitle: '',
  pageNotes: '',
  hasBackground: false,
  backgroundUpdatedAt: 0,
  hours: DEFAULT_HOURS,
  bufferMin: 15,
  advanceMin: 30,
  maxDays: 7,
  services: ['Standard', 'Extins', 'Cină', 'Peste noapte'],
  servicePrices: DEFAULT_SERVICE_PRICES,
  lastSyncAt: 0,
  lastSyncError: '',
};

// Empty template used for a fresh account's first login. Settings keep their
// defaults (hours, prices, etc.); every domain list starts empty.
const SEED = {
  settings: DEFAULT_SETTINGS,
  appointments: [],
  income: [],
  flagged: [],
  inbox: [],
};

// ────────────────────────────────────────────────────────────────
// Persistence
// ────────────────────────────────────────────────────────────────
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const bundle = JSON.parse(raw);
    if (!bundle || !bundle.session || !bundle.slug) return null;
    if (bundle.sessionExpiresAt && bundle.sessionExpiresAt * 1000 < Date.now()) return null;
    return bundle;
  } catch (e) { return null; }
}

function saveSession(bundle) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(bundle)); } catch (e) {}
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

function loadStateFor(slug) {
  if (!slug) return structuredClone(SEED);
  try {
    const raw = localStorage.getItem(STATE_KEY_PREFIX + slug);
    if (!raw) return structuredClone(SEED);
    const parsed = JSON.parse(raw);
    return {
      settings: (() => {
        const merged = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}), hours: { ...DEFAULT_HOURS, ...((parsed.settings || {}).hours || {}) } };
        merged.servicePrices = normalizeServicePrices(merged.servicePrices);
        return merged;
      })(),
      appointments: parsed.appointments || [],
      income: parsed.income || [],
      flagged: parsed.flagged || [],
      inbox: parsed.inbox || [],
    };
  } catch (e) {
    return structuredClone(SEED);
  }
}

function saveStateFor(slug, state) {
  if (!slug) return;
  try {
    // Drop session fields — they live in SESSION_KEY, duplicating here risks drift.
    const { settings, ...rest } = state;
    const cleanSettings = { ...settings };
    for (const k of SESSION_FIELDS) delete cleanSettings[k];
    localStorage.setItem(STATE_KEY_PREFIX + slug, JSON.stringify({ ...rest, settings: cleanSettings }));
  } catch (e) { /* quota or private mode — accept data loss silently */ }
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

window.AG_T = AG_T;
window.AG_STORE = {
  loadSession, saveSession, clearSession,
  loadStateFor, saveStateFor,
  uid, SEED, DEFAULT_SETTINGS, DEFAULT_HOURS, PRICE_DURATIONS, DEFAULT_SERVICE_PRICES,
  normalizeServicePrices,
  SESSION_FIELDS,
};
