import { useMemo, useState, type ReactNode } from 'react';
import {
  Navigation, Home as HomeIcon, Utensils, Coffee, ShoppingBag, Clock, Route, Compass, SkipForward, Briefcase,
  AlertTriangle, Info, Timer, LocateFixed, ChevronRight, Check,
} from 'lucide-react';
import { Card, Chip, Pill, SectionTitle, Sheet, SourceNote } from '../components/ui';
import { Photo } from '../components/Photo';
import { CAT } from '../components/meta';
import { PlaceRow } from '../components/PlaceBits';
import { useTrip, sortActivities } from '../store/trip';
import { useUI } from '../store/ui';
import { actEnd, actStart, activityPlace, currentAndNext, useLocation, useNow, usePlan, useWeather } from '../lib/hooks';
import { dayKey, fmt12, fmtClock, fmtDayLong, humanDuration, hhmm, toMin } from '../lib/time';
import { distanceM, fmtDist, navUrl, placeDest, suggestMode, walkMin } from '../lib/geo';
import { weatherLabel } from '../lib/weather';
import { buildAlerts } from '../lib/alerts';
import { useDriveEstimate } from '../lib/routing';
import { AIRBNB, PLACES, PLACE_BY_ID } from '../data/places';
import { DAYS, FLIGHTS, TRIP_NAME } from '../data/trip';
import { FlightCard } from './Essentials';
import { zoned } from '../lib/time';

const FIRST_FLIGHT = zoned('2026-11-13', '06:00', 'America/Chicago');
import { openStateAt } from '../lib/hours';
import type { Activity } from '../types';

