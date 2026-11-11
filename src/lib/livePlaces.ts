import type { Category, LatLng, Place } from '../types';
import { lsGet, lsSet } from './cache';

/**
 * Live nearby places.
 *  1. Google Places (if the optional /api proxy is deployed with a server-side key) — ratings, photos, hours.
 *  2. OpenStreetMap via Overpass (free, no key) — names, addresses, hours when mapped. No ratings.
 */

export type LiveKind = 'food' | 'drinks' | 'coffee' | 'bakery' | 'shopping' | 'sight' | 'fun';

export interface LiveResult {
  places: Place[];
  source: 'google' | 'osm';
  fetchedAt: string;
  cached: boolean;
  error?: string;
}

let googleAvailable: boolean | null = null;

export async function checkGoogle(): Promise<boolean> {
  if (googleAvailable !== null) return googleAvailable;
  try {
    const r = await fetch('/api/health', { headers: { accept: 'application/json' } });
    const j = r.ok ? await r.json() : null;
    googleAvailable = !!j?.google;
  } catch {
    googleAvailable = false;
  }
  return googleAvailable;
}

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const OSM_FILTERS: Record<LiveKind, string[]> = {
  food: ['["amenity"~"^(restaurant|fast_food|food_court)$"]'],
  drinks: ['["amenity"~"^(bar|pub|biergarten|nightclub)$"]'],
  coffee: ['["amenity"="cafe"]'],
  bakery: ['["shop"~"^(bakery|pastry|confectionery|chocolate)$"]', '["amenity"="ice_cream"]'],
  shopping: [
    '["shop"~"^(books|gift|clothes|boutique|second_hand|vintage|jewelry|art|antiques|shoes|stationery|toys|cosmetics|department_store|mall|deli|wine|cheese|craft|variety_store|music|souvenir)$"]',
    '["amenity"="marketplace"]',
  ],
  sight: ['["tourism"~"^(attraction|museum|gallery|viewpoint|artwork)$"]', '["historic"]', '["leisure"="park"]'],
  fun: ['["leisure"~"^(amusement_arcade|bowling_alley|escape_game|miniature_golf)$"]', '["amenity"~"^(theatre|cinema)$"]', '["tourism"="aquarium"]'],
};

function osmCategory(t: Record<string, string>): Category {
  const am = t.amenity, shop = t.shop;
  if (am === 'restaurant' || am === 'fast_food' || am === 'food_court') return 'food';
  if (am === 'bar' || am === 'pub' || am === 'biergarten' || am === 'nightclub') return 'drinks';
  if (am === 'cafe') return 'coffee';
  if (am === 'ice_cream' || ['bakery', 'pastry', 'confectionery', 'chocolate'].includes(shop)) return 'bakery';
  if (['clothes', 'boutique', 'second_hand', 'vintage', 'jewelry', 'shoes', 'cosmetics'].includes(shop)) return 'boutique';
  if (shop || am === 'marketplace') return 'shopping';
  if (t.tourism === 'viewpoint' || t.tourism === 'artwork') return 'photo';
  if (t.leisure && t.leisure !== 'park') return 'fun';
  if (am === 'theatre' || am === 'cinema' || t.tourism === 'aquarium') return 'fun';
  return 'sight';
}

function osmTags(t: Record<string, string>): string[] {
  const tags: string[] = [];
  const cuisine = (t.cuisine ?? '').toLowerCase();
  if (/seafood|fish|oyster/.test(cuisine)) tags.push('seafood');
  if (/italian/.test(cuisine)) tags.push('italian');
  if (/pizza/.test(cuisine)) tags.push('pizza');
  if (/american|burger|bbq|diner|steak/.test(cuisine)) tags.push('american');
  if (/breakfast|brunch|bagel|donut/.test(cuisine)) tags.push('breakfast');
  if (/coffee/.test(cuisine) || t.amenity === 'cafe') tags.push('coffee');
  if (/ice_cream|dessert|cake|donut/.test(cuisine) || t.amenity === 'ice_cream') tags.push('dessert');
  if (t.amenity === 'fast_food' || t.amenity === 'food_court') tags.push('budget', 'casual');
  if (t.amenity === 'pub') tags.push('casual');
  if (t['drink:cocktail'] === 'yes' || /cocktail/.test(cuisine) || t.amenity === 'bar') tags.push('cocktails');
  if (t.historic) tags.push('historic');
  if (t.tourism === 'viewpoint') tags.push('photo-spot');
  if (t.shop === 'second_hand' || t.shop === 'vintage') tags.push('vintage');
  if (t.shop === 'books') tags.push('books');
  if (t.shop === 'gift' || t.shop === 'souvenir') tags.push('gifts');
  if (t.fee === 'no') tags.push('free');
  return tags;
}

function osmAddress(t: Record<string, string>): string | undefined {
  const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  if (!street) return undefined;
  return [street, t['addr:city'], t['addr:postcode']].filter(Boolean).join(', ');
}

