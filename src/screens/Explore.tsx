import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Shuffle, LocateFixed, SlidersHorizontal, RefreshCw, Sparkles, Plus, Navigation } from 'lucide-react';
import type { Place } from '../types';
import { useUI, type ExploreCat } from '../store/ui';
import { useTrip } from '../store/trip';
import { activityPlace, currentAndNext, useLocation, useNow, usePlan } from '../lib/hooks';
import { NEIGHBORHOODS, PLACES } from '../data/places';
import { distanceM, fmtDist, navUrl, placeDest, walkMin, walkRadius } from '../lib/geo';
import { openForWindow, openStateAt } from '../lib/hours';
import { kindsFor, mergePlaces, searchNearby, type LiveResult } from '../lib/livePlaces';
import { Card, Chip, Sheet, SourceNote, Spinner } from '../components/ui';
import { PlaceRow, OpenBadge } from '../components/PlaceBits';
import { Photo } from '../components/Photo';
import { CAT } from '../components/meta';
import { dayKey, fmt12, fromMin, hhmm, toMin } from '../lib/time';

const CATS: { id: ExploreCat; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'food', label: '🍽️ Food' },
  { id: 'drinks', label: '🍸 Cocktail bars' },
  { id: 'coffee', label: '☕ Coffee' },
  { id: 'bakery', label: '🥐 Bakeries' },
  { id: 'boutique', label: '👜 Boutiques' },
  { id: 'shopping', label: '🛍️ Shopping' },
  { id: 'sight', label: '🏛️ Historic' },
  { id: 'photo', label: '📸 Photo spots' },
  { id: 'fun', label: '🎟️ Fun' },
  { id: 'hidden', label: '💎 Hidden gems' },
];

const FOOD_TAGS: { id: string; label: string }[] = [
  { id: 'casual', label: 'Casual' },
  { id: 'fun', label: 'Fun atmosphere' },
  { id: 'cocktails', label: 'Good cocktails' },
  { id: 'seafood', label: 'Seafood' },
  { id: 'italian', label: 'Italian' },
  { id: 'american', label: 'American' },
  { id: 'pizza', label: 'Pizza' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'dessert', label: 'Dessert' },
  { id: 'budget', label: 'Budget friendly' },
];

const SHOP_TAGS: { id: string; label: string }[] = [
  { id: 'boutique', label: 'Boutiques' },
  { id: 'books', label: 'Bookstores' },
  { id: 'gifts', label: 'Gifts & souvenirs' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'outlets', label: 'Outlets' },
];

function matchesCat(p: Place, c: ExploreCat): boolean {
  if (p.category === 'lodging' || p.category === 'transport' || p.category === 'event') return false;
  switch (c) {
    case 'all': return true;
    case 'drinks': return p.category === 'drinks' || (p.category === 'food' && !!p.tags?.includes('cocktails'));
    case 'boutique': return p.category === 'boutique' || (p.category === 'shopping' && !!p.tags?.includes('boutique'));
    case 'shopping': return p.category === 'shopping' || p.category === 'boutique';
    case 'sight': return p.category === 'sight' || !!p.tags?.includes('historic');
    case 'photo': return p.category === 'photo' || !!p.tags?.includes('photo-spot');
    case 'hidden': return !!p.tags?.includes('hidden-gem');
    case 'coffee': return p.category === 'coffee' || !!p.tags?.includes('coffee');
    case 'bakery': return p.category === 'bakery';
    default: return p.category === c;
  }
}

const DEFAULT_VISIT: Record<string, number> = { food: 60, drinks: 45, coffee: 20, bakery: 15, shopping: 30, boutique: 25, sight: 30, photo: 15, fun: 60 };
const visitOf = (p: Place) => p.visitMin ?? DEFAULT_VISIT[p.category] ?? 30;

type Mode = 'browse' | '1h' | '2h';

