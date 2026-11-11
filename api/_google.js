// Shared helpers for the optional Google Places proxy (Vercel serverless functions).
// The API key lives ONLY in the server environment (GOOGLE_PLACES_API_KEY) — never in browser code.

export const KEY = process.env.GOOGLE_PLACES_API_KEY || '';

// Only answer for the trip area (Greater Boston → Manchester, NH) to limit key abuse.
export function inTripArea(lat, lng) {
  return typeof lat === 'number' && typeof lng === 'number' && lat > 42.15 && lat < 43.15 && lng > -71.65 && lng < -70.85;
}

const FIELDS = [
  'id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount', 'priceLevel', 'primaryType',
  'currentOpeningHours.openNow', 'regularOpeningHours.weekdayDescriptions', 'regularOpeningHours.periods',
  'websiteUri', 'googleMapsUri', 'photos', 'nationalPhoneNumber', 'editorialSummary', 'reservable', 'servesCocktails',
  'servesBreakfast', 'servesDessert', 'servesCoffee',
];
export const FIELD_MASK = FIELDS.map((f) => 'places.' + f).join(',');

const PRICE = { PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };
const D = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const pad = (n) => String(n).padStart(2, '0');

/** Google periods → OSM opening_hours string so the app evaluates "open at time X" uniformly. */
export function periodsToOSM(periods) {
  if (!Array.isArray(periods) || !periods.length) return undefined;
  if (periods.length === 1 && periods[0].open && !periods[0].close) return '24/7';
  const byDay = {};
  for (const p of periods) {
    if (!p.open || !p.close) continue;
    const o = `${pad(p.open.hour)}:${pad(p.open.minute)}`;
    let c = `${pad(p.close.hour)}:${pad(p.close.minute)}`;
    if (c === '00:00') c = '24:00';
    (byDay[p.open.day] ||= []).push(`${o}-${c}`);
  }
  const rules = Object.keys(byDay).sort().map((d) => `${D[d]} ${byDay[d].join(',')}`);
  return rules.length ? rules.join('; ') : undefined;
}

function categoryFor(t, kind) {
  if (kind) {
    const m = { food: 'food', drinks: 'drinks', coffee: 'coffee', bakery: 'bakery', shopping: 'shopping', sight: 'sight', fun: 'fun' };
    if (m[kind]) return m[kind];
  }
  if (/bar|night_club|pub|wine/.test(t)) return 'drinks';
  if (/cafe|coffee/.test(t)) return 'coffee';
  if (/bakery|ice_cream|dessert/.test(t)) return 'bakery';
  if (/restaurant|food/.test(t)) return 'food';
  if (/store|shop|mall|market/.test(t)) return 'shopping';
  if (/park|museum|landmark|attraction/.test(t)) return 'sight';
  return 'sight';
}

export function normalize(p, kind) {
  const t = p.primaryType || '';
  const tags = [];
  if (p.servesCocktails) tags.push('cocktails');
  if (p.servesBreakfast) tags.push('breakfast');
  if (p.servesDessert) tags.push('dessert');
  if (p.servesCoffee) tags.push('coffee');
  if (/seafood/.test(t)) tags.push('seafood');
  if (/italian/.test(t)) tags.push('italian');
  if (/pizza/.test(t)) tags.push('pizza');
  if (/american|hamburger|steak/.test(t)) tags.push('american');
  const price = PRICE[p.priceLevel];
  if (price === 1) tags.push('budget');
  return {
    id: 'g-' + p.id,
    name: p.displayName?.text || 'Unnamed',
    category: categoryFor(t, kind),
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    address: p.formattedAddress,
    why: p.editorialSummary?.text,
    price,
    tags,
    cuisine: t ? [t.replace(/_/g, ' ').replace(/ restaurant$/, '')] : undefined,
    website: p.websiteUri,
    phone: p.nationalPhoneNumber,
    rating: p.rating,
    ratingCount: p.userRatingCount,
    openNow: p.currentOpeningHours?.openNow,
    openingHours: periodsToOSM(p.regularOpeningHours?.periods),
    hoursSource: 'Google Places',
    googleHours: p.regularOpeningHours?.weekdayDescriptions,
    googleMapsUrl: p.googleMapsUri,
    photoUrl: p.photos?.[0]?.name ? `/api/photo?name=${encodeURIComponent(p.photos[0].name)}` : undefined,
    source: 'google',
    fetchedAt: new Date().toISOString(),
  };
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}
