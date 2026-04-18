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

const SEED = {
  settings: { theme: 'light' },
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
      settings: { ...SEED.settings, ...(parsed.settings || {}) },
      appointments: parsed.appointments || [],
      income: parsed.income || [],
      flagged: parsed.flagged || [],
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
window.AG_STORE = { loadState, saveState, uid, SEED };