export default function Explore() {
  const now = useNow();
  const preset = useUI((s) => s.explorePreset);
  const loc = useLocation();
  const { activities } = usePlan();
  const [cat, setCat] = useState<ExploreCat>('all');
  const [mode, setMode] = useState<Mode>('browse');
  const [walk, setWalk] = useState<5 | 10 | 20>(10);
  const [openNow, setOpenNow] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [localFav, setLocalFav] = useState(false);
  const [inout, setInout] = useState<'any' | 'indoor' | 'outdoor'>('any');
  const [freeOnly, setFreeOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [anchorId, setAnchorId] = useState<string>('auto');
  const [live, setLive] = useState<LiveResult | null>(null);
  const [liveErr, setLiveErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [surprise, setSurprise] = useState<Place | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!preset) return;
    if (preset.cat) setCat(preset.cat);
    setOpenNow(!!preset.openNow);
    if (preset.mode === '1h' || preset.mode === '2h' || preset.mode === 'browse') setMode(preset.mode);
    setTags([]);
    if (loc.status === 'idle') loc.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset?.nonce]);

  // Anchor: GPS → current/next stop → Assembly Row
  const { current, next } = currentAndNext(activities, now);
  const stopPlace = current ? activityPlace(current) : next && dayKey(now) === next.day ? activityPlace(next) : undefined;
  const anchor = useMemo(() => {
    if (anchorId === 'auto') {
      if (loc.coords) return { ...loc.coords, label: 'you' };
      if (stopPlace) return { lat: stopPlace.lat, lng: stopPlace.lng, label: stopPlace.name };
      return { ...NEIGHBORHOODS[0], label: NEIGHBORHOODS[0].label };
    }
    const n = NEIGHBORHOODS.find((x) => x.id === anchorId)!;
    return { lat: n.lat, lng: n.lng, label: n.label };
  }, [anchorId, loc.coords?.lat, loc.coords?.lng, stopPlace?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const budget = mode === '1h' ? 60 : mode === '2h' ? 120 : 0;
  const radius = budget ? walkRadius(budget === 60 ? 15 : 25) : walkRadius(walk);

  // Live places
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLiveErr(null);
    const t = setTimeout(() => {
      searchNearby(anchor, Math.max(radius, 400), kindsFor(cat))
        .then((r) => { if (alive) { setLive(r); if (r.error) setLiveErr(r.error); } })
        .catch((e: Error) => alive && setLiveErr(e.message || 'Live places unavailable'))
        .finally(() => alive && setLoading(false));
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [anchor.lat, anchor.lng, cat, radius, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const all = useMemo(() => mergePlaces(PLACES, live?.places ?? []), [live]);

  const filtered = useMemo(() => {
    let hiddenUnknown = 0;
    const list = all
      .filter((p) => matchesCat(p, cat))
      .map((p) => ({ p, d: distanceM(anchor, p) }))
      .filter(({ d }) => d <= radius)
      .filter(({ p }) => {
        if (price && (!p.price || p.price > price)) return false;
        if (minRating && (p.rating == null || p.rating < minRating)) return false;
        if (localFav && !p.tags?.includes('local-favorite')) return false;
        if (freeOnly && !p.free) return false;
        if (inout === 'indoor' && p.indoor !== true && ['sight', 'photo'].includes(p.category)) return false;
        if (inout === 'outdoor' && p.indoor !== false) return false;
        if (tags.length && !tags.some((t) => p.tags?.includes(t) || (t === 'coffee' && p.category === 'coffee'))) return false;
        if (openNow) {
          const s = openStateAt(p, now).state;
          if (s === 'unknown') { hiddenUnknown++; return false; }
          if (s === 'closed') return false;
        }
        if (openStateAt(p, now).state === 'closed' && mode !== 'browse') return false;
        return true;
      })
      .sort((a, b) => {
        // Curated & local favourites float up slightly; otherwise nearest first.
        const w = (x: { p: Place; d: number }) => x.d - (x.p.source === 'curated' ? 150 : 0) - (x.p.tags?.includes('local-favorite') ? 100 : 0);
        return w(a) - w(b);
      });
    return { list, hiddenUnknown };
  }, [all, cat, anchor, radius, price, minRating, localFav, freeOnly, inout, tags, openNow, now, mode]);

  const plans = useMemo(() => (budget ? buildPlans(all, anchor, budget, now) : []), [all, anchor, budget, now]);

  function doSurprise() {
    const pool = all
      .filter((p) => matchesCat(p, cat) && p.category !== 'lodging' && p.category !== 'transport' && p.category !== 'event')
      .filter((p) => distanceM(anchor, p) <= walkRadius(12))
      .filter((p) => {
        const s = openStateAt(p, now).state;
        return s === 'open' || (s === 'unknown' && (p.free || p.category === 'photo' || p.category === 'sight'));
      });
    if (!pool.length) { setSurprise(null); alert('Nothing we can vouch for is open within ~12 minutes. Try a different area or category.'); return; }
    const weighted = pool.flatMap((p) => Array(1 + (p.tags?.includes('local-favorite') ? 2 : 0) + (p.tags?.includes('hidden-gem') ? 3 : 0) + (p.source === 'curated' ? 1 : 0)).fill(p));
    setSurprise(weighted[Math.floor(Math.random() * weighted.length)]);
  }

  const isFood = cat === 'food' || cat === 'drinks';
  const isShop = cat === 'shopping' || cat === 'boutique';
  const activeFilterCount = [price, minRating, localFav || null, inout !== 'any' || null, freeOnly || null].filter(Boolean).length + tags.length;

  return (
    <div className="max-w-[560px] mx-auto">
      <header className="sticky top-0 z-[500] bg-cream/95 backdrop-blur pt-[calc(env(safe-area-inset-top)+12px)] pb-2 border-b border-navy/5">
        <div className="px-4 flex items-center justify-between">
          <h1 className="font-display text-[30px] text-navy">Explore</h1>
          <button onClick={doSurprise} className="h-11 px-4 rounded-full bg-brick text-white font-semibold flex items-center gap-1.5 shadow-card"><Shuffle size={16} /> Surprise Me</button>
        </div>

        <div className="px-4 mt-2 flex items-center gap-2 text-sm">
          <LocateFixed size={16} className="text-harbor shrink-0" />
          <select value={anchorId} onChange={(e) => setAnchorId(e.target.value)} aria-label="Search near"
            className="flex-1 min-w-0 h-10 rounded-full bg-white border border-navy/10 px-3 text-navy font-medium">
            <option value="auto">{loc.coords ? 'Near me (GPS)' : stopPlace ? `Near ${stopPlace.name}` : 'Near Assembly Row'}</option>
            {NEIGHBORHOODS.map((n) => <option key={n.id} value={n.id}>Near {n.label}</option>)}
          </select>
          {loc.status !== 'granted' && (
            <button onClick={loc.start} className="h-10 px-3 rounded-full bg-navy text-white text-xs font-semibold">{loc.status === 'locating' ? 'Locating…' : 'Use GPS'}</button>
          )}
        </div>
        {loc.error && <p className="px-4 text-xs text-red-700 mt-1">{loc.status === 'denied' ? 'Location is blocked — showing the area picked above. (iPhone: Settings → Privacy → Location Services → Safari Websites.)' : loc.error}</p>}

        <div className="px-4 mt-2 grid grid-cols-3 gap-2">
          {(['browse', '1h', '2h'] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
              className={`h-10 rounded-2xl text-[13px] font-semibold leading-tight ${mode === m ? 'bg-navy text-white' : 'bg-white text-navy'}`}>
              {m === 'browse' ? 'Browse' : m === '1h' ? 'We Have 1 Hr' : 'We Have 2 Hrs'}
            </button>
          ))}
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
          {CATS.map((c) => <Chip key={c.id} active={cat === c.id} onClick={() => { setCat(c.id); setTags([]); }}>{c.label}</Chip>)}
        </div>
        {mode === 'browse' && (
          <div className="mt-1 flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
            {([5, 10, 20] as const).map((w) => <Chip key={w} active={walk === w} onClick={() => setWalk(w)}>≤{w} min walk</Chip>)}
            <Chip active={openNow} onClick={() => setOpenNow(!openNow)}>Open now</Chip>
            <Chip active={activeFilterCount > 0} onClick={() => setFiltersOpen(true)}>
              <span className="flex items-center gap-1"><SlidersHorizontal size={14} /> Filters{activeFilterCount ? ` · ${activeFilterCount}` : ''}</span>
            </Chip>
          </div>
        )}
        {mode === 'browse' && (isFood || isShop) && (
          <div className="mt-1 flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
            {(isFood ? FOOD_TAGS : SHOP_TAGS).map((t) => (
              <Chip key={t.id} active={tags.includes(t.id)} className="h-9 text-[13px]"
                onClick={() => setTags(tags.includes(t.id) ? tags.filter((x) => x !== t.id) : [...tags, t.id])}>{t.label}</Chip>
            ))}
          </div>
        )}
      </header>

      <div className="px-4 pt-3">
        <div className="flex items-center justify-between text-xs text-ink/60">
          <span>
            {loading ? 'Checking live places…' : live
              ? `Live: ${live.source === 'google' ? 'Google Places' : 'OpenStreetMap'}${live.cached ? ' (cached)' : ''} · ${new Date(live.fetchedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
              : 'Showing curated picks'}
          </span>
          <button onClick={() => setReload((r) => r + 1)} className="h-8 px-2 flex items-center gap-1 text-harbor font-semibold" aria-label="Refresh live places"><RefreshCw size={13} /> Refresh</button>
        </div>
        {liveErr && <p className="text-xs text-amber-800 bg-amber-50 rounded-xl px-3 py-2 mt-1">Live data issue: {liveErr}. Curated picks still shown.</p>}

        {surprise && (
          <Card className="p-3 mt-3 ring-2 ring-gold">
            <div className="flex items-center gap-2 text-sm font-semibold text-brick"><Sparkles size={16} /> Surprise pick</div>
            <div className="flex gap-3 mt-2">
              <Photo place={surprise} className="h-24 w-24 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-xl text-navy leading-tight">{surprise.name}</div>
                <div className="text-sm text-ink/60">{CAT[surprise.category].label} · {walkMin(distanceM(anchor, surprise))} min walk</div>
                <div className="mt-1"><OpenBadge s={openStateAt(surprise, now)} /></div>
              </div>
            </div>
            {surprise.why && <p className="text-sm mt-2 text-ink/80">{surprise.why}</p>}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <SurpriseGo place={surprise} />
              <button onClick={doSurprise} className="h-12 rounded-2xl bg-sand text-navy font-semibold flex items-center justify-center gap-1.5"><Shuffle size={16} /> Another</button>
            </div>
          </Card>
        )}

        {mode !== 'browse' ? (
          <TimePlans plans={plans} budget={budget} anchorLabel={anchor.label} loading={loading} />
        ) : (
          <div className="mt-3 space-y-2.5">
            {filtered.list.length === 0 && !loading && (
              <div className="text-center py-10 text-ink/60">
                <p>Nothing matches within {walk} minutes{openNow ? ' that we know is open' : ''}.</p>
                <button className="mt-3 h-11 px-4 rounded-full bg-white shadow-card text-navy font-semibold" onClick={() => { setWalk(20); setOpenNow(false); setTags([]); }}>Widen search</button>
              </div>
            )}
            {loading && filtered.list.length === 0 && <Spinner label="Finding places nearby…" />}
            {filtered.list.slice(0, 60).map(({ p }) => <PlaceRow key={p.id} place={p} origin={anchor} />)}
            {openNow && filtered.hiddenUnknown > 0 && (
              <SourceNote>{filtered.hiddenUnknown} place{filtered.hiddenUnknown > 1 ? 's' : ''} hidden because we don’t have reliable hours for them.</SourceNote>
            )}
            <SourceNote>
              Walking times are estimates from distance. {live?.source === 'osm' ? 'Ratings aren’t available from OpenStreetMap; enable Google Places (README) for ratings & photos.' : ''}
            </SourceNote>
          </div>
        )}
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <FilterGroup label="Max price">
          {[1, 2, 3, 4].map((n) => <Chip key={n} active={price === n} onClick={() => setPrice(price === n ? null : n)}>{'$'.repeat(n)}</Chip>)}
        </FilterGroup>
        <FilterGroup label={`Minimum rating${live?.source !== 'google' ? ' (needs Google Places)' : ''}`}>
          {[4, 4.5].map((r) => <Chip key={r} active={minRating === r} onClick={() => setMinRating(minRating === r ? null : r)}>★ {r}+</Chip>)}
        </FilterGroup>
        <FilterGroup label="Food type">
          {FOOD_TAGS.map((t) => <Chip key={t.id} active={tags.includes(t.id)} onClick={() => setTags(tags.includes(t.id) ? tags.filter((x) => x !== t.id) : [...tags, t.id])}>{t.label}</Chip>)}
        </FilterGroup>
        <FilterGroup label="Shopping">
          {SHOP_TAGS.map((t) => <Chip key={t.id} active={tags.includes(t.id)} onClick={() => setTags(tags.includes(t.id) ? tags.filter((x) => x !== t.id) : [...tags, t.id])}>{t.label}</Chip>)}
        </FilterGroup>
        <FilterGroup label="Other">
          <Chip active={localFav} onClick={() => setLocalFav(!localFav)}>Local favorites</Chip>
          <Chip active={freeOnly} onClick={() => setFreeOnly(!freeOnly)}>Free</Chip>
          <Chip active={inout === 'indoor'} onClick={() => setInout(inout === 'indoor' ? 'any' : 'indoor')}>Indoor</Chip>
          <Chip active={inout === 'outdoor'} onClick={() => setInout(inout === 'outdoor' ? 'any' : 'outdoor')}>Outdoor</Chip>
        </FilterGroup>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button className="h-12 rounded-2xl bg-white border border-navy/10 text-navy font-medium" onClick={() => { setPrice(null); setMinRating(null); setTags([]); setLocalFav(false); setFreeOnly(false); setInout('any'); }}>Clear all</button>
          <button className="h-12 rounded-2xl bg-navy text-white font-semibold" onClick={() => setFiltersOpen(false)}>Show {filtered.list.length} places</button>
        </div>
      </Sheet>
    </div>
  );
}

function SurpriseGo({ place }: { place: Place }) {
  const mapApp = useTrip((s) => s.mapApp);
  return (
    <a href={navUrl(mapApp, placeDest(place), 'walk')} target="_blank" rel="noreferrer" className="h-12 rounded-2xl bg-brick text-white font-semibold flex items-center justify-center gap-1.5">
      <Navigation size={16} /> Let’s go
    </a>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-sm font-semibold text-navy mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// ───── Time-budget plans ─────
interface Plan { title: string; emoji: string; stops: { p: Place; walk: number; visit: number; hoursOk: boolean | null }[]; total: number }

function buildPlans(all: Place[], anchor: { lat: number; lng: number }, budget: number, now: Date): Plan[] {
  const themes: { title: string; emoji: string; cats: string[][] }[] = [
    { title: 'Eat & wander', emoji: '🍽️', cats: [['food', 'bakery'], ['sight', 'photo', 'boutique', 'shopping']] },
    { title: 'Coffee, shops & a treat', emoji: '🛍️', cats: [['coffee'], ['boutique', 'shopping'], ['bakery']] },
    { title: 'History & photos', emoji: '📸', cats: [['sight'], ['photo', 'sight'], ['coffee', 'bakery']] },
    { title: 'Cocktail hour', emoji: '🍸', cats: [['drinks'], ['bakery', 'photo']] },
  ];
  const usable = all.filter((p) => !['lodging', 'transport', 'event'].includes(p.category) && !p.tags?.includes('paid'));
  const plans: Plan[] = [];
  for (const th of themes) {
    let pos = anchor;
    let t = 0;
    const stops: Plan['stops'] = [];
    const used = new Set<string>();
    for (const cats of th.cats) {
      const at = new Date(now.getTime() + t * 60000);
      const cand = usable
        .filter((p) => cats.includes(p.category) && !used.has(p.id))
        .map((p) => {
          const walk = walkMin(distanceM(pos, p));
          const visit = Math.min(visitOf(p), stops.length === 0 ? Math.round(budget * 0.6) : Math.round(budget * 0.4));
          const arrive = new Date(at.getTime() + walk * 60000);
          const h = openForWindow(p, arrive, visit);
          return { p, walk, visit, h };
        })
        .filter((c) => c.h.fits !== false && t + c.walk + c.visit <= budget && c.walk <= (budget === 60 ? 15 : 25))
        .sort((a, b) => (a.walk - (a.p.tags?.includes('local-favorite') ? 4 : 0) - (a.h.fits ? 3 : 0)) - (b.walk - (b.p.tags?.includes('local-favorite') ? 4 : 0) - (b.h.fits ? 3 : 0)));
      const pick = cand[0];
      if (!pick) continue;
      used.add(pick.p.id);
      stops.push({ p: pick.p, walk: pick.walk, visit: pick.visit, hoursOk: pick.h.fits });
      t += pick.walk + pick.visit;
      pos = pick.p;
    }
    if (stops.length) plans.push({ title: th.title, emoji: th.emoji, stops, total: t });
  }
  return plans;
}

function TimePlans({ plans, budget, anchorLabel, loading }: { plans: Plan[]; budget: number; anchorLabel: string; loading: boolean }) {
  const now = useNow();
  const add = useTrip((s) => s.addActivity);
  const toast = useUI((s) => s.showToast);
  const openPlace = useUI((s) => s.openPlace);
  const today = dayKey(now);
  if (loading && !plans.length) return <Spinner label="Building plans…" />;
  if (!plans.length) return <p className="text-center text-ink/60 py-10">Nothing we can vouch for fits in {budget / 60} hour{budget > 60 ? 's' : ''} near {anchorLabel}. Try another area.</p>;
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-ink/70">Realistic {budget / 60}-hour plans starting near <b>{anchorLabel}</b>, skipping anything known to be closed.</p>
      {plans.map((pl) => (
        <Card key={pl.title} className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-display text-xl text-navy">{pl.emoji} {pl.title}</div>
            <span className="text-xs text-ink/60">~{pl.total} min</span>
          </div>
          <ol className="mt-2 space-y-2">
            {pl.stops.map((s, i) => (
              <li key={s.p.id}>
                <button onClick={() => openPlace(s.p)} className="w-full flex items-center gap-3 text-left">
                  <span className="h-7 w-7 shrink-0 rounded-full bg-navy text-white text-xs font-bold grid place-items-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy truncate">{s.p.name}</div>
                    <div className="text-xs text-ink/60">{s.walk} min walk · ~{s.visit} min there{s.hoursOk === null ? ' · hours not verified' : ''}</div>
                  </div>
                </button>
              </li>
            ))}
          </ol>
          <button
            onClick={() => {
              let t = Math.ceil((toMin(hhmm(now)) + 5) / 5) * 5;
              for (const s of pl.stops) {
                t += s.walk;
                add({
                  day: today, start: fromMin(t), end: fromMin(t + s.visit), title: s.p.name, category: s.p.category,
                  placeId: s.p.source === 'curated' ? s.p.id : undefined,
                  placeSnapshot: s.p.source === 'curated' ? undefined : s.p,
                  description: s.p.why, tentative: true,
                });
                t += s.visit;
              }
              toast(`Added ${pl.stops.length} stops to today from ${fmt12(fromMin(Math.ceil((toMin(hhmm(now)) + 5) / 5) * 5))}`);
            }}
            className="mt-3 w-full h-12 rounded-2xl bg-navy text-white font-semibold flex items-center justify-center gap-1.5">
            <Plus size={18} /> Add to Today
          </button>
        </Card>
      ))}
      <SourceNote>Walking times are distance-based estimates. “Hours not verified” stops may be closed — check before you go.</SourceNote>
    </div>
  );
}
