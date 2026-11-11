import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Footprints, Train, Car, Heart, Navigation, ExternalLink, Phone, Plus, Star, Clock, Globe, CalendarDays, UtensilsCrossed, Info } from 'lucide-react';
import type { Place, SavedList } from '../types';
import { CAT, priceStr } from './meta';
import { Chip, Pill, Sheet, SourceNote } from './ui';
import { Photo } from './Photo';
import { useTrip, defaultListFor } from '../store/trip';
import { useUI } from '../store/ui';
import { useLocation, useNow } from '../lib/hooks';
import { distanceM, fmtDist, navUrl, placeDest, suggestMode, walkMin, type Mode } from '../lib/geo';
import { openStateAt, type OpenState } from '../lib/hours';
import { liveDetails } from '../lib/livePlaces';
import { DAYS } from '../data/trip';
import { PLACES } from '../data/places';
import { dayKey, fmt12, fromMin, toMin, hhmm } from '../lib/time';

export function OpenBadge({ s }: { s: OpenState }) {
  if (s.state === 'open') return <Pill tone={s.closesSoon ? 'amber' : 'green'}>{s.label}</Pill>;
  if (s.state === 'closed') return <Pill tone="red">{s.label}</Pill>;
  return <Pill>{s.label}</Pill>;
}