async function fetchOSM(center: LatLng, radius: number, kinds: LiveKind[]): Promise<Place[]> {
  const r = Math.round(Math.min(radius, 2500));
  const around = `(around:${r},${center.lat.toFixed(5)},${center.lng.toFixed(5)})`;
  const stmts = kinds.flatMap((k) => OSM_FILTERS[k].map((f) => `nwr${f}["name"]${around};`)).join('\n');
  const q = `[out:json][timeout:20];(\n${stmts}\n);out center tags 250;`;
  // Public Overpass servers are sometimes slow or rate-limited: race the mirrors, give up after 25s.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  const attempt = async (ep: string) => {
    const res = await fetch(ep, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`OpenStreetMap ${res.status}`);
    return res.json();
  };
  try {
    const j = await Promise.any(OVERPASS.map(attempt));
    ctrl.abort();
      const now = new Date().toISOString();
    return (j.elements as any[])
        .map((el): Place | null => {
          const t: Record<string, string> = el.tags ?? {};
          const lat = el.lat ?? el.center?.lat;
          const lng = el.lon ?? el.center?.lon;
          if (!t.name || lat == null || lng == null) return null;
          const cuisine = t.cuisine ? t.cuisine.split(';').map((c: string) => c.trim().replace(/_/g, ' ')) : undefined;
          return {
            id: `osm-${el.type}-${el.id}`,
            name: t.name,
            category: osmCategory(t),
            lat, lng,
            address: osmAddress(t),
            cuisine,
            tags: osmTags(t),
            website: t.website ?? t['contact:website'],
            menu: t['website:menu'],
            phone: t.phone ?? t['contact:phone'],
            openingHours: t.opening_hours,
            hoursSource: t.opening_hours ? 'OpenStreetMap (community-maintained)' : undefined,
            indoor: t.leisure === 'park' || t.tourism === 'viewpoint' ? false : undefined,
            free: t.leisure === 'park' || t.tourism === 'viewpoint' || t.fee === 'no' ? true : undefined,
            source: 'osm',
            fetchedAt: now,
          };
        })
        .filter((p): p is Place => !!p);
  } catch {
    throw new Error('OpenStreetMap servers are busy or unreachable');
  } finally {
    clearTimeout(timer);
  }
}

async function fetchGoogle(center: LatLng, radius: number, kinds: LiveKind[]): Promise<Place[]> {
  const res = await fetch('/api/places', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat: center.lat, lng: center.lng, radius: Math.min(radius, 3000), kinds }),
  });
  if (!res.ok) throw new Error(`Places proxy ${res.status}`);
  const j = await res.json();
  return j.places as Place[];
}

const mem = new Map<string, LiveResult>();

export async function searchNearby(center: LatLng, radius: number, kinds: LiveKind[]): Promise<LiveResult> {
  const key = `${center.lat.toFixed(3)},${center.lng.toFixed(3)}|${Math.round(radius / 100)}|${[...kinds].sort().join(',')}`;
  const hit = mem.get(key);
  if (hit && Date.now() - new Date(hit.fetchedAt).getTime() < 10 * 60000) return hit;
  const useGoogle = await checkGoogle();
  try {
    const places = useGoogle ? await fetchGoogle(center, radius, kinds) : await fetchOSM(center, radius, kinds);
    const out: LiveResult = { places, source: useGoogle ? 'google' : 'osm', fetchedAt: new Date().toISOString(), cached: false };
    mem.set(key, out);
    lsSet('bw26-live-' + key, out);
    return out;
  } catch (e) {
    if (useGoogle) {
      // Fall back to OSM if the proxy fails.
      try {
        const places = await fetchOSM(center, radius, kinds);
        const out: LiveResult = { places, source: 'osm', fetchedAt: new Date().toISOString(), cached: false };
        mem.set(key, out);
        return out;
      } catch {
        /* continue */
      }
    }
    const cached = lsGet<LiveResult>('bw26-live-' + key);
    if (cached) return { ...cached, cached: true, error: (e as Error).message };
    throw e;
  }
}

/** Live details (rating, hours, photo) for a curated place — Google proxy only. */
export async function liveDetails(p: Place): Promise<Partial<Place> | null> {
  if (!(await checkGoogle())) return null;
  const key = 'bw26-details-' + p.id;
  try {
    const res = await fetch('/api/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `${p.name}, ${p.address ?? 'Boston, MA'}`, lat: p.lat, lng: p.lng }),
    });
    if (!res.ok) throw new Error();
    const j = await res.json();
    if (j.place) lsSet(key, j.place);
    return j.place ?? null;
  } catch {
    return lsGet<Partial<Place>>(key);
  }
}

export function kindsFor(cat: string): LiveKind[] {
  switch (cat) {
    case 'food': return ['food'];
    case 'drinks': return ['drinks'];
    case 'coffee': return ['coffee'];
    case 'bakery': return ['bakery'];
    case 'boutique':
    case 'shopping': return ['shopping'];
    case 'sight':
    case 'photo': return ['sight'];
    case 'fun': return ['fun'];
    case 'hidden': return ['shopping', 'drinks'];
    default: return ['food', 'drinks', 'coffee', 'bakery', 'shopping', 'sight'];
  }
}

/** Merge live results with curated, attaching live hours/ratings to curated matches. */
export function mergePlaces(curated: Place[], live: Place[]): Place[] {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^the/, '');
  const out = curated.map((c) => ({ ...c }));
  for (const l of live) {
    const match = out.find(
      (c) => (norm(c.name).includes(norm(l.name)) || norm(l.name).includes(norm(c.name))) &&
        Math.abs(c.lat - l.lat) < 0.0015 && Math.abs(c.lng - l.lng) < 0.0015,
    );
    if (match) {
      if (!match.openingHours && l.openingHours) {
        match.openingHours = l.openingHours;
        match.hoursSource = l.hoursSource;
      }
      if (l.rating != null) { match.rating = l.rating; match.ratingCount = l.ratingCount; }
      if (l.photoUrl && !match.wiki) match.photoUrl = l.photoUrl;
      if (l.openNow != null) match.openNow = l.openNow;
      if (l.googleHours) match.googleHours = l.googleHours;
      continue;
    }
    out.push(l);
  }
  return out;
}
