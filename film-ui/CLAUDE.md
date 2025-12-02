# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React 19 dashboard for browsing a personal film watchlist with streaming availability data, plus support for curated film collections (like Criterion Collection). Part of the larger film-planner system - this UI consumes data from `../check_availability.py` and collection enrichment scripts, deploying to GitHub Pages.

## Tech Stack

- **React 19** - Latest React with StrictMode
- **Vite 7** - Build tool with HMR
- **Sass/SCSS** - Styling with CSS Modules
- **PropTypes** - Runtime type checking (no TypeScript)
- **ESLint 9** - Linting with flat config format
- **gh-pages** - GitHub Pages deployment

## Common Commands

```bash
# Development
npm install              # Install dependencies
npm run dev             # Start dev server at http://localhost:5173
npm run build           # Build for production
npm run preview         # Preview production build locally

# Quality & Deployment
npm run lint            # Run ESLint
npm run deploy          # Build and deploy to GitHub Pages (gh-pages branch)
```

## Architecture

### Data Flow

**Personal Watchlist:**
```
src/data/films.json (auto-updated by GitHub Actions weekly)
    ↓
App.jsx (loads on mount)
```

**Collections (loaded on-demand):**
```
src/data/collections/criterion.json (manually enriched)
    ↓
App.jsx (lazy loads when user toggles collection)
    ↓
Merged with personal films in allFilms
```

**Presentation:**
```
App.jsx (merges films + collections)
    ↓
FilterBar (search, filters, collection toggles)
    ↓
FilmGrid (responsive grid)
    ↓
FilmCard (individual films with collection badges)
    ↓
TrailerModal (detail view)
```

### State Management

All state lives in `App.jsx` - no external state library:

- **films** - Array of film objects loaded from `films.json` (personal watchlist)
- **selectedCollections** - Array of collection IDs to display (e.g., ['personal', 'criterion'])
- **collectionData** - Object mapping collection IDs to their film data
- **collectionsLoading** - Boolean indicating if collections are being loaded
- **selectedCountry** - Current country for streaming availability (persisted to localStorage)
- **filters** - Object with search, toggles, and multi-select arrays
- **sortBy** - Current sort order (rating-desc, year-desc, runtime-asc, title-asc, etc.)
- **selectedFilm** - Currently viewed film in modal (null when closed)

**Key State Patterns:**
- `allFilms` - Computed via `useMemo` by merging personal films + selected collections
- `filteredFilms` - Derived from `allFilms` + filters + sortBy
- Collections loaded on-demand when toggled (lazy loading for performance)

### Component Architecture

**App.jsx (src/App.jsx)**
- Root component with all state
- Loads `films.json` on mount (personal watchlist)
- Lazy loads collections when toggled (dynamic imports)
- Merges personal + collection films into `allFilms`
- Derives unique genres/providers/suggestedBy lists via `useMemo` from merged data
- Filters films client-side using combined AND logic across filter types
- OR logic within multi-select filters (genres, providers, suggested_by)
- Handles country switching (updates localStorage)
- Implements sort and "Surprise Me" functionality

**FilterBar (src/components/FilterBar/FilterBar.jsx)**
- Search input (searches title, genres, suggested_by)
- Free toggle (Prime toggle removed - now uses Provider chips)
- **Collections section** - Toggle buttons for curated collections (Personal is always active)
- Runtime filter chips (Under 90min, 90-120min, 2+ hours)
- Multi-select genre chips
- Multi-select provider chips (includes Prime, Netflix, etc.)
- Multi-select suggested_by chips (includes "Collection: X" for collection films)
- Sort dropdown (Rating, Year, Runtime, Title, Recently Added)
- "Surprise Me" button (random film picker respecting current filters)
- Passes filters object up to App via `onFiltersChange`

**FilmGrid (src/components/FilmGrid/FilmGrid.jsx)**
- Responsive CSS Grid layout
- Maps `filteredFilms` to FilmCard components
- Handles click events, passes up to App

**FilmCard (src/components/FilmCard/FilmCard.jsx)**
- Displays poster, title, year, rating
- Shows provider badges (Prime, Free, etc.) based on selected country
- **Collection badge** - Shows collection name and spine number for collection films
- Shows suggested_by or collection source
- Hover effects with scale transform

