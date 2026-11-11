import type { Activity, CheckItem, Rental } from '../types';

export const TRIP_NAME = 'Boston Weekend 2026';
export const TRIP_START = '2026-11-13';
export const TRIP_END = '2026-11-16';

export const DAYS = [
  { key: '2026-11-13', label: 'Friday', short: 'Fri', date: 'Nov 13', title: 'Arrival & Assembly Row' },
  { key: '2026-11-14', label: 'Saturday', short: 'Sat', date: 'Nov 14', title: 'The Big Boston Day' },
  { key: '2026-11-15', label: 'Sunday', short: 'Sun', date: 'Nov 15', title: 'SNHU Graduation' },
  { key: '2026-11-16', label: 'Monday', short: 'Mon', date: 'Nov 16', title: 'Fly Home' },
] as const;

export interface Flight {
  id: string;
  airline: string;
  number: string;
  /** FlightAware ident */
  ident: string;
  date: string;
  from: { code: string; city: string; tz: string; time: string };
  to: { code: string; city: string; tz: string; time: string };
}

export const FLIGHTS: Flight[] = [
  {
    id: 'aa5491', airline: 'American Airlines', number: 'AA 5491', ident: 'AAL5491', date: '2026-11-13',
    from: { code: 'XNA', city: 'Northwest Arkansas', tz: 'America/Chicago', time: '06:00' },
    to: { code: 'PHL', city: 'Philadelphia', tz: 'America/New_York', time: '09:45' },
  },
  {
    id: 'aa2615', airline: 'American Airlines', number: 'AA 2615', ident: 'AAL2615', date: '2026-11-13',
    from: { code: 'PHL', city: 'Philadelphia', tz: 'America/New_York', time: '10:49' },
    to: { code: 'BOS', city: 'Boston', tz: 'America/New_York', time: '12:20' },
  },
  {
    id: 'aa397', airline: 'American Airlines', number: 'AA 397', ident: 'AAL397', date: '2026-11-16',
    from: { code: 'BOS', city: 'Boston', tz: 'America/New_York', time: '07:00' },
    to: { code: 'DFW', city: 'Dallas/Fort Worth', tz: 'America/Chicago', time: '10:38' },
  },
  {
    id: 'aa3532', airline: 'American Airlines', number: 'AA 3532', ident: 'AAL3532', date: '2026-11-16',
    from: { code: 'DFW', city: 'Dallas/Fort Worth', tz: 'America/Chicago', time: '12:25' },
    to: { code: 'XNA', city: 'Northwest Arkansas', tz: 'America/Chicago', time: '13:38' },
  },
];

const a = (x: Omit<Activity, 'status'> & { status?: Activity['status'] }): Activity => ({ status: 'planned', ...x });

