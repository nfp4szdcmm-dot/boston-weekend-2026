import type { Place } from '../types';

/**
 * Curated places. Facts here are deliberately conservative:
 *  - Addresses are from official sites or well-established listings; anything uncertain says so in `verify`.
 *  - Coordinates are approximate (for map pins & distance estimates) — navigation uses the address.
 *  - We do NOT store invented hours or ratings. Live hours/ratings come from OpenStreetMap or Google Places at runtime.
 */
const DEFAULT_HOURS_NOTE = 'Hours not verified for Nov 2026 — tap “Live info” or check the website before going.';

type Seed = Omit<Place, 'source'> & { source?: Place['source'] };

const seeds: Seed[] = [
  // ───────── Home base & logistics ─────────
  {
    id: 'airbnb', name: 'Our Airbnb', category: 'lodging', lat: 42.3936, lng: -71.0789,
    address: '485 Foley St, Somerville, MA 02145', neighborhood: 'Assembly Row',
    why: 'Home base. Steps from Assembly Row shops and the Orange Line (Assembly station).',
    hoursNote: 'Check-in time and door instructions: see the Airbnb app (not stored here).',
  },
  {
    id: 'logan', name: 'Boston Logan Airport (BOS)', category: 'transport', lat: 42.3656, lng: -71.0096,
    address: 'Logan International Airport, East Boston, MA 02128', wiki: 'Logan_International_Airport',
    why: 'American Airlines has historically used Terminal B — confirm in the AA app on travel day.',
    website: 'https://www.massport.com/logan-airport',
  },
  {
    id: 'logan-rcc', name: 'Logan Rental Car Center', category: 'transport', lat: 42.3727, lng: -71.0326,
    address: '15 Transportation Way, East Boston, MA 02128',
    why: 'Consolidated airport rental center (shuttle from terminals). Airport counters usually keep longer hours than neighborhood branches — confirm with Enterprise.',
    verify: 'Address from rental aggregator listings; Enterprise hours here not verified.',
  },
  {
    id: 'enterprise-sullivan', name: 'Enterprise – Sullivan Square', category: 'transport', lat: 42.3849, lng: -71.0767,
    address: '37 Mystic Ave, Somerville, MA 02145', phone: '617-625-1766',
    website: 'https://www.enterprise.com/en/car-rental-locations/us/ma/somerville-sullivan-square-station-1005.html',
    openingHours: 'Mo-Fr 08:00-18:00; Sa 09:00-12:00; Su off',
    hoursSource: 'Enterprise location page (checked Nov 2026). Kayak lists weekdays 8–5.',
    hoursNote: 'Listed CLOSED Sunday. Call to confirm before planning a Sunday pickup.',
    why: 'Closest Enterprise branch we found to the Airbnb (~1 mile).',
  },
  {
    id: 'snhu-arena', name: 'SNHU Arena', category: 'event', lat: 42.9862, lng: -71.4632,
    address: '555 Elm St, Manchester, NH 03101', wiki: 'SNHU_Arena', website: 'https://www.snhuarena.com/venue-policies',
    why: 'SNHU Fall 2026 Commencement (SNHU lists Nov 14–15, 2026). Everyone at the arena by 2:00 PM.',
    hoursNote: 'Bag check at entry. Arena policy lists a 9"×12"×4" max bag size (clear tote allowed) — confirm for this event.',
  },

  // ───────── Assembly Row & Somerville ─────────
  {
    id: 'assembly-row', name: 'Assembly Row', category: 'shopping', lat: 42.3925, lng: -71.0777,
    address: 'Assembly Row, Somerville, MA 02145', neighborhood: 'Assembly Row', wiki: 'Assembly_Square',
    website: 'https://assemblyrow.com', visitMin: 120, tags: ['outlets'],
    why: 'Walkable outdoor district by the Mystic River: outlet stores, restaurants, a riverfront park, and the Orange Line.',
  },
  {
    id: 'parla-xxi', name: 'Parla XXI', category: 'food', lat: 42.3928, lng: -71.0782,
    address: 'Assembly Row, Somerville, MA 02145', neighborhood: 'Assembly Row', price: 3,
    tags: ['cocktails', 'fun', 'italian', 'date-night'], cuisine: ['Italian', 'Mediterranean'],
    why: 'Dim, speakeasy-style cocktail bar with Italian/Mediterranean plates. Listings encourage booking ahead.',
    verify: 'Exact street address not confirmed — search “Parla XXI Assembly Row” in Maps.',
  },
  {
    id: 'civility', name: 'Civility Social House', category: 'food', lat: 42.3939, lng: -71.0785,
    address: '490 Foley St, Somerville, MA 02145', neighborhood: 'Assembly Row', price: 2, phone: '617-675-6200',
    website: 'https://civilitysocialhouse.com', reservation: 'https://resy.com/cities/somerville-ma/venues/civility-social-house',
    tags: ['cocktails', 'american', 'fun', 'breakfast'], cuisine: ['American', 'Brunch'],
    why: 'Practically next door to the Airbnb. Social-house vibe, sliders, brunch and cocktails — easy celebratory pick.',
  },
  {
    id: 'tony-cs', name: 'Tony C’s Sports Bar & Grill', category: 'food', lat: 42.3930, lng: -71.0796,
    address: '450 Artisan Way, Somerville, MA 02145', neighborhood: 'Assembly Row', price: 2,
    tags: ['casual', 'american', 'fun', 'budget'], cuisine: ['American', 'Sports bar'],
    why: 'Big, casual sports bar named for Red Sox great Tony Conigliaro. Good if there’s a game on.',
    verify: 'Address from prior listings — confirm in Maps.',
  },
  {
    id: 'earls', name: 'Earls Kitchen + Bar', category: 'food', lat: 42.3922, lng: -71.0790,
    address: 'Assembly Row, Somerville, MA 02145', neighborhood: 'Assembly Row', price: 2,
    tags: ['cocktails', 'fun', 'american'], cuisine: ['American', 'Global'],
    why: 'Lively, polished-casual spot with a big cocktail list — a reliable group option.',
    verify: 'Confirm it is still operating at Assembly Row and its exact address.',
  },
  {
    id: 'bow-market', name: 'Bow Market', category: 'shopping', lat: 42.3812, lng: -71.0968,
    address: '1 Bow Market Way, Somerville, MA 02143', neighborhood: 'Union Square', visitMin: 60,
    tags: ['local-favorite', 'hidden-gem', 'boutique', 'budget'],
    why: 'Courtyard of tiny local shops, food stalls and a bar in a former storage building — very Somerville.',
  },
  {
    id: 'backbar', name: 'Backbar', category: 'drinks', lat: 42.3796, lng: -71.0940,
    address: '7 Sanborn Ct, Somerville, MA 02143', neighborhood: 'Union Square', price: 2,
    tags: ['cocktails', 'hidden-gem', 'local-favorite'],
    why: 'Tucked-away craft cocktail bar down an alley in Union Square — a local favorite.',
  },
  {
    id: 'lyndells', name: 'Lyndell’s Bakery', category: 'bakery', lat: 42.3995, lng: -71.1115,
    address: '720 Broadway, Somerville, MA 02144', neighborhood: 'Ball Square', price: 1,
    tags: ['local-favorite', 'dessert', 'budget'],
    why: 'Old-school neighborhood bakery known for half-moon cookies.',
  },

  // ───────── Common, Public Garden, Beacon Hill ─────────
  {
    id: 'tatte-charles', name: 'Tatte Bakery & Cafe – Charles St', category: 'coffee', lat: 42.3573, lng: -71.0703,
    address: '70 Charles St, Boston, MA 02114', neighborhood: 'Beacon Hill', price: 2, visitMin: 35,
    website: 'https://tattebakery.com', tags: ['breakfast', 'coffee', 'local-favorite'], cuisine: ['Bakery', 'Breakfast'],
    why: 'Beautiful bakery-café on Charles St — shakshuka, pastries, good coffee. Lines on weekends, moves quickly.',
  },
  {
    id: 'boston-common', name: 'Boston Common', category: 'sight', lat: 42.3551, lng: -71.0656,
    address: '139 Tremont St, Boston, MA 02111', neighborhood: 'Downtown', wiki: 'Boston_Common', visitMin: 30,
    free: true, indoor: false, tags: ['historic', 'photo-spot'],
    why: 'America’s oldest public park (1634) and the starting point of the Freedom Trail.',
  },
  {
    id: 'public-garden', name: 'Boston Public Garden', category: 'sight', lat: 42.3541, lng: -71.0703,
    address: '4 Charles St, Boston, MA 02116', neighborhood: 'Back Bay', wiki: 'Public_Garden_(Boston)', visitMin: 30,
    free: true, indoor: false, tags: ['photo-spot', 'historic'],
    why: 'Lagoon, footbridge and the “Make Way for Ducklings” statues. (Swan Boats are seasonal — not running in November.)',
  },
  {
    id: 'freedom-trail', name: 'Freedom Trail (start)', category: 'sight', lat: 42.3554, lng: -71.0637,
    address: '139 Tremont St, Boston, MA 02111', neighborhood: 'Downtown', wiki: 'Freedom_Trail',
    website: 'https://www.thefreedomtrail.org', free: true, indoor: false, visitMin: 90, tags: ['historic'],
    why: 'Follow the red-brick line 2.5 miles through 16 historic sites — our Saturday route naturally covers much of it.',
  },
  {
    id: 'acorn-st', name: 'Acorn Street', category: 'photo', lat: 42.3576, lng: -71.0705,
    address: 'Acorn St, Boston, MA 02108', neighborhood: 'Beacon Hill', wiki: 'Beacon_Hill,_Boston', visitMin: 15,
    free: true, indoor: false, tags: ['photo-spot', 'historic'],
    why: 'The famous cobblestone lane. Go early for photos; it’s a private street, so keep it quiet.',
  },
  {
    id: 'charles-st', name: 'Charles Street Boutiques', category: 'boutique', lat: 42.3584, lng: -71.0707,
    address: 'Charles St, Boston, MA 02114', neighborhood: 'Beacon Hill', wiki: 'Charles_Street_(Boston)', visitMin: 45,
    tags: ['boutique', 'local-favorite'], indoor: true,
    why: 'Gas-lamp street of antique shops, gift boutiques and cafés — Beacon Hill’s main street.',
  },
  {
    id: 'beacon-hill-books', name: 'Beacon Hill Books & Cafe', category: 'shopping', lat: 42.3578, lng: -71.0703,
    address: '71 Charles St, Boston, MA 02114', neighborhood: 'Beacon Hill', website: 'https://www.beaconhillbooks.com',
    visitMin: 30, indoor: true, tags: ['local-favorite', 'books', 'boutique'],
    why: 'Five floors of books in a 19th-century townhouse, with a café upstairs. Charming on a cold day.',
  },
  {
    id: 'black-ink', name: 'Black Ink', category: 'boutique', lat: 42.3588, lng: -71.0709,
    address: '101 Charles St, Boston, MA 02114', neighborhood: 'Beacon Hill', visitMin: 15, indoor: true,
    tags: ['boutique', 'gifts', 'hidden-gem'],
    why: 'Quirky gift and stationery shop — great for fun, small souvenirs.',
    verify: 'Confirm still open at this address.',
  },
  {
    id: 'brattle', name: 'Brattle Book Shop', category: 'shopping', lat: 42.3552, lng: -71.0623,
    address: '9 West St, Boston, MA 02111', neighborhood: 'Downtown Crossing', visitMin: 25,
    tags: ['hidden-gem', 'books', 'local-favorite'],
    why: 'One of America’s oldest antiquarian bookshops, with an outdoor lot of bargain books (weather permitting).',
  },

  // ───────── Back Bay / Newbury ─────────
  {
    id: 'newbury', name: 'Newbury Street', category: 'shopping', lat: 42.3505, lng: -71.0790,
    address: 'Newbury St, Boston, MA 02116', neighborhood: 'Back Bay', wiki: 'Newbury_Street', visitMin: 90,
    tags: ['boutique', 'photo-spot'], free: true,
    why: 'Eight blocks of brownstone shops — big brands near Arlington St, more indie and vintage toward Mass Ave.',
  },
  {
    id: 'trident', name: 'Trident Booksellers & Cafe', category: 'food', lat: 42.3486, lng: -71.0868,
    address: '338 Newbury St, Boston, MA 02115', neighborhood: 'Back Bay', price: 2, visitMin: 60,
    website: 'https://www.tridentbookscafe.com', tags: ['local-favorite', 'breakfast', 'casual', 'books'],
    cuisine: ['American', 'Breakfast'], indoor: true,
    why: 'Bookstore + café with all-day breakfast. A Newbury institution — perfect lunch-and-browse stop.',
  },
  {
    id: 'saltie-girl', name: 'Saltie Girl', category: 'food', lat: 42.3505, lng: -71.0773,
    address: '279 Dartmouth St, Boston, MA 02116', neighborhood: 'Back Bay', price: 4,
    tags: ['seafood', 'splurge'], cuisine: ['Seafood'],
    why: 'Tiny, buzzy seafood bar steps from Newbury — famous lobster roll and tinned fish. Splurge pick.',
  },
  {
    id: 'eataly', name: 'Eataly Boston', category: 'food', lat: 42.3478, lng: -71.0820,
    address: '800 Boylston St, Boston, MA 02199', neighborhood: 'Back Bay', price: 2, visitMin: 60, indoor: true,
    tags: ['italian', 'casual', 'pizza', 'fun'], cuisine: ['Italian', 'Market'],
    why: 'Italian food hall in the Prudential Center — pizza, pasta, a wine bar and an Italian grocery. Easy for a group to split up and regroup.',
  },
  {
    id: 'atlantic-fish', name: 'Atlantic Fish Co.', category: 'food', lat: 42.3489, lng: -71.0805,
    address: '761 Boylston St, Boston, MA 02116', neighborhood: 'Back Bay', price: 3,
    tags: ['seafood'], cuisine: ['Seafood'],
    why: 'Classic Boston seafood house with chowder and oysters, one block from Newbury.',
    verify: 'Confirm current hours before going.',
  },
  {
    id: 'lolita-backbay', name: 'Lolita Cocina & Tequila Bar', category: 'food', lat: 42.3502, lng: -71.0776,
    address: '271 Dartmouth St, Boston, MA 02116', neighborhood: 'Back Bay', price: 2,
    tags: ['cocktails', 'fun'], cuisine: ['Mexican'],
    why: 'Moody, candle-lit Mexican spot with big margaritas — fun group energy.',
    verify: 'Confirm lunch hours (may open late afternoon).',
  },
  {
    id: 'pavement', name: 'Pavement Coffeehouse', category: 'coffee', lat: 42.3489, lng: -71.0846,
    address: '286 Newbury St, Boston, MA 02115', neighborhood: 'Back Bay', price: 1, visitMin: 20,
    tags: ['coffee', 'local-favorite', 'budget'],
    why: 'Local mini-chain with bagels and good coffee — a quick Newbury pick-me-up.',
    verify: 'Confirm this location is still open.',
  },
  {
    id: 'bpl', name: 'Boston Public Library (Central)', category: 'sight', lat: 42.3493, lng: -71.0780,
    address: '700 Boylston St, Boston, MA 02116', neighborhood: 'Back Bay', wiki: 'Boston_Public_Library',
    website: 'https://www.bpl.org', free: true, indoor: true, visitMin: 30, tags: ['historic', 'photo-spot'],
    why: 'Free. Bates Hall reading room, murals and a peaceful Italianate courtyard. Great rainy-day stop.',
  },
  {
    id: 'bodega', name: 'Bodega', category: 'boutique', lat: 42.3466, lng: -71.0860,
    address: '6 Clearway St, Boston, MA 02115', neighborhood: 'Back Bay', visitMin: 15, indoor: true,
    tags: ['hidden-gem', 'fun', 'boutique'],
    why: 'Sneaker/streetwear shop hidden behind a fake corner-store front. Look for the vending machine door.',
  },
  {
    id: 'duck-tours', name: 'Boston Duck Tours (optional, paid)', category: 'fun', lat: 42.3471, lng: -71.0825,
    address: '800 Boylston St, Boston, MA 02199', neighborhood: 'Back Bay', wiki: 'Boston_Duck_Tours',
    website: 'https://www.bostonducktours.com', visitMin: 80, tags: ['paid', 'optional', 'fun'],
    why: 'Amphibious tour by land and Charles River. Not scheduled — book only if you want it.',
    verify: 'Seasonal schedule — confirm it’s running Nov 14 and which departure point.',
  },
  {
    id: 'view-boston', name: 'View Boston (optional, paid)', category: 'photo', lat: 42.3471, lng: -71.0822,
    address: '800 Boylston St, Boston, MA 02199', neighborhood: 'Back Bay', wiki: 'Prudential_Center_(Boston)',
    website: 'https://www.viewboston.com', visitMin: 60, indoor: true, tags: ['paid', 'optional', 'photo-spot'],
    why: '360° observatory at the top of the Prudential Tower, with a bar. Good sunset option.',
  },

  // ───────── Faneuil Hall / Downtown ─────────
  {
    id: 'faneuil', name: 'Faneuil Hall', category: 'sight', lat: 42.3600, lng: -71.0564,
    address: '1 Faneuil Hall Sq, Boston, MA 02109', neighborhood: 'Downtown', wiki: 'Faneuil_Hall', visitMin: 20,
    free: true, tags: ['historic'],
    why: 'Historic meeting hall (“Cradle of Liberty”) and Freedom Trail stop, with street performers outside.',
  },
  {
    id: 'quincy', name: 'Quincy Market', category: 'food', lat: 42.3599, lng: -71.0549,
    address: 'Faneuil Hall Marketplace, Boston, MA 02109', neighborhood: 'Downtown', wiki: 'Quincy_Market', visitMin: 45,
    price: 1, tags: ['casual', 'budget', 'seafood'], indoor: true,
    why: 'Classic food hall — chowder in a bread bowl. Touristy; locals prefer Boston Public Market next door.',
  },
  {
    id: 'bpm', name: 'Boston Public Market', category: 'food', lat: 42.3620, lng: -71.0573,
    address: '100 Hanover St, Boston, MA 02108', neighborhood: 'Downtown', website: 'https://bostonpublicmarket.org',
    price: 1, visitMin: 40, indoor: true, tags: ['local-favorite', 'budget', 'casual', 'shopping'],
    why: 'Indoor market of New England-only vendors — cider donuts, local cheese, gifts. Great for lunch and souvenirs.',
  },
  {
    id: 'union-oyster', name: 'Union Oyster House', category: 'food', lat: 42.3613, lng: -71.0570,
    address: '41 Union St, Boston, MA 02108', neighborhood: 'Downtown', wiki: 'Union_Oyster_House',
    website: 'https://unionoysterhouse.com', price: 3, tags: ['seafood', 'historic'], cuisine: ['Seafood'],
    why: 'Operating since 1826 — sit at the raw bar for oysters and history.',
  },
  {
    id: 'bell-in-hand', name: 'Bell in Hand Tavern', category: 'drinks', lat: 42.3616, lng: -71.0568,
    address: '45 Union St, Boston, MA 02108', neighborhood: 'Downtown', wiki: 'Bell_in_Hand_Tavern', price: 2,
    tags: ['fun', 'historic', 'casual'],
    why: 'Claims to be America’s oldest tavern (1795). Lively, casual, fun for a round.',
  },
  {
    id: 'yvonnes', name: 'Yvonne’s', category: 'food', lat: 42.3557, lng: -71.0617,
    address: '2 Winter Pl, Boston, MA 02108', neighborhood: 'Downtown Crossing', price: 3,
    tags: ['cocktails', 'fun', 'splurge'], cuisine: ['American', 'Shared plates'],
    why: 'Modern supper club behind a hidden entrance — big cocktails, shareable plates, celebratory energy.',
  },
  {
    id: 'mariel', name: 'Mariel', category: 'food', lat: 42.3562, lng: -71.0560,
    address: '10 Post Office Sq, Boston, MA 02109', neighborhood: 'Financial District', price: 3,
    tags: ['cocktails', 'fun'], cuisine: ['Cuban', 'Latin'],
    why: 'Glamorous Cuban-inspired restaurant from the Yvonne’s team — lively and great for groups.',
    verify: 'Confirm Sunday hours.',
  },
  {
    id: 'george-howell', name: 'George Howell Coffee', category: 'coffee', lat: 42.3551, lng: -71.0616,
    address: '505 Washington St, Boston, MA 02111', neighborhood: 'Downtown Crossing', price: 2,
    tags: ['coffee', 'local-favorite'],
    why: 'One of the city’s most respected specialty roasters.',
  },

  // ───────── North End ─────────
  {
    id: 'north-end', name: 'North End & Hanover Street', category: 'sight', lat: 42.3635, lng: -71.0545,
    address: 'Hanover St, Boston, MA 02113', neighborhood: 'North End', wiki: 'North_End,_Boston', visitMin: 90,
    free: true, tags: ['historic', 'photo-spot', 'italian'],
    why: 'Boston’s Little Italy: narrow streets, cafés, bakeries and Freedom Trail sites.',
  },
  {
    id: 'paul-revere', name: 'Paul Revere House', category: 'sight', lat: 42.3637, lng: -71.0537,
    address: '19 North Square, Boston, MA 02113', neighborhood: 'North End', wiki: 'Paul_Revere_House',
    website: 'https://www.paulreverehouse.org', visitMin: 25, indoor: true, tags: ['historic', 'paid'],
    why: 'Downtown Boston’s oldest house (c. 1680). Small admission fee; quick self-guided visit.',
  },
  {
    id: 'old-north', name: 'Old North Church', category: 'sight', lat: 42.3663, lng: -71.0544,
    address: '193 Salem St, Boston, MA 02113', neighborhood: 'North End', wiki: 'Old_North_Church',
    website: 'https://www.oldnorth.com', visitMin: 25, tags: ['historic', 'photo-spot'],
    why: '“One if by land, two if by sea.” The steeple is worth the short walk up Salem St.',
  },
  {
    id: 'modern-pastry', name: 'Modern Pastry', category: 'bakery', lat: 42.3633, lng: -71.0546,
    address: '257 Hanover St, Boston, MA 02113', neighborhood: 'North End', website: 'https://modernpastry.com',
    price: 1, visitMin: 15, tags: ['dessert', 'local-favorite', 'budget'],
    why: 'Locals’ pick in the cannoli debate — filled to order.',
  },
  {
    id: 'mikes', name: 'Mike’s Pastry', category: 'bakery', lat: 42.3643, lng: -71.0543,
    address: '300 Hanover St, Boston, MA 02113', neighborhood: 'North End',
    website: 'https://www.mikespastry.com', price: 1, visitMin: 15, tags: ['dessert', 'budget'],
    why: 'The famous white box. Huge selection; the line moves faster than it looks.',
  },
  {
    id: 'bovas', name: 'Bova’s Bakery', category: 'bakery', lat: 42.3653, lng: -71.0556,
    address: '134 Salem St, Boston, MA 02113', neighborhood: 'North End', price: 1, visitMin: 10,
    tags: ['dessert', 'local-favorite', 'hidden-gem', 'budget'],
    why: 'Family bakery known as the late-night cannoli stop — fewer crowds than Hanover St.',
    hoursNote: 'Known locally for very late hours — verify before relying on it.',
  },
  {
    id: 'galleria-umberto', name: 'Galleria Umberto', category: 'food', lat: 42.3637, lng: -71.0543,
    address: '289 Hanover St, Boston, MA 02113', neighborhood: 'North End', price: 1, visitMin: 25,
    tags: ['pizza', 'italian', 'budget', 'local-favorite', 'cash-only'], cuisine: ['Pizza', 'Italian'],
    why: 'Sicilian square slices and arancini, lunch only. Historically cash-only and closes when sold out — go early.',
  },
  {
    id: 'regina', name: 'Pizzeria Regina (original)', category: 'food', lat: 42.3654, lng: -71.0568,
    address: '11 1/2 Thacher St, Boston, MA 02113', neighborhood: 'North End', website: 'https://www.pizzeriaregina.com',
    price: 1, tags: ['pizza', 'casual', 'budget', 'local-favorite'], cuisine: ['Pizza'],
    why: 'Brick-oven pizza since 1926 — the original location is the one to visit.',
  },
  {
    id: 'neptune', name: 'Neptune Oyster', category: 'food', lat: 42.3633, lng: -71.0560,
    address: '63 Salem St, Boston, MA 02113', neighborhood: 'North End', website: 'https://www.neptuneoyster.com',
    price: 3, tags: ['seafood', 'splurge', 'local-favorite'], cuisine: ['Seafood'],
    why: 'Tiny oyster bar with a legendary hot buttered lobster roll. Expect a wait; historically no reservations.',
  },
  {
    id: 'giacomos', name: 'Giacomo’s', category: 'food', lat: 42.3648, lng: -71.0538,
    address: '355 Hanover St, Boston, MA 02113', neighborhood: 'North End', price: 2,
    tags: ['italian', 'fun', 'cash-only'], cuisine: ['Italian'],
    why: 'Cozy, loud, red-sauce favorite. Historically no reservations and cash only — line up early.',
  },
  {
    id: 'carmelinas', name: 'Carmelina’s', category: 'food', lat: 42.3640, lng: -71.0543,
    address: '307 Hanover St, Boston, MA 02113', neighborhood: 'North End', price: 2,
    tags: ['italian', 'fun'], cuisine: ['Italian'],
    why: 'Sicilian-leaning Italian with an open kitchen and big windows onto Hanover St.',
  },
  {
    id: 'fiore', name: 'Ristorante Fiore', category: 'food', lat: 42.3628, lng: -71.0549,
    address: '250 Hanover St, Boston, MA 02113', neighborhood: 'North End', price: 2,
    tags: ['italian', 'cocktails'], cuisine: ['Italian'],
    why: 'Classic Italian with a (seasonal) rooftop deck — good for groups.',
  },
  {
    id: 'caffe-vittoria', name: 'Caffè Vittoria', category: 'coffee', lat: 42.3640, lng: -71.0545,
    address: '290 Hanover St, Boston, MA 02113', neighborhood: 'North End', price: 1, visitMin: 30,
    tags: ['coffee', 'dessert', 'historic', 'local-favorite'],
    why: 'Old-world café — espresso, cappuccino, gelato and after-dinner drinks. Historically cash only.',
  },
  {
    id: 'polcaris', name: 'Polcari’s Coffee', category: 'shopping', lat: 42.3638, lng: -71.0560,
    address: '105 Salem St, Boston, MA 02113', neighborhood: 'North End', visitMin: 10, indoor: true,
    tags: ['hidden-gem', 'gifts', 'local-favorite'],
    why: 'Old-school grocer since 1932 — spices, coffee, candy and Italian staples. Fun souvenir stop.',
  },
  {
    id: 'salumeria', name: 'Salumeria Italiana', category: 'shopping', lat: 42.3628, lng: -71.0541,
    address: '151 Richmond St, Boston, MA 02109', neighborhood: 'North End', visitMin: 10, indoor: true,
    tags: ['hidden-gem', 'gifts', 'local-favorite'],
    why: 'Tiny Italian specialty shop — olive oil, balsamic, cured meats to take home.',
  },

  // ───────── Waterfront & Seaport ─────────
  {
    id: 'harborwalk', name: 'Boston Harborwalk – Long Wharf', category: 'photo', lat: 42.3607, lng: -71.0508,
    address: 'Long Wharf, Boston, MA 02110', neighborhood: 'Waterfront', wiki: 'Boston_Harborwalk', visitMin: 30,
    free: true, indoor: false, tags: ['photo-spot', 'free'],
    why: 'Harbor views by Christopher Columbus Park and Long Wharf — a short walk from the North End.',
  },
  {
    id: 'snowport', name: 'Snowport Holiday Market', category: 'shopping', lat: 42.3515, lng: -71.0450,
    address: '100 Seaport Blvd, Boston, MA 02210', neighborhood: 'Seaport', visitMin: 90,
    free: true, tags: ['local-favorite', 'fun', 'gifts', 'boutique'],
    openingHours: 'Mo-Th 15:00-20:00; Fr 11:00-21:00; Sa 10:00-21:00; Su 11:00-20:00',
    hoursSource: 'Boston 25 News & Boston.com 2026 listings (Nov 6 – Dec 27, 2026)',
    hoursNote: 'Sources disagree on Sunday opening (10 vs 11 AM). Free general admission; optional timed entry via the Seaport Insider app.',
    why: 'Seaport’s holiday village of small-business vendors, food and drinks. Open Nov 6 – Dec 27, 2026.',
  },
  {
    id: 'seaport', name: 'Seaport District', category: 'sight', lat: 42.3505, lng: -71.0445,
    address: 'Seaport Blvd, Boston, MA 02210', neighborhood: 'Seaport', wiki: 'Seaport_District', visitMin: 45,
    free: true, tags: ['photo-spot'],
    why: 'Modern waterfront neighborhood — skyline views from Fan Pier, restaurants and the ICA.',
  },
  {
    id: 'tea-party', name: 'Boston Tea Party Ships & Museum (optional, paid)', category: 'fun', lat: 42.3522, lng: -71.0513,
    address: '306 Congress St, Boston, MA 02210', neighborhood: 'Fort Point', wiki: 'Boston_Tea_Party_Ships_%26_Museum',
    visitMin: 75, indoor: true, tags: ['paid', 'optional', 'historic', 'fun'],
    why: 'Interactive, theatrical museum — you get to throw tea overboard. Not scheduled.',
  },
  {
    id: 'legal-harborside', name: 'Legal Harborside', category: 'food', lat: 42.3496, lng: -71.0400,
    address: '270 Northern Ave, Boston, MA 02210', neighborhood: 'Seaport', website: 'https://www.legalseafoods.com',
    price: 3, tags: ['seafood', 'cocktails'], cuisine: ['Seafood'],
    why: 'Three-level Legal Sea Foods on the harbor — classic Boston seafood with water views.',
  },
  {
    id: 'bartaco', name: 'bartaco Seaport', category: 'food', lat: 42.3505, lng: -71.0508,
    address: '25 Thomson Pl, Boston, MA 02210', neighborhood: 'Fort Point', website: 'https://bartaco.com',
    price: 2, tags: ['fun', 'casual', 'cocktails', 'budget'], cuisine: ['Tacos', 'Latin'],
    why: 'Breezy taco-and-margarita spot, fun for groups and easy on the wallet.',
  },
  {
    id: 'drink', name: 'Drink', category: 'drinks', lat: 42.3508, lng: -71.0480,
    address: '348 Congress St, Boston, MA 02210', neighborhood: 'Fort Point', price: 3,
    tags: ['cocktails', 'local-favorite'],
    why: 'No menu — tell the bartender what you like. One of Boston’s most celebrated cocktail bars.',
  },

  // ───────── South End ─────────
  {
    id: 'barcelona', name: 'Barcelona Wine Bar – South End', category: 'food', lat: 42.3446, lng: -71.0698,
    address: '525 Tremont St, Boston, MA 02116', neighborhood: 'South End', website: 'https://barcelonawinebar.com',
    price: 2, tags: ['fun', 'cocktails'], cuisine: ['Spanish', 'Tapas'],
    why: 'Lively tapas and wine bar — great for sharing plates as a group.',
  },
];