**TrailerModal (src/components/TrailerModal/TrailerModal.jsx)**
- Full-screen overlay modal
- YouTube trailer embed (if available)
- Displays: title, year, rating, runtime, genres, providers, synopsis, release date
- Backdrop image
- Close on overlay click or Esc key

### Styling System

- **CSS Modules** - Each component has `.module.scss` file for scoped styles
- **Global styles** - `src/styles/global.scss` (imported in main.jsx)
- **Variables** - `src/styles/variables.scss` for colors, spacing, breakpoints
- **Dark theme** - All components use dark color scheme
- **Mobile-first** - Responsive breakpoints defined in variables

### Path Aliases (vite.config.js)

```javascript
'@' → './src'
'@components' → './src/components'
'@styles' → './src/styles'
'@data' → './src/data'
```

Use these in imports: `import filmsData from '@data/films.json'`

## Data Structure

### Personal Watchlist Schema (films.json)

Each film object contains:
```javascript
{
  "title": "string",           // Film title
  "year": "string",            // Release year
  "tmdb_id": number,           // TMDb ID
  "prime": boolean,            // Available on Amazon Prime (deprecated - use availability)
  "free_any": boolean,         // Free on any platform (deprecated - use availability)
  "providers": ["string"],     // Array of provider names (deprecated - use availability)
  "availability": {            // Multi-country availability data
    "GB": {
      "providers": ["Amazon Prime Video", "Netflix"],
      "prime": true,
      "free_any": true
    }
  },
  "tmdb_rating": number,       // TMDb community rating (0-10)
  "runtime": number,           // Minutes
  "genres": ["string"],        // Array of genres
  "poster_url": "string",      // TMDb poster image
  "backdrop_url": "string",    // TMDb backdrop image
  "trailer_url": "string",     // YouTube trailer URL
  "overview": "string",        // Synopsis
  "release_date": "string",    // YYYY-MM-DD
  "suggested_by": "string",    // Who recommended it
  "notes": "string"            // Personal notes
}
```

**Important:** This file is auto-updated by GitHub Actions weekly. Manual edits will be overwritten.

### Collections Schema (collections/*.json)

Each collection film object contains:
```javascript
{
  "title": "Seven Samurai",
  "year": "1954",
  "tmdb_id": 548,
  "collection": "Criterion",   // Collection name
  "collection_meta": {         // Collection-specific metadata
    "spine_number": "2",
    "director": "Akira Kurosawa"
  },
  "availability": {            // Multi-country availability
    "GB": {
      "providers": ["BFI Player", "MUBI"],
      "prime": false,
      "free_any": true
    },
    "US": {
      "providers": ["Max", "Criterion Channel"],
      "prime": false,
      "free_any": false
    }
  },
  "tmdb_rating": 8.6,
  "runtime": 207,
  "genres": ["Action", "Drama"],
  "poster_url": "https://image.tmdb.org/t/p/w500/...",
  "backdrop_url": "https://image.tmdb.org/t/p/original/...",
  "trailer_url": "https://www.youtube.com/watch?v=...",
  "overview": "Film synopsis...",
  "release_date": "1954-04-26",
  "director": "Akira Kurosawa",
  "cast": ["Toshirō Mifune", "Takashi Shimura", "Keiko Tsushima"]
}
```

**Key Differences:**
- Collections have `collection` and `collection_meta` fields
- Collections include director and cast (may be added to personal watchlist in future)
- Collections have multi-country availability (personal watchlist is single country)
- Collections loaded on-demand, not auto-updated weekly

## ESLint Configuration

Uses ESLint 9 flat config format (`eslint.config.js`):
- Extends recommended configs for React Hooks and React Refresh
- Custom rule: `no-unused-vars` allows uppercase constants (`^[A-Z_]`)
- Ignores `dist/` directory
- Browser globals configured

## GitHub Pages Deployment

**Configuration:**
- `vite.config.js` sets `base: '/film-planner/'` for subdirectory deployment
- `npm run deploy` triggers `gh-pages -d dist`
- Deploys to `gh-pages` branch
- Live URL: `https://username.github.io/film-planner/`

**Automated Deployment:**
- GitHub Actions runs weekly (Sunday 9 AM UTC)
- Updates `src/data/films.json` from parent `check_availability.py` script
- Runs `npm ci && npm run deploy`
- See `../.github/workflows/weekly.yml`

## Development Workflow

### Local Development with Live Data