export const SEED_ACTIVITIES: Activity[] = [
  // ───── Friday ─────
  a({ id: 'fri-land', day: '2026-11-13', start: '12:20', end: '13:30', title: 'Land at Boston Logan', category: 'transport',
    placeId: 'logan', locked: true,
    description: 'AA 2615 from Philadelphia arrives 12:20 PM. Bags, restroom, regroup.' }),
  a({ id: 'fri-transfer', day: '2026-11-13', start: '13:30', end: '14:00', title: 'Travel to the Airbnb', category: 'transport',
    placeId: 'airbnb',
    description: 'Rideshare is simplest with luggage (follow airport signs to the ride-app pickup area). Transit option: free Massport shuttle → Airport station (Blue Line) → State → Orange Line toward Oak Grove → Assembly. Check mbta.com/alerts for weekend diversions.' }),
  a({ id: 'fri-assembly', day: '2026-11-13', start: '14:00', end: '16:30', title: 'Lunch, drinks & shopping at Assembly Row', category: 'shopping',
    placeId: 'assembly-row', options: ['civility', 'earls', 'tony-cs'],
    description: 'Ease into the trip right by home base. Outlet shopping, riverfront walk, late lunch and a first round.',
    notes: 'Airbnb check-in time not confirmed — ask the host about dropping bags early.' }),
  a({ id: 'fri-checkin', day: '2026-11-13', start: '16:30', end: '17:30', title: 'Airbnb check-in & freshen up', category: 'lodging',
    placeId: 'airbnb', description: 'Check-in details live in the Airbnb app.' }),
  a({ id: 'fri-dinner', day: '2026-11-13', start: '18:30', end: '20:30', title: 'Friday celebration dinner', category: 'food',
    placeId: 'parla-xxi', options: ['parla-xxi', 'civility', 'tony-cs', 'earls'],
    description: 'Suggestions only — no reservations booked. All within a few minutes’ walk of the Airbnb.' }),
  a({ id: 'fri-late', day: '2026-11-13', start: '20:30', end: '22:30', title: 'Optional: cocktails, dessert, or more exploring', category: 'drinks',
    tentative: true, options: ['backbar', 'bow-market', 'parla-xxi'],
    description: 'Stay local at Assembly Row, or a short ride to Union Square for Backbar.' }),

  // ───── Saturday ─────
  a({ id: 'sat-breakfast', day: '2026-11-14', start: '09:00', end: '09:30', title: 'Breakfast & coffee', category: 'coffee',
    placeId: 'tatte-charles', options: ['tatte-charles', 'beacon-hill-books'],
    description: 'Orange Line from Assembly → Downtown Crossing or Park St area, or a 15–20 min rideshare. Tatte on Charles St sets up the morning nicely.' }),
  a({ id: 'sat-common', day: '2026-11-14', start: '09:30', end: '10:15', title: 'Boston Common & Public Garden', category: 'sight',
    placeId: 'public-garden', options: ['boston-common', 'public-garden', 'freedom-trail'],
    description: 'Ducklings statues, the lagoon bridge, and the start of the Freedom Trail.' }),
  a({ id: 'sat-beacon', day: '2026-11-14', start: '10:15', end: '11:15', title: 'Beacon Hill, Acorn St & Charles St boutiques', category: 'boutique',
    placeId: 'acorn-st', options: ['acorn-st', 'charles-st', 'beacon-hill-books', 'black-ink'],
    description: 'Photo on Acorn Street, then browse Charles Street’s antique and gift shops.' }),
  a({ id: 'sat-newbury', day: '2026-11-14', start: '11:15', end: '13:00', title: 'Newbury Street shopping & Boston Public Library', category: 'shopping',
    placeId: 'newbury', options: ['newbury', 'trident', 'bpl', 'bodega', 'eataly', 'saltie-girl'],
    description: 'Walk through the Public Garden to Arlington St and stroll Newbury toward Mass Ave. Detour one block to the BPL courtyard.' }),
  a({ id: 'sat-quincy', day: '2026-11-14', start: '13:00', end: '14:00', title: 'Quincy Market, Faneuil Hall & lunch', category: 'food',
    placeId: 'quincy', options: ['bpm', 'quincy', 'faneuil', 'union-oyster'],
    description: 'Green Line from Copley → Government Center (~10 min), or rideshare. Boston Public Market is the local pick for lunch.' }),
  a({ id: 'sat-northend', day: '2026-11-14', start: '14:00', end: '15:30', title: 'North End: Hanover St, cannoli & history', category: 'sight',
    placeId: 'north-end', options: ['paul-revere', 'old-north', 'modern-pastry', 'mikes', 'bovas', 'galleria-umberto', 'polcaris'],
    description: 'Wander Hanover and Salem Streets. Cannoli taste-off: Modern vs Mike’s.' }),
  a({ id: 'sat-harbor', day: '2026-11-14', start: '15:30', end: '16:30', title: 'Harborwalk & waterfront', category: 'photo',
    placeId: 'harborwalk', description: 'Walk from Christopher Columbus Park along the harbor toward the Seaport (~25 min to Snowport).' }),
  a({ id: 'sat-snowport', day: '2026-11-14', start: '16:30', end: '18:30', title: 'Snowport Holiday Market', category: 'shopping',
    placeId: 'snowport', description: 'Small-business vendors, holiday food and drinks. Listed Saturday hours 10 AM–9 PM.' }),
  a({ id: 'sat-dinner', day: '2026-11-14', start: '19:00', end: '21:00', title: 'Dinner & drinks in Boston', category: 'food',
    options: ['legal-harborside', 'bartaco', 'drink', 'barcelona', 'yvonnes'],
    description: 'Stay in the Seaport (Legal Harborside, bartaco, then Drink) or head to the South End or Downtown. Nothing booked.' }),

  // ───── Sunday ─────
  a({ id: 'sun-breakfast', day: '2026-11-15', start: '09:00', end: '10:00', title: 'Breakfast & get ready', category: 'coffee',
    placeId: 'airbnb', options: ['civility'] }),
  a({ id: 'sun-rental', day: '2026-11-15', start: '10:00', end: '10:45', title: 'Pick up rental car (tentative)', category: 'transport',
    placeId: 'enterprise-sullivan', tentative: true,
    description: 'NOT CONFIRMED. The Sullivan Square branch lists no Sunday hours. Consider a Saturday pickup or Logan Rental Car Center. Update Essentials → Rental car once booked.' }),
  a({ id: 'sun-depart', day: '2026-11-15', start: '11:15', end: '12:30', title: 'Depart Somerville for Manchester, NH', category: 'transport',
    placeId: 'snhu-arena', description: '~50 miles via I-93 N. Leave on time — allow for Sunday traffic and parking.' }),
  a({ id: 'sun-arrive', day: '2026-11-15', start: '12:30', end: '13:15', title: 'Arrive in Manchester (target)', category: 'transport',
    placeId: 'snhu-arena', tentative: true }),
  a({ id: 'sun-park', day: '2026-11-15', start: '13:15', end: '14:00', title: 'Parking, photos & walk to the arena', category: 'event',
    placeId: 'snhu-arena', description: 'Bag check at entry. Accessible parking lot on Cedar St off Elm St (per SNHU accessibility info).' }),
  a({ id: 'sun-at-arena', day: '2026-11-15', start: '14:00', end: '15:00', title: 'Everyone at SNHU Arena', category: 'event',
    placeId: 'snhu-arena', locked: true, description: 'Hard deadline: no later than 2:00 PM.' }),
  a({ id: 'sun-ceremony', day: '2026-11-15', start: '15:00', end: '17:00', title: 'SNHU Graduation begins 🎓', category: 'event',
    placeId: 'snhu-arena', locked: true }),
  a({ id: 'sun-end', day: '2026-11-15', start: '17:00', end: '17:45', title: 'Estimated ceremony end (not guaranteed)', category: 'event',
    placeId: 'snhu-arena', tentative: true }),
  a({ id: 'sun-photos', day: '2026-11-15', start: '17:45', end: '18:15', title: 'Photos & regroup', category: 'photo', placeId: 'snhu-arena' }),
  a({ id: 'sun-return', day: '2026-11-15', start: '18:15', end: '19:45', title: 'Drive back to Boston (tentative)', category: 'transport',
    tentative: true, placeId: 'airbnb' }),
  a({ id: 'sun-dinner', day: '2026-11-15', start: '19:45', end: '21:30', title: 'Celebration dinner in Boston', category: 'food',
    tentative: true, dinnerPicker: true, options: ['civility', 'yvonnes', 'carmelinas', 'tony-cs'],
    description: 'Pick at the last minute based on when you get back. The dinner picker checks hours at your arrival time when live data exists.' }),
  a({ id: 'sun-pack', day: '2026-11-15', start: '21:30', end: '23:00', title: 'Back to the Airbnb & pack', category: 'lodging', placeId: 'airbnb' }),

  // ───── Monday ─────
  a({ id: 'mon-checkout', day: '2026-11-16', start: '04:00', end: '04:20', title: 'Final sweep & check out of the Airbnb', category: 'lodging',
    placeId: 'airbnb', description: 'Use the departure checklist in Essentials.' }),
  a({ id: 'mon-leave', day: '2026-11-16', start: '04:20', end: '05:00', title: 'Leave for Logan', category: 'transport', placeId: 'logan',
    description: 'Return the rental first if applicable. Early-morning drive is usually short, but allow buffer.' }),
  a({ id: 'mon-airport', day: '2026-11-16', start: '05:00', end: '06:30', title: 'Arrive Logan · bags · security · gate', category: 'transport',
    placeId: 'logan', description: 'Target arrival ~5:00 AM for the 7:00 AM flight.' }),
  a({ id: 'mon-flight', day: '2026-11-16', start: '07:00', end: '07:30', title: 'AA 397 departs to Dallas/Fort Worth', category: 'transport',
    placeId: 'logan', locked: true }),
];

