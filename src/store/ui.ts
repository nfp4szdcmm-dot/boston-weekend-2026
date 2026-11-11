import { create } from 'zustand';
import type { Place } from '../types';
import type { SharedPlan } from '../lib/share';

export type Tab = 'home' | 'itinerary' | 'explore' | 'map' | 'saved';
export type ExploreCat = 'all' | 'food' | 'drinks' | 'coffee' | 'bakery' | 'boutique' | 'shopping' | 'sight' | 'photo' | 'fun' | 'hidden';

export interface ExplorePreset {
  cat?: ExploreCat;
  openNow?: boolean;
  mode?: 'browse' | '1h' | '2h' | 'surprise';
  nonce: number;
}

interface UIState {
  tab: Tab;
  setTab: (t: Tab) => void;
  sheetPlace: Place | null;
  openPlace: (p: Place | null) => void;
  essentialsOpen: boolean;
  setEssentials: (v: boolean) => void;
  explorePreset: ExplorePreset | null;
  goExplore: (p: Omit<ExplorePreset, 'nonce'>) => void;
  mapDay: string | 'all';
  mapRoute: boolean;
  goMap: (day: string | 'all', route?: boolean) => void;
  itineraryDay: string | null;
  goItinerary: (day: string) => void;
  shared: SharedPlan | null;
  setShared: (p: SharedPlan | null) => void;
  toast: string | null;
  showToast: (t: string) => void;
}

export const useUI = create<UIState>()((set) => ({
  tab: 'home',
  setTab: (tab) => set({ tab }),
  sheetPlace: null,
  openPlace: (sheetPlace) => set({ sheetPlace }),
  essentialsOpen: false,
  setEssentials: (essentialsOpen) => set({ essentialsOpen }),
  explorePreset: null,
  goExplore: (p) => set({ tab: 'explore', explorePreset: { ...p, nonce: Date.now() }, sheetPlace: null }),
  mapDay: 'all',
  mapRoute: false,
  goMap: (mapDay, route = false) => set({ tab: 'map', mapDay, mapRoute: route, sheetPlace: null }),
  itineraryDay: null,
  goItinerary: (day) => set({ tab: 'itinerary', itineraryDay: day }),
  shared: null,
  setShared: (shared) => set({ shared }),
  toast: null,
  showToast: (toast) => {
    set({ toast });
    setTimeout(() => set((s) => (s.toast === toast ? { toast: null } : s)), 2600);
  },
}));
