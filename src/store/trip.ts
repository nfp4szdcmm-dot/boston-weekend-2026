import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity, CheckItem, Contact, Place, Rental, SavedEntry, SavedList } from '../types';
import { DEFAULT_DEPARTURE, DEFAULT_RENTAL, DEFAULT_TRIP_CHECKLIST, SEED_ACTIVITIES } from '../data/trip';
import { addMin, toMin } from '../lib/time';

const uid = () => Math.random().toString(36).slice(2, 10);

export function sortActivities(list: Activity[]): Activity[] {
  return [...list].sort((a, b) => (a.day === b.day ? toMin(a.start) - toMin(b.start) : a.day < b.day ? -1 : 1));
}

export interface TripState {
  activities: Activity[];
  saved: Record<string, SavedEntry>;
  placeNotes: Record<string, string>;
  rental: Rental;
  contacts: Contact[];
  checklist: CheckItem[];
  departure: CheckItem[];
  mapApp: 'apple' | 'google';
  /** Preview clock: shows the app as if it were this time (clearly labelled in the UI). */
  sim: { target: number; setAt: number } | null;
  locationOptIn: boolean;

  updateActivity: (id: string, patch: Partial<Activity>) => void;
  addActivity: (a: Omit<Activity, 'id' | 'status'> & { status?: Activity['status'] }) => string;
  deleteActivity: (id: string) => void;
  setStatus: (id: string, status: Activity['status']) => void;
  swapWithNeighbor: (id: string, dir: -1 | 1) => boolean;
  shiftFlexible: (day: string, fromTime: string, minutes: number) => { shifted: number; blocked: string[] };
  applyOrder: (day: string, orderedIds: string[]) => void;
  resetItinerary: () => void;

  toggleSaved: (place: Place, list?: SavedList) => void;
  setSavedLists: (id: string, lists: SavedList[]) => void;
  setVisited: (id: string, visited: boolean) => void;
  setPlaceNote: (id: string, note: string) => void;

  setRental: (patch: Partial<Rental>) => void;
  upsertContact: (c: Contact) => void;
  removeContact: (id: string) => void;
  toggleCheck: (which: 'checklist' | 'departure', id: string) => void;
  addCheck: (which: 'checklist' | 'departure', text: string) => void;
  removeCheck: (which: 'checklist' | 'departure', id: string) => void;

  setMapApp: (a: 'apple' | 'google') => void;
  setSim: (target: Date | null) => void;
  setLocationOptIn: (v: boolean) => void;
  replaceActivities: (acts: Activity[]) => void;
}

export function defaultListFor(p: Place): SavedList {
  if (p.category === 'food' || p.category === 'bakery' || p.category === 'coffee') return 'restaurants';
  if (p.category === 'drinks') return 'drinks';
  if (p.category === 'shopping' || p.category === 'boutique') return 'shopping';
  if (p.category === 'sight' || p.category === 'photo' || p.category === 'fun') return 'attractions';
  return 'want';
}

