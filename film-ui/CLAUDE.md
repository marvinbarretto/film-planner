# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React 19 dashboard for browsing a personal film watchlist with streaming availability data. Part of the larger film-planner system - this UI consumes data from `../check_availability.py` and deploys to GitHub Pages.

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

```
src/data/films.json (auto-updated by GitHub Actions)
    ↓
App.jsx (loads data, manages state)
    ↓
FilterBar + FilmGrid (presentation)
    ↓
FilmCard (individual films)
    ↓
TrailerModal (detail view)
```

### State Management

All state lives in `App.jsx` - no external state library:

- **films** - Array of film objects loaded from `films.json`
- **filters** - Object with search, toggles, and multi-select arrays
- **selectedFilm** - Currently viewed film in modal (null when closed)

Filtering logic uses `useMemo` to derive `filteredFilms` from `films` + `filters`.

### Component Architecture

**App.jsx (src/App.jsx:1-151)**
- Root component with all state
- Loads `films.json` on mount
- Derives unique genres/providers/suggestedBy lists via `useMemo`
- Filters films client-side using combined AND logic across filter types
- OR logic within multi-select filters (genres, providers, suggested_by)

**FilterBar (src/components/FilterBar/FilterBar.jsx)**
- Search input (searches title, genres, suggested_by)
- Prime/Free toggles
- Multi-select genre chips
- Multi-select provider chips
- Multi-select suggested_by chips
- Passes filters object up to App via `onFiltersChange`

**FilmGrid (src/components/FilmGrid/FilmGrid.jsx)**
- Responsive CSS Grid layout
- Maps `filteredFilms` to FilmCard components
- Handles click events, passes up to App

**FilmCard (src/components/FilmCard/FilmCard.jsx)**
- Displays poster, title, year, rating
- Shows Prime/Free badges
- Hover effects

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

### films.json Schema

Each film object contains:
```javascript
{
  "title": "string",           // Film title
  "year": "string",            // Release year
  "tmdb_id": number,           // TMDb ID
  "prime": boolean,            // Available on Amazon Prime
  "free_any": boolean,         // Free on any platform
  "providers": ["string"],     // Array of provider names
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

```bash
# Terminal 1: Generate fresh data (from parent directory)
cd ..
python3 check_availability.py

# Terminal 2: Copy to UI and start dev server
cd film-ui
cp ../results.json src/data/films.json
npm run dev
```

### Component Development Pattern

1. All components use CSS Modules (`.module.scss`)
2. PropTypes for runtime validation (no TypeScript)
3. Functional components with hooks
4. Event handlers passed as props (e.g., `onFilmClick`, `onFiltersChange`)
5. Prefer `useMemo` for expensive computations (filtering, deriving unique values)

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

## Future Enhancements

See `../FUTURE_PLANS.md` for roadmap. Key UI improvements planned:
- Sort dropdown (rating, year, runtime, title)
- "Surprise Me" random film picker
- Runtime filter chips
- Year/decade filters
- "Mark as watched" functionality (requires backend)