export const PLACES: Place[] = seeds.map((s) => ({
  source: 'curated',
  hoursNote: s.openingHours ? s.hoursNote : s.hoursNote ?? DEFAULT_HOURS_NOTE,
  ...s,
}));

export const PLACE_BY_ID: Record<string, Place> = Object.fromEntries(PLACES.map((p) => [p.id, p]));

export const AIRBNB = PLACE_BY_ID['airbnb'];

/** Quick anchors for Explore when GPS is off. */
export const NEIGHBORHOODS: { id: string; label: string; lat: number; lng: number }[] = [
  { id: 'assembly', label: 'Assembly Row', lat: 42.3925, lng: -71.0777 },
  { id: 'beacon', label: 'Beacon Hill', lat: 42.3580, lng: -71.0700 },
  { id: 'newbury', label: 'Newbury St', lat: 42.3500, lng: -71.0805 },
  { id: 'downtown', label: 'Faneuil Hall', lat: 42.3600, lng: -71.0560 },
  { id: 'northend', label: 'North End', lat: 42.3640, lng: -71.0545 },
  { id: 'seaport', label: 'Seaport', lat: 42.3512, lng: -71.0460 },
  { id: 'union', label: 'Union Sq, Somerville', lat: 42.3800, lng: -71.0950 },
];

/** Sunday dinner shortlist, grouped by area. */
export const SUNDAY_DINNER: { area: string; ids: string[] }[] = [
  { area: 'Assembly Row (closest to home)', ids: ['civility', 'tony-cs', 'earls', 'parla-xxi'] },
  { area: 'North End', ids: ['carmelinas', 'fiore', 'giacomos', 'regina', 'neptune'] },
  { area: 'Downtown', ids: ['yvonnes', 'mariel', 'union-oyster', 'bell-in-hand'] },
];