export const useTrip = create<TripState>()(
  persist(
    (set, get) => ({
      activities: SEED_ACTIVITIES,
      saved: {},
      placeNotes: {},
      rental: DEFAULT_RENTAL,
      contacts: [],
      checklist: DEFAULT_TRIP_CHECKLIST,
      departure: DEFAULT_DEPARTURE,
      mapApp: /iPhone|iPad|Macintosh/.test(navigator.userAgent) ? 'apple' : 'google',
      sim: null,
      locationOptIn: false,

      updateActivity: (id, patch) =>
        set((s) => ({
          activities: s.activities.map((a) => {
            if (a.id !== id) return a;
            if (a.locked) {
              // Required events: only notes can change.
              return { ...a, notes: patch.notes ?? a.notes };
            }
            return { ...a, ...patch };
          }),
        })),

      addActivity: (a) => {
        const id = 'u-' + uid();
        set((s) => ({ activities: sortActivities([...s.activities, { status: 'planned', ...a, id }]) }));
        return id;
      },

      deleteActivity: (id) =>
        set((s) => ({ activities: s.activities.filter((a) => a.id !== id || a.locked || a.status === 'done') })),

      setStatus: (id, status) =>
        set((s) => ({
          activities: s.activities.map((a) =>
            a.id === id ? { ...a, status, completedAt: status === 'done' ? new Date().toISOString() : undefined } : a,
          ),
        })),

      swapWithNeighbor: (id, dir) => {
        const acts = sortActivities(get().activities);
        const me = acts.find((a) => a.id === id);
        if (!me || me.locked) return false;
        const sameDay = acts.filter((a) => a.day === me.day);
        const idx = sameDay.findIndex((a) => a.id === id);
        const other = sameDay[idx + dir];
        if (!other || other.locked) return false;
        const meDur = me.end ? toMin(me.end) - toMin(me.start) : 60;
        const otherDur = other.end ? toMin(other.end) - toMin(other.start) : 60;
        const first = dir === -1 ? other.start : me.start;
        const [aFirst, aSecond] = dir === -1 ? [me, other] : [other, me];
        const aFirstDur = dir === -1 ? meDur : otherDur;
        const aSecondDur = dir === -1 ? otherDur : meDur;
        const secondStart = addMin(first, aFirstDur);
        set((s) => ({
          activities: sortActivities(
            s.activities.map((a) => {
              if (a.id === aFirst.id) return { ...a, start: first, end: addMin(first, aFirstDur) };
              if (a.id === aSecond.id) return { ...a, start: secondStart, end: addMin(secondStart, aSecondDur) };
              return a;
            }),
          ),
        }));
        return true;
      },

      shiftFlexible: (day, fromTime, minutes) => {
        const acts = sortActivities(get().activities).filter((a) => a.day === day && a.status === 'planned' && toMin(a.start) >= toMin(fromTime));
        const firstLocked = acts.find((a) => a.locked);
        const limit = firstLocked ? toMin(firstLocked.start) : 24 * 60;
        const blocked: string[] = [];
        const shiftIds = new Set<string>();
        for (const a of acts) {
          if (a.locked) break;
          const newEnd = toMin(a.end ?? addMin(a.start, 60)) + minutes;
          if (newEnd > limit) blocked.push(a.title);
          else shiftIds.add(a.id);
        }
        set((s) => ({
          activities: sortActivities(
            s.activities.map((a) =>
              shiftIds.has(a.id) ? { ...a, start: addMin(a.start, minutes), end: a.end ? addMin(a.end, minutes) : undefined } : a,
            ),
          ),
        }));
        return { shifted: shiftIds.size, blocked };
      },

      applyOrder: (day, orderedIds) => {
        const acts = get().activities;
        const chosen = orderedIds.map((id) => acts.find((a) => a.id === id)!).filter((a) => a && !a.locked);
        const slots = sortActivities(chosen).map((a) => a.start);
        const durations = new Map(chosen.map((a) => [a.id, a.end ? toMin(a.end) - toMin(a.start) : 60]));
        const newStart = new Map<string, string>();
        chosen.forEach((a, i) => newStart.set(a.id, slots[i]));
        set((s) => ({
          activities: sortActivities(
            s.activities.map((a) => {
              const ns = a.day === day ? newStart.get(a.id) : undefined;
              return ns ? { ...a, start: ns, end: addMin(ns, durations.get(a.id) ?? 60) } : a;
            }),
          ),
        }));
      },

      resetItinerary: () => set({ activities: SEED_ACTIVITIES }),
      replaceActivities: (acts) => set({ activities: sortActivities(acts) }),

      toggleSaved: (place, list) =>
        set((s) => {
          const saved = { ...s.saved };
          if (saved[place.id] && !list) delete saved[place.id];
          else if (saved[place.id] && list) {
            const lists = saved[place.id].lists.includes(list) ? saved[place.id].lists : [...saved[place.id].lists, list];
            saved[place.id] = { ...saved[place.id], lists };
          } else saved[place.id] = { place, lists: [list ?? defaultListFor(place)], addedAt: new Date().toISOString() };
          return { saved };
        }),
      setSavedLists: (id, lists) =>
        set((s) => (s.saved[id] ? { saved: { ...s.saved, [id]: { ...s.saved[id], lists } } } : s)),
      setVisited: (id, visited) =>
        set((s) => (s.saved[id] ? { saved: { ...s.saved, [id]: { ...s.saved[id], visited } } } : s)),
      setPlaceNote: (id, note) => set((s) => ({ placeNotes: { ...s.placeNotes, [id]: note } })),

      setRental: (patch) => set((s) => ({ rental: { ...s.rental, ...patch } })),
      upsertContact: (c) =>
        set((s) => ({ contacts: s.contacts.some((x) => x.id === c.id) ? s.contacts.map((x) => (x.id === c.id ? c : x)) : [...s.contacts, c] })),
      removeContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
      toggleCheck: (which, id) => set((s) => ({ [which]: s[which].map((c) => (c.id === id ? { ...c, done: !c.done } : c)) }) as Partial<TripState>),
      addCheck: (which, text) => set((s) => ({ [which]: [...s[which], { id: uid(), text, done: false }] }) as Partial<TripState>),
      removeCheck: (which, id) => set((s) => ({ [which]: s[which].filter((c) => c.id !== id) }) as Partial<TripState>),

      setMapApp: (mapApp) => set({ mapApp }),
      setSim: (target) => set({ sim: target ? { target: target.getTime(), setAt: Date.now() } : null }),
      setLocationOptIn: (locationOptIn) => set({ locationOptIn }),
    }),
    { name: 'bw26-trip', version: 1 },
  ),
);

export const newId = uid;
