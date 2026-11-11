import { useEffect, useState } from 'react';
import { create } from 'zustand';
import type { Activity, LatLng, Place } from '../types';
import { useTrip } from '../store/trip';
import { useUI } from '../store/ui';
import { PLACE_BY_ID } from '../data/places';
import { fetchWeather, type Weather } from './weather';
import { zoned } from './time';

/** Current time — or the preview clock if one is set. Ticks every 20s. */
export function useNow(): Date {
  const sim = useTrip((s) => s.sim);
  const calc = () => (sim ? new Date(sim.target + (Date.now() - sim.setAt)) : new Date());
  const [now, setNow] = useState(calc);
  useEffect(() => {
    setNow(calc());
    const t = setInterval(() => setNow(calc()), 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim?.target, sim?.setAt]);
  return now;
}

// ───── Location ─────
type LocStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable' | 'error';
interface LocState {
  status: LocStatus;
  coords: LatLng | null;
  accuracy: number | null;
  updatedAt: number | null;
  error: string | null;
  watchId: number | null;
  start: () => void;
  stop: () => void;
}

export const useLocation = create<LocState>()((set, get) => ({
  status: 'idle',
  coords: null,
  accuracy: null,
  updatedAt: null,
  error: null,
  watchId: null,
  start: () => {
    if (!('geolocation' in navigator)) {
      set({ status: 'unavailable', error: 'This browser has no location support.' });
      return;
    }
    if (get().watchId != null) return;
    set({ status: 'locating', error: null });
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        set({ status: 'granted', coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, accuracy: pos.coords.accuracy, updatedAt: Date.now() });
        useTrip.getState().setLocationOptIn(true);
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        set({
          status: denied ? 'denied' : 'error',
          error: denied
            ? 'Location is blocked. On iPhone: Settings → Privacy & Security → Location Services → Safari Websites → While Using.'
            : 'Couldn’t get a GPS fix. Try again outdoors.',
          watchId: null,
        });
        navigator.geolocation.clearWatch(id);
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
    set({ watchId: id });
  },
  stop: () => {
    const id = get().watchId;
    if (id != null) navigator.geolocation.clearWatch(id);
    set({ watchId: null, status: 'idle' });
  },
}));

// ───── Weather (shared) ─────
interface WxState {
  data: Weather | null;
  live: boolean;
  error: string | null;
  loading: boolean;
  load: () => void;
}
export const useWeather = create<WxState>()((set, get) => ({
  data: null,
  live: false,
  error: null,
  loading: false,
  load: () => {
    if (get().loading) return;
    const d = get().data;
    if (d && get().live && Date.now() - new Date(d.fetchedAt).getTime() < 30 * 60000) return;
    set({ loading: true });
    fetchWeather()
      .then(({ data, live }) => set({ data, live, error: null, loading: false }))
      .catch((e: Error) => set({ error: e.message || 'Weather unavailable', loading: false }));
  },
}));

// ───── Plan & place lookup ─────
export function usePlan(): { activities: Activity[]; readOnly: boolean } {
  const shared = useUI((s) => s.shared);
  const mine = useTrip((s) => s.activities);
  return shared ? { activities: shared.activities, readOnly: true } : { activities: mine, readOnly: false };
}

export function findPlace(id?: string): Place | undefined {
  if (!id) return undefined;
  return PLACE_BY_ID[id] ?? useTrip.getState().saved[id]?.place ?? useUI.getState().shared?.saved?.find((p) => p.id === id);
}

export function activityPlace(a: Activity): Place | undefined {
  return a.placeSnapshot ?? findPlace(a.placeId);
}

export function actStart(a: Activity) { return zoned(a.day, a.start); }
export function actEnd(a: Activity) { return a.end ? zoned(a.day, a.end) : new Date(actStart(a).getTime() + 60 * 60000); }

export function currentAndNext(acts: Activity[], now: Date) {
  const planned = acts.filter((a) => a.status === 'planned');
  const current = planned.find((a) => actStart(a) <= now && now < actEnd(a));
  const next = planned.find((a) => actStart(a) > now && a.id !== current?.id);
  return { current, next };
}

export function useOnline(): boolean {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    window.addEventListener('online', a);
    window.addEventListener('offline', b);
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return on;
}
