import { useMemo, useState } from 'react';
import { CalendarPlus, Check, Heart } from 'lucide-react';
import type { Place, SavedList } from '../types';
import { useTrip } from '../store/trip';
import { useUI } from '../store/ui';
import { activityPlace, useLocation, usePlan } from '../lib/hooks';
import { Chip, SourceNote } from '../components/ui';
import { AddToDaySheet, PlaceRow } from '../components/PlaceBits';

type Tab = SavedList | 'completed';
const TABS: { id: Tab; label: string }[] = [
  { id: 'want', label: 'Want to Visit' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'attractions', label: 'Attractions' },
  { id: 'completed', label: 'Completed' },
];

export default function Saved() {
  const [tab, setTab] = useState<Tab>('want');
  const saved = useTrip((s) => s.saved);
  const setVisited = useTrip((s) => s.setVisited);
  const { activities, readOnly } = usePlan();
  const shared = useUI((s) => s.shared);
  const goExplore = useUI((s) => s.goExplore);
  const loc = useLocation((s) => s.coords);
  const [adding, setAdding] = useState<Place | null>(null);

  const entries = useMemo(() => Object.values(saved).sort((a, b) => b.addedAt.localeCompare(a.addedAt)), [saved]);
  const completedPlaces = useMemo(() => {
    const fromActs = activities.filter((a) => a.status === 'done').map(activityPlace).filter((p): p is Place => !!p && p.category !== 'lodging' && p.category !== 'transport');
    const fromSaved = entries.filter((e) => e.visited).map((e) => e.place);
    const m = new Map<string, Place>();
    [...fromActs, ...fromSaved].forEach((p) => m.set(p.id, p));
    return [...m.values()];
  }, [activities, entries]);

  const sharedSaved = shared?.saved ?? [];
  const list: Place[] = readOnly
    ? sharedSaved
    : tab === 'completed'
      ? completedPlaces
      : tab === 'want'
        ? entries.filter((e) => !e.visited).map((e) => e.place)
        : entries.filter((e) => e.lists.includes(tab) && !e.visited).map((e) => e.place);

  const counts = (t: Tab) => (t === 'completed' ? completedPlaces.length : t === 'want' ? entries.filter((e) => !e.visited).length : entries.filter((e) => e.lists.includes(t) && !e.visited).length);

  return (
    <div className="max-w-[560px] mx-auto">
      <header className="sticky top-0 z-[500] bg-cream/95 backdrop-blur pt-[calc(env(safe-area-inset-top)+12px)] pb-2 border-b border-navy/5">
        <h1 className="font-display text-[30px] text-navy px-4">Saved</h1>
        {!readOnly && (
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
            {TABS.map((t) => <Chip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label} · {counts(t.id)}</Chip>)}
          </div>
        )}
      </header>
      <div className="px-4 pt-3 space-y-2.5">
        {readOnly && <SourceNote>Places saved by whoever shared this plan.</SourceNote>}
        {list.length === 0 && (
          <div className="text-center py-14">
            <div className="mx-auto h-16 w-16 rounded-full bg-white shadow-card grid place-items-center text-brick"><Heart size={28} /></div>
            <p className="mt-3 text-ink/70">{tab === 'completed' ? 'Places you finish show up here.' : 'Tap ♥ on any place to save it for later.'}</p>
            <button onClick={() => goExplore({ cat: 'all', mode: 'browse' })} className="mt-4 h-12 px-5 rounded-full bg-navy text-white font-semibold">Explore nearby</button>
          </div>
        )}
        {list.map((p) => (
          <div key={p.id}>
            <PlaceRow place={p} origin={loc} />
            {!readOnly && tab !== 'completed' && (
              <div className="flex gap-2 mt-1.5 pl-2">
                <button onClick={() => setAdding(p)} className="h-10 px-3 rounded-full bg-white border border-navy/10 text-navy text-sm font-medium flex items-center gap-1.5"><CalendarPlus size={15} /> Add to Today</button>
                {saved[p.id] && (
                  <button onClick={() => setVisited(p.id, true)} className="h-10 px-3 rounded-full bg-white border border-navy/10 text-navy text-sm font-medium flex items-center gap-1.5"><Check size={15} /> Been there</button>
                )}
              </div>
            )}
            {!readOnly && tab === 'completed' && saved[p.id]?.visited && (
              <button onClick={() => setVisited(p.id, false)} className="mt-1.5 ml-2 h-9 px-3 rounded-full bg-white border border-navy/10 text-navy text-xs font-medium">Move back to Want to Visit</button>
            )}
          </div>
        ))}
        <SourceNote>Saved places are stored on this device and included when you share a plan link.</SourceNote>
      </div>
      {adding && <AddToDaySheet place={adding} open onClose={() => setAdding(null)} />}
    </div>
  );
}
