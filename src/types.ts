export type Category =
  | 'food'
  | 'drinks'
  | 'coffee'
  | 'bakery'
  | 'shopping'
  | 'boutique'
  | 'sight'
  | 'photo'
  | 'fun'
  | 'lodging'
  | 'transport'
  | 'event';

export type PlaceSource = 'curated' | 'osm' | 'google' | 'custom';

export interface Place {
  id: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  address?: string;
  neighborhood?: string;
  /** Why it's worth visiting (curated, written by us — not a review). */
  why?: string;
  price?: 1 | 2 | 3 | 4;
  tags?: string[];
  cuisine?: string[];
  website?: string;
  menu?: string;
  reservation?: string;
  phone?: string;
  /** Wikipedia article title used to load a real photo at runtime. */
  wiki?: string;
  /** OSM-syntax opening hours. Only set when sourced (OSM, Google, or a cited listing). */
  openingHours?: string;
  hoursSource?: string;
  /** Free-text caveat shown with hours. */
  hoursNote?: string;
  /** Typical visit length, minutes. */
  visitMin?: number;
  indoor?: boolean;
  free?: boolean;
  source: PlaceSource;
  /** Where key facts were checked, or what still needs checking. */
  verify?: string;
  rating?: number;
  ratingCount?: number;
  photoUrl?: string;
  googleHours?: string[];
  googleMapsUrl?: string;
  openNow?: boolean;
  fetchedAt?: string;
}

export type ActivityStatus = 'planned' | 'done' | 'skipped';

export interface Activity {
  id: string;
  /** YYYY-MM-DD in Boston time. */
  day: string;
  /** HH:MM 24h, Boston time. */
  start: string;
  end?: string;
  title: string;
  category: Category;
  placeId?: string;
  /** Snapshot for places that aren't in the curated list (saved/live/custom). */
  placeSnapshot?: Place;
  /** Suggested alternatives — never bookings. */
  options?: string[];
  description?: string;
  notes?: string;
  status: ActivityStatus;
  /** Required events can't be moved, deleted or auto-shifted. */
  locked?: boolean;
  tentative?: boolean;
  price?: string;
  completedAt?: string;
  /** Sunday dinner: show the "open at arrival" picker. */
  dinnerPicker?: boolean;
}

export type SavedList = 'want' | 'restaurants' | 'drinks' | 'shopping' | 'attractions';

export interface SavedEntry {
  place: Place;
  lists: SavedList[];
  addedAt: string;
  visited?: boolean;
}

export interface Rental {
  status: 'not_confirmed' | 'confirmed';
  branch: string;
  pickupDay: string;
  pickupTime: string;
  returnPlan: 'not_confirmed' | 'neighborhood_sunday' | 'neighborhood_monday' | 'logan_monday' | 'other';
  returnDetails: string;
  price: string;
  notes: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  note: string;
}

export interface CheckItem {
  id: string;
  text: string;
  done: boolean;
}

export interface LatLng {
  lat: number;
  lng: number;
}