export const DEFAULT_RENTAL: Rental = {
  status: 'not_confirmed',
  branch: '',
  pickupDay: '2026-11-15',
  pickupTime: '10:00',
  returnPlan: 'not_confirmed',
  returnDetails: '',
  price: '',
  notes: '',
};

let n = 0;
const ci = (text: string): CheckItem => ({ id: `c${++n}`, text, done: false });

export const DEFAULT_TRIP_CHECKLIST: CheckItem[] = [
  ci('Confirm Airbnb check-in time & entry instructions'),
  ci('Book the rental car — confirm the branch is open at pickup time'),
  ci('Confirm how the rental gets returned before the 7 AM Monday flight'),
  ci('Confirm graduation guest tickets / requirements'),
  ci('Check SNHU Arena bag policy (small/clear bag)'),
  ci('Check in for AA flights (24 hours before)'),
  ci('Warm layers, gloves & an umbrella (November in Boston)'),
  ci('Add this app to everyone’s Home Screen'),
  ci('Portable phone chargers'),
];

export const DEFAULT_DEPARTURE: CheckItem[] = [
  ci('Pack luggage'),
  ci('Check out of Airbnb'),
  ci('Confirm rental car return'),
  ci('Leave for airport'),
  ci('Return rental car (if applicable)'),
  ci('Check bags'),
  ci('Security'),
  ci('Find departure gate'),
];

export const LINKS: { label: string; url: string; note?: string }[] = [
  { label: 'MBTA service alerts', url: 'https://www.mbta.com/alerts' },
  { label: 'Logan Airport (Massport)', url: 'https://www.massport.com/logan-airport' },
  { label: 'American Airlines flight status', url: 'https://www.aa.com/travelInformation/flights/status' },
  { label: 'SNHU Commencement schedule', url: 'https://www.snhu.edu/student-experience/graduation/event-schedule' },
  { label: 'SNHU Commencement FAQs', url: 'https://www.snhu.edu/student-experience/graduation/graduation-faqs' },
  { label: 'SNHU Arena venue & bag policies', url: 'https://www.snhuarena.com/venue-policies' },
  { label: 'Snowport 2026 (Boston.com listing)', url: 'https://www.boston.com/things-to-do/events/snowport-2026-seaport-boston/' },
  { label: 'Enterprise – Sullivan Sq location', url: 'https://www.enterprise.com/en/car-rental-locations/us/ma/somerville-sullivan-square-station-1005.html' },
  { label: 'Freedom Trail', url: 'https://www.thefreedomtrail.org' },
];