export default function Home() {
  const now = useNow();
  const { activities, readOnly } = usePlan();
  const rental = useTrip((s) => s.rental);
  const mapApp = useTrip((s) => s.mapApp);
  const setStatus = useTrip((s) => s.setStatus);
  const loc = useLocation();
  const wx = useWeather();
  const { goExplore, goMap, setEssentials, openPlace, goItinerary, showToast } = useUI();
  const [late, setLate] = useState(false);

  const sorted = useMemo(() => sortActivities(activities), [activities]);
  const { current, next } = currentAndNext(sorted, now);
  const today = dayKey(now);
  const dayIdx = DAYS.findIndex((d) => d.key === today);
  const sundayDrive = useDriveEstimate(AIRBNB, PLACE_BY_ID['snhu-arena']);
  const alerts = buildAlerts(now, rental, wx.data, sundayDrive);

  const nextPlace = next ? activityPlace(next) : undefined;
  const curPlace = current ? activityPlace(current) : undefined;
  const origin = loc.coords ?? (curPlace ? { lat: curPlace.lat, lng: curPlace.lng } : null);
  const distNext = nextPlace && origin ? distanceM(origin, nextPlace) : null;
  const driveNext = useDriveEstimate(distNext && distNext > 2500 ? origin : null, distNext && distNext > 2500 ? nextPlace : null);

  const total = activities.filter((a) => a.status !== 'skipped').length;
  const done = activities.filter((a) => a.status === 'done').length;
  const nowMin = toMin(hhmm(now));
  const mealTime = (nowMin >= 11 * 60 && nowMin <= 14 * 60 + 30) || (nowMin >= 17 * 60 && nowMin <= 21 * 60 + 30);
  const anchor = loc.coords ?? (curPlace ? { lat: curPlace.lat, lng: curPlace.lng } : null);
  const hungry = useMemo(() => {
    if (!anchor) return [];
    return PLACES.filter((p) => p.category === 'food' && distanceM(anchor, p) < 1300 && openStateAt(p, now).state !== 'closed')
      .sort((a, b) => distanceM(anchor, a) - distanceM(anchor, b)).slice(0, 3);
  }, [anchor?.lat, anchor?.lng, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const wxNow = wx.data ? weatherLabel(wx.data.current.code) : null;
  const wet = !!wxNow?.wet || (wx.data?.daily.find((d) => d.date === today)?.pop ?? 0) >= 60;

  const status = dayIdx >= 0
    ? `Day ${dayIdx + 1} of 4 · ${DAYS[dayIdx].title}`
    : now < new Date('2026-11-13T00:00:00-05:00') ? 'Getting ready' : 'Trip complete — welcome home!';

  return (
    <div className="max-w-[560px] mx-auto">
      {/* Hero */}
      <div className="relative">
        <Photo wiki="Beacon_Hill,_Boston" category="sight" hero className="h-[300px] w-full" rounded="rounded-b-[36px]" />
        <div className="absolute inset-0 rounded-b-[36px] bg-gradient-to-b from-navy/70 via-navy/40 to-navy/85" />
        <div className="absolute inset-0 px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-6 flex flex-col text-white">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-semibold uppercase tracking-[.18em] text-white/80">{TRIP_NAME}</div>
            <button onClick={() => setEssentials(true)} className="h-11 px-4 rounded-full bg-white/15 backdrop-blur text-sm font-semibold flex items-center gap-1.5">
              <Briefcase size={16} /> Essentials
            </button>
          </div>
          <div className="mt-auto">
            <div className="text-white/80 text-sm">{fmtDayLong(now)} · {status}</div>
            <div className="font-display text-[52px] leading-none mt-1">{fmtClock(now)}</div>
            <div className="text-white/70 text-xs mt-1">Boston time (ET)</div>
            <div className="mt-3 flex items-center gap-3 text-sm">
              {wx.data && wxNow ? (
                <span className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                  <span aria-hidden>{wxNow.emoji}</span> {Math.round(wx.data.current.temp)}°F · {wxNow.label}
                  {!wx.live && <span className="text-white/60">(cached)</span>}
                </span>
              ) : wx.error ? (
                <span className="text-white/70">Weather unavailable</span>
              ) : (
                <span className="text-white/70">Loading weather…</span>
              )}
              <span className="flex items-center gap-1.5 text-white/80"><LocateFixed size={14} />{loc.status === 'granted' ? 'Location on' : 'Location off'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-5 relative">
        {/* Now / Next */}
        <Card className="p-4">
          {current && (
            <div className="mb-3 pb-3 border-b border-navy/10">
              <div className="text-xs font-semibold uppercase tracking-wide text-brick">Right now</div>
              <div className="font-semibold text-navy text-[17px] mt-0.5">{current.title}</div>
              <div className="text-sm text-ink/60">until {current.end ? fmt12(current.end) : 'whenever'}</div>
            </div>
          )}
          {now < FIRST_FLIGHT ? (
            <>
              <div className="text-xs font-semibold uppercase tracking-wide text-harbor">First flight · in {humanDuration(FIRST_FLIGHT.getTime() - now.getTime())}</div>
              <div className="mt-2"><FlightCard f={FLIGHTS[0]} compact /></div>
              <button onClick={() => goItinerary(DAYS[0].key)} className="mt-1 w-full h-12 rounded-2xl bg-sand text-navy font-medium text-sm flex items-center justify-center gap-1">See Friday’s plan <ChevronRight size={16} /></button>
            </>
          ) : next ? (
            <>
              <div className="flex items-start gap-3">
                <Photo place={nextPlace} category={next.category} className="h-20 w-20 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wide text-harbor">Next up · {fmt12(next.start)}{next.day !== today ? ` · ${DAYS.find((d) => d.key === next.day)?.short}` : ''}</div>
                  <div className="font-display text-[22px] leading-tight text-navy">{next.title}</div>
                  <div className="text-sm text-ink/70 mt-0.5 flex flex-wrap gap-x-2">
                    <span className="flex items-center gap-1"><Timer size={14} /> in {humanDuration(actStart(next).getTime() - now.getTime())}</span>
                    {distNext != null && (
                      <span>· {fmtDist(distNext)}{distNext < 2500 ? ` · ~${walkMin(distNext)} min walk` : driveNext ? ` · ~${driveNext.minutes} min drive` : ''}</span>
                    )}
                  </div>
                </div>
              </div>
              {nextPlace && (
                <a href={navUrl(mapApp, placeDest(nextPlace), distNext != null ? suggestMode(distNext) : 'walk')} target="_blank" rel="noreferrer"
                  className="mt-4 flex h-16 items-center justify-center gap-2 rounded-2xl bg-brick text-white text-[18px] font-semibold shadow-card">
                  <Navigation size={22} /> Navigate to Next Stop
                </a>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => goItinerary(next.day)} className="h-12 rounded-2xl bg-sand text-navy font-medium text-sm flex items-center justify-center gap-1">Details <ChevronRight size={16} /></button>
                {!readOnly && !next.locked ? (
                  <button onClick={() => { setStatus(next.id, 'skipped'); showToast(`Skipped “${next.title}”`); }} className="h-12 rounded-2xl bg-sand text-navy font-medium text-sm flex items-center justify-center gap-1.5">
                    <SkipForward size={16} /> Skip This Stop
                  </button>
                ) : current && !readOnly ? (
                  <button onClick={() => setStatus(current.id, 'done')} className="h-12 rounded-2xl bg-sand text-navy font-medium text-sm flex items-center justify-center gap-1.5"><Check size={16} /> Done here</button>
                ) : <span />}
              </div>
              {distNext != null && <SourceNote>Times are estimates from distance{driveNext ? ` (drive: ${driveNext.source === 'osrm' ? 'OSRM, no live traffic' : 'rough'})` : ''}. Your maps app shows live directions.</SourceNote>}
            </>
          ) : (
            <div className="text-navy">Nothing else scheduled. Explore something nearby!</div>
          )}
        </Card>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {alerts.map((a) => (
              <button key={a.id}
                onClick={() => {
                  if (a.action === 'essentials' || a.action === 'monday') setEssentials(true);
                  else if (a.action === 'sunday') goItinerary('2026-11-15');
                  else if (a.action === 'indoor') goExplore({ cat: 'all', mode: 'browse' });
                }}
                className={`w-full text-left rounded-3xl p-4 flex gap-3 ${a.level === 'urgent' ? 'bg-red-50 border border-red-200' : a.level === 'warn' ? 'bg-amber-50 border border-amber-200' : 'bg-white shadow-card'}`}>
                <div className={`h-9 w-9 shrink-0 rounded-full grid place-items-center ${a.level === 'urgent' ? 'bg-red-600 text-white' : a.level === 'warn' ? 'bg-amber-500 text-white' : 'bg-navy/10 text-navy'}`}>
                  {a.level === 'info' ? <Info size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-navy leading-snug">{a.title}</div>
                  <div className="text-sm text-ink/75 mt-0.5 leading-snug">{a.body}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <SectionTitle>What do we feel like?</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Quick icon={<Utensils />} label="Find Food Near Me" color="#b5452f" onClick={() => goExplore({ cat: 'food', mode: 'browse' })} />
          <Quick icon={<Coffee />} label="Find Coffee Near Me" color="#7a5230" onClick={() => goExplore({ cat: 'coffee', mode: 'browse' })} />
          <Quick icon={<ShoppingBag />} label="Find Shops Near Me" color="#2a6f6b" onClick={() => goExplore({ cat: 'shopping', mode: 'browse' })} />
          <Quick icon={<Clock />} label="What’s Open Now?" color="#1d4e89" onClick={() => goExplore({ cat: 'all', openNow: true, mode: 'browse' })} />
          <Quick icon={<Compass />} label="What’s Nearby?" color="#5a4fa3" onClick={() => goExplore({ cat: 'all', mode: 'browse' })} />
          <Quick icon={<Route />} label="Show Full Day Route" color="#14213d" onClick={() => goMap(dayIdx >= 0 ? today : DAYS[0].key, true)} />
        </div>
        <a href={navUrl(mapApp, placeDest(AIRBNB), loc.coords && distanceM(loc.coords, AIRBNB) < 1800 ? 'walk' : 'transit')} target="_blank" rel="noreferrer"
          className="mt-3 flex h-16 items-center gap-3 rounded-3xl bg-navy text-white px-5 shadow-card">
          <HomeIcon size={22} />
          <div className="flex-1">
            <div className="font-semibold">Take Me Home</div>
            <div className="text-xs text-white/70">485 Foley St, Somerville{loc.coords ? ` · ${fmtDist(distanceM(loc.coords, AIRBNB))}` : ''}</div>
          </div>
          <Navigation size={20} />
        </a>

        {!readOnly && dayIdx >= 0 && (
          <button onClick={() => setLate(true)} className="mt-3 w-full h-14 rounded-3xl bg-white shadow-card text-navy font-semibold flex items-center justify-center gap-2">
            <Timer size={18} /> Running late?
          </button>
        )}

        {/* Location prompt */}
        {loc.status !== 'granted' && (
          <Card className="p-4 mt-4">
            <div className="font-semibold text-navy">Use your location?</div>
            <p className="text-sm text-ink/70 mt-1">Lets us show distances, what’s near you, and the “Find Food Near Me” buttons. Location stays on your phone.</p>
            {loc.error && <p className="text-sm text-red-700 mt-2">{loc.error}</p>}
            <button onClick={loc.start} className="mt-3 h-12 px-5 rounded-2xl bg-navy text-white font-semibold">
              {loc.status === 'locating' ? 'Locating…' : 'Turn on location'}
            </button>
          </Card>
        )}

        {/* Hungry */}
        {mealTime && hungry.length > 0 && (
          <>
            <SectionTitle right={<button className="text-sm text-harbor font-semibold" onClick={() => goExplore({ cat: 'food', mode: 'browse' })}>See all</button>}>
              Hungry? Close by
            </SectionTitle>
            <div className="space-y-2">{hungry.map((p) => <PlaceRow key={p.id} place={p} origin={anchor} />)}</div>
          </>
        )}

        {/* Rain */}
        {wet && anchor && (
          <>
            <SectionTitle>Rainy-day ideas nearby</SectionTitle>
            <div className="space-y-2">
              {PLACES.filter((p) => p.indoor && distanceM(anchor, p) < 2000).sort((a, b) => distanceM(anchor, a) - distanceM(anchor, b)).slice(0, 4)
                .map((p) => <PlaceRow key={p.id} place={p} origin={anchor} />)}
            </div>
          </>
        )}

        {/* Progress */}
        <SectionTitle>Trip progress</SectionTitle>
        <Card className="p-4">
          <div className="flex justify-between text-sm text-ink/70"><span>{done} of {total} stops done</span><span>{Math.round((done / Math.max(1, total)) * 100)}%</span></div>
          <div className="h-3 rounded-full bg-sand mt-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-harbor to-navy rounded-full transition-all" style={{ width: `${(done / Math.max(1, total)) * 100}%` }} /></div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {DAYS.map((d, i) => {
              const acts = activities.filter((a) => a.day === d.key);
              const dd = acts.filter((a) => a.status === 'done').length;
              return (
                <button key={d.key} onClick={() => goItinerary(d.key)} className={`rounded-2xl p-2 text-center ${i === dayIdx ? 'bg-navy text-white' : 'bg-sand text-navy'}`}>
                  <div className="text-xs font-semibold">{d.short}</div>
                  <div className="text-[11px] opacity-75">{dd}/{acts.length}</div>
                </button>
              );
            })}
          </div>
        </Card>

        {current && curPlace && (
          <>
            <SectionTitle>Where we are</SectionTitle>
            <PlaceRow place={curPlace} origin={loc.coords} />
          </>
        )}

        <div className="h-4" />
        <button onClick={() => nextPlace && openPlace(nextPlace)} className="sr-only">Open next place</button>
      </div>

      <RunningLate open={late} onClose={() => setLate(false)} now={now} activities={sorted} />
    </div>
  );
}

function Quick({ icon, label, color, onClick }: { icon: ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="h-[88px] rounded-3xl bg-white shadow-card p-3.5 text-left flex flex-col justify-between active:scale-[.98] transition-transform">
      <span className="h-9 w-9 rounded-full grid place-items-center text-white [&>svg]:h-[18px] [&>svg]:w-[18px]" style={{ background: color }}>{icon}</span>
      <span className="font-semibold text-navy text-[15px] leading-tight">{label}</span>
    </button>
  );
}

function RunningLate({ open, onClose, now, activities }: { open: boolean; onClose: () => void; now: Date; activities: Activity[] }) {
  const [mins, setMins] = useState(30);
  const setStatus = useTrip((s) => s.setStatus);
  const update = useTrip((s) => s.updateActivity);
  const shift = useTrip((s) => s.shiftFlexible);
  const toast = useUI((s) => s.showToast);
  const today = dayKey(now);
  const remaining = activities.filter((a) => a.day === today && a.status === 'planned' && actEnd(a) > now);
  const firstLocked = remaining.find((a) => a.locked);
  const flexible = remaining.filter((a) => !a.locked && (!firstLocked || actStart(a) < actStart(firstLocked)));
  // Suggest the longest optional/tentative stops first.
  const candidates = [...flexible].sort((a, b) => {
    const score = (x: Activity) => (x.tentative ? 100 : 0) + (x.end ? toMin(x.end) - toMin(x.start) : 60);
    return score(b) - score(a);
  });

  return (
    <Sheet open={open} onClose={onClose} title="Running late">
      <p className="text-sm text-ink/70">How far behind are we? We’ll suggest what to shorten or skip. Nothing changes until you tap.</p>
      <div className="flex gap-2 mt-3">
        {[15, 30, 45, 60].map((m) => <Chip key={m} active={mins === m} onClick={() => setMins(m)}>{m} min</Chip>)}
      </div>
      {firstLocked && (
        <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-sm">
          <b>Fixed:</b> {firstLocked.title} at {fmt12(firstLocked.start)} — never moved automatically.
        </div>
      )}
      <div className="mt-4 space-y-2">
        {candidates.length === 0 && <p className="text-sm text-ink/60">No flexible stops left today.</p>}
        {candidates.map((a) => {
          const dur = a.end ? toMin(a.end) - toMin(a.start) : 60;
          const canShorten = dur - mins >= 15;
          return (
            <div key={a.id} className="bg-white rounded-2xl p-3 shadow-card">
              <div className="flex items-center gap-2">
                <span aria-hidden>{CAT[a.category].emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy truncate">{a.title}</div>
                  <div className="text-xs text-ink/60">{fmt12(a.start)}{a.end ? `–${fmt12(a.end)}` : ''} · {dur} min {a.tentative && <Pill>optional</Pill>}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button disabled={!canShorten} onClick={() => { update(a.id, { end: fromMinSafe(toMin(a.end ?? a.start) - mins) }); toast(`Shortened by ${mins} min`); }}
                  className="h-11 rounded-xl bg-sand text-navy text-sm font-medium disabled:opacity-40">Shorten {mins} min</button>
                <button onClick={() => { setStatus(a.id, 'skipped'); toast('Skipped — find it under “Skipped” in Itinerary'); }}
                  className="h-11 rounded-xl bg-sand text-navy text-sm font-medium">Skip</button>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => {
          const r = shift(today, hhmm(now), mins);
          toast(r.blocked.length ? `Shifted ${r.shifted}. ${r.blocked.length} would hit a fixed event — shorten or skip those.` : `Shifted ${r.shifted} stops by ${mins} min`);
          onClose();
        }}
        className="mt-4 w-full h-14 rounded-2xl bg-navy text-white font-semibold">
        Push remaining flexible stops back {mins} min
      </button>
      <SourceNote>Fixed events (graduation, flights) are never shifted.</SourceNote>
    </Sheet>
  );
}

function fromMinSafe(m: number) {
  const x = Math.max(0, m);
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
}
