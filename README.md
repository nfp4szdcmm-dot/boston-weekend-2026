# Boston Weekend 2026 — Travel Companion

A mobile-first PWA for our Boston trip (Nov 13–16, 2026). It's built with React, TypeScript, Tailwind, Leaflet and Vite.

## What's inside

| Tab | What it does |
|---|---|
| **Home** | Boston time and weather, what's happening now and next, a countdown, a big **Navigate to Next Stop** button, quick buttons (*Find Food / Coffee / Shops Near Me*, *What's Open Now?*, *What's Nearby?*, *Show Full Day Route*, *Take Me Home*), time-sensitive alerts (Sunday leave-by time, rental car, Monday flight), a "Running late?" helper, rainy-day ideas and trip progress |
| **Itinerary** | All four days preloaded. Each day expands into cards you can mark done, skip, edit, delete or move earlier/later by ±15 min. You can also move a stop to another day, add stops (from our places or any address), apply a suggested route order, and keep trip history. **Required events (graduation, flights) are locked.** The Sunday dinner picker shows which places are open at your arrival time. |
| **Explore** | GPS or neighborhood-based nearby search with category chips and filters: walk time, open now, price, rating, food type, shopping type, local favorites, indoor/outdoor and free. Also has **Surprise Me**, **We Have 1 Hour** and **We Have 2 Hours**. |
| **Map** | Leaflet map with color-coded pins, a day selector, layer toggles, your current location, and full-day routes handed off to Google Maps |
| **Saved** | Want to Visit, Restaurants, Drinks, Shopping, Attractions and Completed. Any saved place can be added straight to the itinerary. |
| **Essentials** (button on Home) | Airbnb, flights (with time zones and layovers), an editable rental-car section with return warnings, SNHU Arena, weather, checklists, emergency contacts, links, settings and a preview clock |

## Where the data comes from

| Data | Source | Notes |
|---|---|---|
| Curated places | Hand-researched in Nov 2026 | Hours are shown only where a source listed them (Snowport, Enterprise). Uncertain addresses are flagged. |
| Live nearby places | **OpenStreetMap** (Overpass API) | Free and needs no key. Has hours where mappers added them; no ratings. |
| Ratings, photos, live hours | **Google Places (optional)** | Goes through a server-side proxy in `/api`, so the key never reaches the browser |
| Weather | Open-Meteo | Free, no key |
| Drive estimates | OSRM public router | No live traffic, and it's labeled that way in the app |
| Walking times | Estimated from distance | Not a routed ETA. Tapping Navigate opens Apple or Google Maps, which give real directions, transit times and traffic. |
| Photos | Wikipedia / Wikimedia Commons | Loaded at runtime and cached offline |

Every live, cached or estimated value is labeled in the UI. Nothing is a reservation.

## Sharing with the group

- **Share link (read-only):** Itinerary → Share. It makes a compressed snapshot link (itinerary + saved places, never contacts or rental details). Anyone who opens it sees a gold "Read-only shared plan" banner and can tap **Use it** to copy the plan onto their own phone.
- **Edits are stored per device** (localStorage) and **do not sync automatically**. After changing plans, send a fresh link.
- If you want true collaborative editing later, the natural next step is a small database (Supabase, Firebase or Vercel KV) replacing `replaceActivities` and the persist storage in `src/store/trip.ts`.

## Run locally

Requires Node 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run typecheck  # optional strict type check
```

### Preview without installing Node

`tools/nobuild-preview.html` loads the app straight from `src/` and compiles it in the browser (Babel plus CDN packages). It's handy for a quick look and isn't used in production:

```bash
python3 -m http.server 5173   # then open http://localhost:5173/tools/nobuild-preview.html
```

## Deploy to a public URL (GitHub Pages, no extra accounts)

1. Create a **public** GitHub repository and upload everything in this folder.
2. Make sure `.github/workflows/deploy.yml` is in the repo. If your upload skipped it (Finder hides dot-folders), use **Add file → Create new file**, name it `.github/workflows/deploy.yml`, and paste in its contents.
3. Go to repo **Settings → Pages**, and under **Build and deployment → Source** choose **GitHub Actions**.
4. Open the **Actions** tab and wait for the green check (re-run the workflow if it ran before step 3).
5. The app is live at `https://<your-username>.github.io/<repo-name>/`.

The optional Google Places proxy in `/api` only runs on Vercel. On GitHub Pages the app uses OpenStreetMap automatically.

## Deploy to a public URL (Vercel alternative)

1. Push this folder to a new GitHub repository:
   ```bash
   git init && git add . && git commit -m "Boston Weekend 2026"
   gh repo create boston-weekend-2026 --private --source=. --push
   ```
2. Go to <https://vercel.com/new>, import the repo, and keep the defaults (Framework: Vite). Click **Deploy**.
3. You'll get a URL like `https://boston-weekend-2026.vercel.app`. Send it to everyone.
4. **Optional: Google Places** (ratings, photos, better hours)
   1. In Google Cloud Console, create a project, enable **Places API (New)**, and create an API key.
   2. Restrict the key to *Places API (New)* and set a daily quota cap (for example 1,000 requests/day) under *APIs & Services → Quotas*.
   3. In Vercel go to Project → Settings → Environment Variables and add `GOOGLE_PLACES_API_KEY`. **Don't** prefix it with `VITE_`.
   4. Redeploy. Explore will then show "Live: Google Places".
   The proxy only answers for coordinates in the Boston–Manchester area. That limits abuse but doesn't eliminate it, so keep the quota cap.

### Netlify alternative

Drag-and-drop the `dist/` folder at <https://app.netlify.com/drop>, or connect the repo (settings come from `netlify.toml`). The `/api` proxy is Vercel-specific, so on Netlify the app automatically uses OpenStreetMap.

## Install on iPhone

Open the URL in **Safari**, tap Share, then **Add to Home Screen**. It opens full-screen, and the itinerary, addresses, checklists and previously viewed map tiles and photos work offline.

## Things still marked "not confirmed" (by design)

- Airbnb check-in time (see the Airbnb app)
- Rental car branch, pickup time, price and **return plan**. The Sullivan Sq Enterprise lists **no Sunday hours**, and neighborhood branches open after the 7 AM Monday flight.
- Parla XXI and Earls exact street addresses
- Exact graduation guest logistics and parking for Fall 2026
- Restaurant hours for most places (check live info or websites)

## Project layout

```
api/                 optional Vercel functions (Google Places proxy)
src/data/            trip, flights, itinerary seed, curated places
src/lib/             time zones, geo, hours parsing, weather, live places, routing, sharing, alerts
src/store/           zustand stores (persisted trip state, UI state)
src/components/      shared UI, place sheet, nav buttons, photos
src/screens/         Home, Itinerary, Explore, Map, Saved, Essentials
```