**Personal Watchlist:**
```bash
# Terminal 1: Generate fresh data (from parent directory)
cd ..
python3 check_availability.py

# Terminal 2: Copy to UI and start dev server
cd film-ui
cp ../results.json src/data/films.json
npm run dev
```

**Collections:**
```bash
# Terminal 1: Enrich collection data (from parent directory)
cd ..
python3 enrich_collection.py criterion_raw.json criterion_enriched.json

# Terminal 2: Copy to UI collections directory
cd film-ui
cp ../criterion_enriched.json src/data/collections/criterion.json
npm run dev
```

### Collections Implementation Pattern

**Lazy Loading:**
```javascript
// App.jsx - Load collection on-demand when toggled
useEffect(() => {
  const loadCollections = async () => {
    for (const collection of selectedCollections) {
      if (collection !== 'personal' && !collectionData[collection]) {
        setCollectionsLoading(true)
        try {
          const module = await import(`@data/collections/${collection}.json`)
          setCollectionData(prev => ({ ...prev, [collection]: module.default }))
        } catch (error) {
          console.error(`Failed to load ${collection} collection:`, error)
        } finally {
          setCollectionsLoading(false)
        }
      }
    }
  }
  loadCollections()
}, [selectedCollections, collectionData])
```

**Merging Films:**
```javascript
// Merge personal watchlist + selected collections
const allFilms = useMemo(() => {
  const personal = films
  const collections = selectedCollections
    .filter(c => c !== 'personal')
    .flatMap(c => collectionData[c] || [])
  return [...personal, ...collections]
}, [films, selectedCollections, collectionData])
```

**Collection Badges:**
- Films with `collection` field show collection badge instead of suggested_by
- Badge shows collection name + spine number (if available)
- Example: "📚 Criterion #2"

### Component Development Pattern

1. All components use CSS Modules (`.module.scss`)
2. PropTypes for runtime validation (no TypeScript)
3. Functional components with hooks
4. Event handlers passed as props (e.g., `onFilmClick`, `onFiltersChange`)
5. Prefer `useMemo` for expensive computations (filtering, deriving unique values)
6. Lazy load collections with dynamic imports for performance

### Adding New Filters

Example: Adding a runtime filter

1. Add filter state to `App.jsx` filters object:
   ```javascript
   const [filters, setFilters] = useState({
     // ...existing filters
     runtimeRange: 'all' // 'all' | 'under90' | '90-120' | 'over120'
   })
   ```

2. Update filtering logic in `filteredFilms` useMemo:
   ```javascript
   // Runtime filter
   if (filters.runtimeRange !== 'all') {
     // Add runtime check logic
   }
   ```

3. Add UI controls in `FilterBar.jsx`
4. Pass new filter through props

## Common Patterns

### Filter Logic

All filters use AND logic between types, OR logic within multi-selects:
- Search AND Prime AND Genre[A OR B OR C] AND Provider[X OR Y]

### Modal Pattern

```javascript
// Parent component
const [selectedFilm, setSelectedFilm] = useState(null)

// Open modal
<FilmCard onClick={() => setSelectedFilm(film)} />

// Modal component
{selectedFilm && <TrailerModal film={selectedFilm} onClose={() => setSelectedFilm(null)} />}
```

### YouTube Embed

Extract video ID from `trailer_url` (format: `https://www.youtube.com/watch?v=VIDEO_ID`):
```javascript
const videoId = trailerUrl.split('v=')[1]?.split('&')[0]
const embedUrl = `https://www.youtube.com/embed/${videoId}`
```

## Known Limitations

- No server-side rendering (CSR only via GitHub Pages)
- Data updates only via GitHub Actions (no real-time updates)
- No user authentication or persistence
- No historical tracking of availability changes
- Film list managed externally (Google Sheet → Python script → this UI)

## Recent Features Completed

- ✅ Sort dropdown (rating, year, runtime, title, recently added)
- ✅ "Surprise Me" random film picker
- ✅ Runtime filter chips (Under 90min, 90-120min, 2+ hours)
- ✅ Collections system (Criterion Collection support)
- ✅ Multi-country support with country selector
- ✅ Provider chips filter
- ✅ Suggested By filter

## Future Enhancements

See `../FUTURE_PLANS.md` for roadmap. Key UI improvements still planned:
- Year/decade filters
- "Mark as watched" functionality (requires backend)
- More collections (AFI Top 100, Sight & Sound, etc.)
- Historical tracking of availability changes
- Watch party planner (collaborative viewing)