export function NavButtons({ place, compact = false }: { place: Place; compact?: boolean }) {
  const mapApp = useTrip((s) => s.mapApp);
  const loc = useLocation((s) => s.coords);
  const dist = loc ? distanceM(loc, place) : null;
  const [mode, setMode] = useState<Mode>(dist != null ? suggestMode(dist) : 'walk');
  const dest = placeDest(place);
  const modes: { m: Mode; label: string; Icon: typeof Car }[] = [
    { m: 'walk', label: 'Walk', Icon: Footprints },
    { m: 'transit', label: 'Transit', Icon: Train },
    { m: 'drive', label: 'Drive', Icon: Car },
  ];
  return (
    <div>
      <div className="flex gap-2 mb-2" role="radiogroup" aria-label="Travel mode">
        {modes.map(({ m, label, Icon }) => (
          <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
            className={`flex-1 h-11 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5 ${mode === m ? 'bg-navy text-white' : 'bg-white text-navy border border-navy/10'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
      <a href={navUrl(mapApp, dest, mode)} target="_blank" rel="noreferrer"
        className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brick text-white text-[17px] font-semibold shadow-card active:scale-[.99]">
        <Navigation size={20} /> Navigate in {mapApp === 'apple' ? 'Apple Maps' : 'Google Maps'}
      </a>
      {!compact && (
        <a href={navUrl(mapApp === 'apple' ? 'google' : 'apple', dest, mode)} target="_blank" rel="noreferrer"
          className="mt-2 flex h-11 items-center justify-center gap-2 rounded-2xl bg-white border border-navy/10 text-navy text-sm font-medium">
          Open in {mapApp === 'apple' ? 'Google Maps' : 'Apple Maps'} instead
        </a>
      )}
      {dist != null && (
        <SourceNote>
          {fmtDist(dist)} away · ~{walkMin(dist)} min walk (estimate from distance, not a routed ETA). Your maps app gives real directions{mode === 'transit' ? ' and live transit times' : mode === 'drive' ? ' and live traffic' : ''}.
        </SourceNote>
      )}
    </div>
  );
}

const LISTS: { id: SavedList; label: string }[] = [
  { id: 'want', label: 'Want to Visit' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'attractions', label: 'Attractions' },
];

export function SaveButton({ place, size = 'md' }: { place: Place; size?: 'sm' | 'md' }) {
  const saved = useTrip((s) => !!s.saved[place.id]);
  const toggle = useTrip((s) => s.toggleSaved);
  const toast = useUI((s) => s.showToast);
  const dim = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12';
  return (
    <button
      aria-label={saved ? `Remove ${place.name} from saved` : `Save ${place.name}`}
      aria-pressed={saved}
      onClick={(e) => { e.stopPropagation(); toggle(place); toast(saved ? 'Removed from Saved' : 'Saved ♥'); }}
      className={`${dim} shrink-0 grid place-items-center rounded-full ${saved ? 'bg-brick text-white' : 'bg-white text-navy border border-navy/10'}`}
    >
      <Heart size={size === 'sm' ? 18 : 20} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}

/** Pick a day + time and add a place to the itinerary. */
export function AddToDaySheet({ place, open, onClose }: { place: Place; open: boolean; onClose: () => void }) {
  const now = useNow();
  const add = useTrip((s) => s.addActivity);
  const toast = useUI((s) => s.showToast);
  const today = dayKey(now);
  const inTrip = DAYS.some((d) => d.key === today);
  const [day, setDay] = useState<string>(inTrip ? today : DAYS[1].key);
  const rounded = fromMin(Math.ceil((toMin(hhmm(now)) + 10) / 15) * 15);
  const [start, setStart] = useState<string>(inTrip ? rounded : '12:00');
  const dur = place.visitMin ?? (place.category === 'food' ? 75 : 45);
  return (
    <Sheet open={open} onClose={onClose} title={`Add “${place.name}”`}>
      <label className="block text-sm font-medium text-navy mb-2">Day</label>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {DAYS.map((d) => (
          <Chip key={d.key} active={day === d.key} onClick={() => setDay(d.key)}>{d.short} {d.date}</Chip>
        ))}
      </div>
      <label className="block text-sm font-medium text-navy mt-4 mb-2" htmlFor="add-start">Start time (Boston)</label>
      <input id="add-start" type="time" value={start} onChange={(e) => setStart(e.target.value)}
        className="w-full h-12 rounded-2xl border border-navy/15 bg-white px-4 text-lg" />
      <p className="text-sm text-ink/60 mt-2">Suggested length: {dur} min. Nothing else in your day moves.</p>
      <button
        onClick={() => {
          add({
            day, start, end: fromMin(toMin(start) + dur), title: place.name, category: place.category,
            placeId: place.source === 'curated' ? place.id : undefined,
            placeSnapshot: place.source === 'curated' ? undefined : place,
            description: place.why,
          });
          toast(`Added to ${DAYS.find((d) => d.key === day)?.label} at ${fmt12(start)}`);
          onClose();
        }}
        className="mt-5 w-full h-14 rounded-2xl bg-navy text-white font-semibold text-[17px]"
      >
        Add to {day === today ? 'Today' : DAYS.find((d) => d.key === day)?.label}
      </button>
    </Sheet>
  );
}

export function PlaceSheet() {
  const place = useUI((s) => s.sheetPlace);
  const close = useUI((s) => s.openPlace);
  return <Sheet open={!!place} onClose={() => close(null)} full>{place && <PlaceDetail key={place.id} place={place} />}</Sheet>;
}

function PlaceDetail({ place: base }: { place: Place }) {
  const now = useNow();
  const loc = useLocation((s) => s.coords);
  const openPlace = useUI((s) => s.openPlace);
  const shared = useUI((s) => !!s.shared);
  const note = useTrip((s) => s.placeNotes[base.id] ?? '');
  const setNote = useTrip((s) => s.setPlaceNote);
  const savedEntry = useTrip((s) => s.saved[base.id]);
  const setLists = useTrip((s) => s.setSavedLists);
  const toggleSaved = useTrip((s) => s.toggleSaved);
  const [live, setLive] = useState<Partial<Place> | null>(null);
  const [liveState, setLiveState] = useState<'idle' | 'loading' | 'none' | 'ok'>('idle');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    if (base.source === 'google') return;
    setLiveState('loading');
    liveDetails(base).then((d) => {
      if (!alive) return;
      setLive(d);
      setLiveState(d ? 'ok' : 'none');
    });
    return () => { alive = false; };
  }, [base]);

  const place: Place = useMemo(() => ({ ...base, ...Object.fromEntries(Object.entries(live ?? {}).filter(([, v]) => v != null)), id: base.id, source: base.source, category: base.category, name: base.name, why: base.why, wiki: base.wiki }), [base, live]);
  const os = openStateAt(place, now);
  const cat = CAT[place.category];
  const dist = loc ? distanceM(loc, place) : null;

  const similar = useMemo(() => {
    if (!['food', 'drinks', 'coffee', 'bakery'].includes(place.category)) return [];
    return PLACES.filter((p) => p.id !== place.id && p.category === place.category && distanceM(p, place) < 1200)
      .sort((a, b) => distanceM(a, place) - distanceM(b, place)).slice(0, 4);
  }, [place]);

  const searchQ = encodeURIComponent(`${place.name} ${place.address ?? 'Boston'}`);
  return (
    <div className="pb-4">
      <Photo place={place} className="h-56 w-full -mt-1" rounded="rounded-3xl" />
      <div className="mt-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: cat.color }}>
            {cat.label}{place.cuisine?.length ? ` · ${place.cuisine.slice(0, 2).join(', ')}` : ''}{place.price ? ` · ${priceStr(place.price)}` : ''}
          </div>
          <h2 className="font-display text-[28px] leading-tight text-navy mt-1">{place.name}</h2>
          {place.neighborhood && <div className="text-ink/60 text-sm">{place.neighborhood}</div>}
        </div>
        {!shared && <SaveButton place={place} />}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <OpenBadge s={os} />
        {place.rating != null && (
          <Pill tone="blue"><Star size={12} fill="currentColor" /> {place.rating.toFixed(1)} ({place.ratingCount?.toLocaleString() ?? '—'} on Google)</Pill>
        )}
        {place.free && <Pill tone="green">Free</Pill>}
        {place.tags?.includes('local-favorite') && <Pill tone="navy">Local favorite</Pill>}
        {place.tags?.includes('hidden-gem') && <Pill tone="amber">Hidden gem</Pill>}
        {place.tags?.includes('cash-only') && <Pill tone="amber">Historically cash-only</Pill>}
        {place.tags?.includes('paid') && <Pill>Paid · not booked</Pill>}
        {dist != null && <Pill>{fmtDist(dist)} · ~{walkMin(dist)} min walk</Pill>}
      </div>

      {place.why && <p className="mt-4 text-[16px] leading-relaxed text-ink">{place.why}</p>}
      {place.verify && (
        <p className="mt-3 flex gap-2 text-sm text-amber-900 bg-amber-50 rounded-2xl p-3"><Info size={16} className="shrink-0 mt-0.5" />{place.verify}</p>
      )}

      <div className="mt-5"><NavButtons place={place} /></div>

      <div className="mt-6 space-y-3 text-[15px]">
        {place.address && <Row icon={<Navigation size={16} />}>{place.address}</Row>}
        <Row icon={<Clock size={16} />}>
          {place.googleHours?.length ? (
            <ul className="space-y-0.5">{place.googleHours.map((h) => <li key={h}>{h}</li>)}</ul>
          ) : place.openingHours ? (
            <span className="font-mono text-[13px]">{place.openingHours}</span>
          ) : (
            <span className="text-ink/60">No verified hours.</span>
          )}
          {place.hoursNote && <SourceNote>{place.hoursNote}</SourceNote>}
          {os.source && <SourceNote>Hours source: {os.source}.</SourceNote>}
          {liveState === 'loading' && <SourceNote>Checking live info…</SourceNote>}
          {liveState === 'none' && base.source === 'curated' && (
            <SourceNote>Live ratings/hours need the optional Google Places setup (see README). Use “Search reviews” below meanwhile.</SourceNote>
          )}
        </Row>
        {place.phone && <Row icon={<Phone size={16} />}><a className="text-harbor underline" href={`tel:${place.phone}`}>{place.phone}</a></Row>}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-5">
        {place.website && <LinkBtn href={place.website} icon={<Globe size={16} />}>Website</LinkBtn>}
        <LinkBtn href={place.menu ?? `https://www.google.com/search?q=${searchQ}+menu`} icon={<UtensilsCrossed size={16} />}>{place.menu ? 'Menu' : 'Find menu'}</LinkBtn>
        {place.reservation ? (
          <LinkBtn href={place.reservation} icon={<CalendarDays size={16} />}>Reservations</LinkBtn>
        ) : ['food', 'drinks'].includes(place.category) ? (
          <LinkBtn href={`https://www.google.com/search?q=${searchQ}+reservations`} icon={<CalendarDays size={16} />}>Check reservations</LinkBtn>
        ) : null}
        <LinkBtn href={place.googleMapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${searchQ}`} icon={<Star size={16} />}>Search reviews</LinkBtn>
      </div>

      {!shared && (
        <>
          <button onClick={() => setAdding(true)} className="mt-4 w-full h-14 rounded-2xl bg-navy text-white font-semibold flex items-center justify-center gap-2">
            <Plus size={20} /> Add to Today / a day
          </button>

          <div className="mt-6">
            <div className="text-sm font-semibold text-navy mb-2">Save to list</div>
            <div className="flex flex-wrap gap-2">
              {LISTS.map((l) => {
                const on = savedEntry?.lists.includes(l.id) ?? false;
                return (
                  <Chip key={l.id} active={on} onClick={() => {
                    if (!savedEntry) { toggleSaved(place, l.id); return; }
                    const lists = on ? savedEntry.lists.filter((x) => x !== l.id) : [...savedEntry.lists, l.id];
                    if (lists.length) setLists(place.id, lists); else toggleSaved(place);
                  }}>{l.label}</Chip>
                );
              })}
            </div>
            {!savedEntry && <SourceNote>Tap ♥ to save to “{LISTS.find((l) => l.id === defaultListFor(place))?.label}”.</SourceNote>}
          </div>

          <div className="mt-6">
            <label htmlFor="pnote" className="text-sm font-semibold text-navy">Our notes</label>
            <textarea id="pnote" value={note} onChange={(e) => setNote(place.id, e.target.value)} rows={3}
              placeholder="e.g. Ask for the patio, try the espresso martini…"
              className="mt-2 w-full rounded-2xl border border-navy/15 bg-white p-3 text-[15px]" />
          </div>
        </>
      )}

      {similar.length > 0 && (
        <div className="mt-6">
          <div className="text-sm font-semibold text-navy mb-2">Similar nearby (if this one’s closed or packed)</div>
          <div className="space-y-2">
            {similar.map((p) => (
              <button key={p.id} onClick={() => openPlace(p)} className="w-full flex items-center gap-3 bg-white rounded-2xl p-2 text-left shadow-card">
                <Photo place={p} className="h-14 w-14" rounded="rounded-xl" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy truncate">{p.name}</div>
                  <div className="text-xs text-ink/60">{fmtDist(distanceM(p, place))} from here · {priceStr(p.price)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <SourceNote>
        {place.source === 'osm' && 'Live listing from OpenStreetMap (community data). Ratings aren’t available from this source.'}
        {place.source === 'google' && `Live listing from Google Places${place.fetchedAt ? `, fetched ${new Date(place.fetchedAt).toLocaleTimeString()}` : ''}.`}
        {place.source === 'curated' && 'Curated suggestion. Map pin is approximate; navigation uses the street address.'}
        {place.source === 'custom' && 'Added by you.'}
      </SourceNote>

      {!shared && <AddToDaySheet place={place} open={adding} onClose={() => setAdding(false)} />}
    </div>
  );
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-full bg-sand grid place-items-center text-navy shrink-0">{icon}</div>
      <div className="flex-1 pt-1">{children}</div>
    </div>
  );
}

function LinkBtn({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="h-12 rounded-2xl bg-white border border-navy/10 text-navy text-sm font-medium flex items-center justify-center gap-2">
      {icon} {children} <ExternalLink size={12} className="opacity-50" />
    </a>
  );
}

/** Compact list row used in Explore, Saved, Home. */
export function PlaceRow({ place, origin, at, right }: { place: Place; origin?: { lat: number; lng: number } | null; at?: Date; right?: ReactNode }) {
  const openPlace = useUI((s) => s.openPlace);
  const now = useNow();
  const os = openStateAt(place, at ?? now);
  const d = origin ? distanceM(origin, place) : null;
  const cat = CAT[place.category];
  const mapApp = useTrip((s) => s.mapApp);
  return (
    <div className="bg-white rounded-3xl shadow-card p-2.5 flex gap-3 items-stretch">
      <button onClick={() => openPlace(place)} className="flex gap-3 flex-1 min-w-0 text-left" aria-label={`Open ${place.name}`}>
        <Photo place={place} className="h-[84px] w-[84px] shrink-0" />
        <div className="flex-1 min-w-0 py-0.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide truncate" style={{ color: cat.color }}>
            {cat.label}{place.cuisine?.length ? ` · ${place.cuisine[0]}` : ''}{place.price ? ` · ${priceStr(place.price)}` : ''}
          </div>
          <div className="font-semibold text-navy text-[16px] leading-snug line-clamp-2">{place.name}</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <OpenBadge s={os} />
            {d != null && <span className="text-xs text-ink/60">{walkMin(d)} min · {fmtDist(d)}</span>}
            {place.rating != null && <span className="text-xs text-ink/60">★ {place.rating.toFixed(1)}</span>}
          </div>
        </div>
      </button>
      <div className="flex flex-col justify-between items-end gap-2">
        {right ?? <SaveButton place={place} size="sm" />}
        <a href={navUrl(mapApp, placeDest(place), d != null ? suggestMode(d) : 'walk')} target="_blank" rel="noreferrer"
          aria-label={`Directions to ${place.name}`}
          className="h-10 w-10 grid place-items-center rounded-full bg-navy text-white">
          <Navigation size={18} />
        </a>
      </div>
    </div>
  );
}
