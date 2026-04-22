// Agenda — seed data, Romanian strings, localStorage store
// Local-first. No network calls.

const STORAGE_KEY = 'agenda-state-v1';

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
  // Settings
  settings: 'Setări',
  settingsSub: 'Configurare sincronizare și programări publice.',
  syncSection: 'Sincronizare',
  workerUrl: 'URL Worker',
  workerUrlPh: 'https://domeniul-tau.workers.dev',
  workerUrlHint: 'Lasă gol pentru a folosi aceeași origine.',
  adminToken: 'Token administrator',
  adminTokenPh: 'Șirul pus cu wrangler secret',
  adminTokenHint: 'Stocat local. Setează același token pe fiecare dispozitiv.',
  bookingSection: 'Programări publice',
  publicEnabled: 'Permite cereri publice',
  publicEnabledHint: 'Când e oprit, pagina publică afișează „închis".',
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
  pricesSection: 'Tarife',
  pricesHint: 'Tariful aplicat automat când aprobi o cerere publică. Poți corecta în programare după.',
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
  return d.toISOString().slice(0, 10);
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

const PRICE_DURATIONS = [30, 60, 90, 120, 150, 180];

const DEFAULT_SERVICE_PRICES = {
  'Standard':     { 30: 300, 60: 500, 90: 700, 120: 900,  150: 1100, 180: 1300 },
  'Extins':       { 30: 0,   60: 0,   90: 0,   120: 0,    150: 0,    180: 0 },
  'Cină':         { 30: 0,   60: 0,   90: 0,   120: 0,    150: 0,    180: 0 },
  'Peste noapte': { 30: 0,   60: 0,   90: 0,   120: 0,    150: 0,    180: 0 },
};

const DEFAULT_SETTINGS = {
  theme: 'light',
  workerUrl: '',
  adminToken: '',
  publicEnabled: false,
  hours: DEFAULT_HOURS,
  bufferMin: 15,
  advanceMin: 30,
  maxDays: 7,
  services: ['Standard', 'Extins', 'Cină', 'Peste noapte'],
  servicePrices: DEFAULT_SERVICE_PRICES,
  lastSyncAt: 0,
  lastSyncError: '',
};

const SEED = {
  settings: DEFAULT_SETTINGS,
  appointments: [
    { id: 'a1', date: todayISO(0),  time: '11:00', end: '12:30', duration: 90, contact: 'M.',     service: 'Standard', rate: 400, locationType: 'La mine',   address: 'Apt. — principal', method: 'Numerar', status: 'confirmat',    notes: 'Client fidel — a 4-a vizită. Liniștit, politicos.' },
    { id: 'a2', date: todayISO(0),  time: '14:30', end: '15:30', duration: 60, contact: 'J. R.',  service: 'Standard', rate: 300, locationType: 'Deplasare', address: 'Hotel Arts',       method: 'Transfer', status: 'confirmat',    notes: 'Verificat. Prima vizită.' },
    { id: 'a3', date: todayISO(0),  time: '18:00', end: '20:00', duration: 120, contact: 'T.',    service: 'Extins',   rate: 700, locationType: 'La mine',   address: 'Apt. — principal', method: 'Numerar', status: 'în așteptare', notes: 'Avans în curs.' },
    { id: 'a4', date: todayISO(0),  time: '22:00', end: '23:00', duration: 60, contact: 'Nou — D.', service: 'Standard', rate: 350, locationType: 'Deplasare', address: 'Hotel W', method: 'Transfer', status: 'verificare', notes: 'Aștept referințe.' },
    { id: 'a5', date: todayISO(-1), time: '19:00', end: '20:00', duration: 60, contact: 'S. K.',  service: 'Standard', rate: 500, locationType: 'La mine',   address: 'Apt. — principal', method: 'Numerar', status: 'finalizat',    notes: '' },
    { id: 'a6', date: todayISO(-2), time: '15:00', end: '16:00', duration: 60, contact: 'R.',     service: 'Standard', rate: 400, locationType: 'La mine',   address: 'Apt. — principal', method: 'Transfer', status: 'finalizat',    notes: '' },
  ],
  income: [
    { id: 'i1', date: todayISO(0),  contact: 'M.',     amount: 400, tip: 0,  method: 'Numerar',  apptId: 'a1' },
    { id: 'i2', date: todayISO(-1), contact: 'S. K.',  amount: 500, tip: 0,  method: 'Numerar',  apptId: 'a5' },
    { id: 'i3', date: todayISO(-2), contact: 'R.',     amount: 400, tip: 20, method: 'Transfer', apptId: 'a6' },
    { id: 'i4', date: todayISO(-3), contact: 'Nou — L.', amount: 350, tip: 0, method: 'Numerar', apptId: null },
  ],
  flagged: [
    { id: 'f1', ref: '+40 7** *** 421', reason: 'Raportat — pierde timp',    date: todayISO(-6),  severity: 'amber' },
    { id: 'f2', ref: '@user_****',      reason: 'Raportat — agresiv',         date: todayISO(-10), severity: 'red' },
    { id: 'f3', ref: '+40 7** *** 903', reason: 'Nu s-a prezentat × 2',       date: todayISO(-19), severity: 'amber' },
  ],
  inbox: [],
};

// ────────────────────────────────────────────────────────────────
// Persistence
// ────────────────────────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(SEED);
    const parsed = JSON.parse(raw);
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}), hours: { ...DEFAULT_HOURS, ...((parsed.settings || {}).hours || {}) } },
      appointments: parsed.appointments || [],
      income: parsed.income || [],
      flagged: parsed.flagged || [],
      inbox: parsed.inbox || [],
    };
  } catch (e) {
    return structuredClone(SEED);
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* quota or private mode — accept data loss silently */ }
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

window.AG_T = AG_T;
window.AG_STORE = { loadState, saveState, uid, SEED, DEFAULT_SETTINGS, DEFAULT_HOURS, PRICE_DURATIONS, DEFAULT_SERVICE_PRICES };
