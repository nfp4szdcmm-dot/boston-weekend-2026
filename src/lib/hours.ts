// @ts-ignore - opening_hours ships its own (sometimes incomplete) typings
import OpeningHours from 'opening_hours';
import type { Place } from '../types';
import { bostonWallClockAsLocal, fmtClock } from './time';

export interface OpenState {
  state: 'open' | 'closed' | 'unknown';
  label: string;
  /** Where the hours came from. */
  source?: string;
  closesSoon?: boolean;
  nextChange?: Date;
}

const NOMINATIM = { lat: 42.36, lon: -71.06, address: { country_code: 'us', state: 'Massachusetts' } };
const cache = new Map<string, any>();

function parse(value: string): any | null {
  if (cache.has(value)) return cache.get(value);
  let oh: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor: any = (OpeningHours as any).default ?? OpeningHours;
    oh = new Ctor(value, NOMINATIM, { locale: 'en' });
  } catch {
    oh = null;
  }
  cache.set(value, oh);
  return oh;
}

/** Convert a "fake local" date (Boston wall clock in local fields) back to a real instant. */
function fromWall(wall: Date, ref: Date, refWall: Date): Date {
  return new Date(ref.getTime() + (wall.getTime() - refWall.getTime()));
}

export function openStateAt(place: Place, at: Date): OpenState {
  if (place.openingHours) {
    const oh = parse(place.openingHours);
    if (oh) {
      try {
        const wall = bostonWallClockAsLocal(at);
        const open: boolean = oh.getState(wall);
        const unknown: boolean = typeof oh.getUnknown === 'function' ? oh.getUnknown(wall) : false;
        const nextWall: Date | undefined = oh.getNextChange(wall);
        const next = nextWall ? fromWall(nextWall, at, wall) : undefined;
        const source = place.hoursSource ?? (place.source === 'google' ? 'Google Places' : place.source === 'osm' ? 'OpenStreetMap' : 'listing');
        if (unknown) return { state: 'unknown', label: 'Hours unclear', source };
        if (open) {
          const soon = next ? next.getTime() - at.getTime() < 45 * 60000 : false;
          return { state: 'open', label: next ? `Open · closes ${fmtClock(next)}` : 'Open 24h', closesSoon: soon, nextChange: next, source };
        }
        return { state: 'closed', label: next ? `Closed · opens ${fmtClock(next)}` : 'Closed', nextChange: next, source };
      } catch {
        /* fall through */
      }
    }
  }
  // Google gives openNow only for the present moment.
  if (typeof place.openNow === 'boolean' && Math.abs(at.getTime() - Date.now()) < 10 * 60000) {
    return { state: place.openNow ? 'open' : 'closed', label: place.openNow ? 'Open now' : 'Closed now', source: 'Google Places' };
  }
  return { state: 'unknown', label: 'Hours not verified' };
}

/** Will it be open for the whole window [at, at+minutes]? */
export function openForWindow(place: Place, at: Date, minutes: number): OpenState & { fits: boolean | null } {
  const s = openStateAt(place, at);
  if (s.state !== 'open') return { ...s, fits: s.state === 'closed' ? false : null };
  if (!s.nextChange) return { ...s, fits: true };
  return { ...s, fits: s.nextChange.getTime() - at.getTime() >= minutes * 60000 };
}
