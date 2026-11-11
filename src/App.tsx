import { Component, useEffect, type ReactNode } from 'react';
import { Home as HomeIcon, CalendarDays, Compass, Map as MapIcon, Bookmark, Eye, WifiOff } from 'lucide-react';
import { useUI, type Tab } from './store/ui';
import { useTrip } from './store/trip';
import { useLocation, useOnline, useWeather } from './lib/hooks';
import { decodePlan } from './lib/share';
import Home from './screens/Home';
import Itinerary from './screens/Itinerary';
import Explore from './screens/Explore';
import MapScreen from './screens/MapScreen';
import Saved from './screens/Saved';
import Essentials from './screens/Essentials';
import { PlaceSheet } from './components/PlaceBits';

const TABS: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'itinerary', label: 'Itinerary', Icon: CalendarDays },
  { id: 'explore', label: 'Explore', Icon: Compass },
  { id: 'map', label: 'Map', Icon: MapIcon },
  { id: 'saved', label: 'Saved', Icon: Bookmark },
];

class Boundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div className="p-6">
          <h1 className="font-display text-2xl text-navy">Something went wrong</h1>
          <p className="mt-2 text-sm">{this.state.err.message}</p>
          <button className="mt-4 h-12 px-5 rounded-2xl bg-navy text-white" onClick={() => this.setState({ err: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);
  const shared = useUI((s) => s.shared);
  const setShared = useUI((s) => s.setShared);
  const toast = useUI((s) => s.toast);
  const showToast = useUI((s) => s.showToast);
  const optIn = useTrip((s) => s.locationOptIn);
  const sim = useTrip((s) => s.sim);
  const setSim = useTrip((s) => s.setSim);
  const replace = useTrip((s) => s.replaceActivities);
  const startLoc = useLocation((s) => s.start);
  const loadWx = useWeather((s) => s.load);
  const online = useOnline();

  useEffect(() => {
    loadWx();
    const t = setInterval(loadWx, 30 * 60000);
    return () => clearInterval(t);
  }, [loadWx]);

  // Resume GPS if the user opted in before (no prompt unless they've allowed it).
  useEffect(() => {
    if (!optIn) return;
    const nav = navigator as Navigator & { permissions?: Permissions };
    if (nav.permissions?.query) {
      nav.permissions.query({ name: 'geolocation' as PermissionName }).then((p) => p.state === 'granted' && startLoc()).catch(() => undefined);
    }
  }, [optIn, startLoc]);

  // Shared read-only links: #plan=...
  useEffect(() => {
    const m = location.hash.match(/#plan=([^&]+)/);
    if (!m) return;
    decodePlan(m[1]).then((p) => {
      if (p) setShared(p);
      else showToast('That share link could not be read.');
    });
  }, [setShared, showToast]);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {shared && (
        <div className="relative z-[900] bg-gold text-navy px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-2 text-sm flex items-center gap-2">
          <Eye size={16} className="shrink-0" />
          <span className="flex-1">Read-only shared plan · snapshot from {new Date(shared.exportedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
          <button className="underline font-semibold" onClick={() => {
            if (confirm('Replace the itinerary on THIS device with the shared one? Your own edits here will be overwritten.')) {
              replace(shared.activities);
              setShared(null);
              history.replaceState(null, '', location.pathname);
              showToast('Shared plan copied to this device');
            }
          }}>Use it</button>
          <button className="underline" onClick={() => { setShared(null); history.replaceState(null, '', location.pathname); }}>Exit</button>
        </div>
      )}
      {sim && !shared && (
        <div className="relative z-[900] bg-harbor text-white px-4 pt-[calc(env(safe-area-inset-top)+6px)] pb-1.5 text-xs flex items-center gap-2">
          <span className="flex-1">Preview clock on — the app is pretending it’s {new Date(sim.target + (Date.now() - sim.setAt)).toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: '2-digit' })} ET.</span>
          <button className="underline font-semibold" onClick={() => setSim(null)}>Use real time</button>
        </div>
      )}
      {!online && (
        <div className="bg-ink text-white text-xs px-4 py-1.5 flex items-center gap-2"><WifiOff size={14} /> Offline — showing saved itinerary, addresses and cached data.</div>
      )}

      <main className={`flex-1 ${tab === 'map' ? '' : 'pb-[calc(env(safe-area-inset-bottom)+96px)]'}`}>
        <Boundary>
          {tab === 'home' && <Home />}
          {tab === 'itinerary' && <Itinerary />}
          {tab === 'explore' && <Explore />}
          {tab === 'map' && <MapScreen />}
          {tab === 'saved' && <Saved />}
        </Boundary>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-[800] bg-white/90 backdrop-blur-xl border-t border-navy/10 pb-[env(safe-area-inset-bottom)]" aria-label="Main">
        <div className="max-w-[560px] mx-auto grid grid-cols-5">
          {TABS.map(({ id, label, Icon }) => {
            const on = tab === id;
            return (
              <button key={id} onClick={() => { setTab(id); window.scrollTo({ top: 0 }); }} aria-current={on ? 'page' : undefined}
                className={`h-[68px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${on ? 'text-navy' : 'text-ink/45'}`}>
                <span className={`h-8 w-14 rounded-full grid place-items-center transition-colors ${on ? 'bg-navy/10' : ''}`}>
                  <Icon size={22} strokeWidth={on ? 2.4 : 1.8} />
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      <PlaceSheet />
      <Essentials />
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-[1100] bg-navy text-white text-sm px-4 py-2.5 rounded-full shadow-float animate-up" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
