# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Film Availability Checker - An automated system that tracks which films from a personal watchlist are available on streaming platforms, with support for curated film collections (like Criterion Collection). The system runs weekly via GitHub Actions, checking ~160 films against The Movie Database (TMDb) API and provides a React dashboard for browsing.

## Architecture

**Data Flow:**

**Personal Watchlist:**
```
Google Sheet (user's film list)
    ↓
GitHub Actions (weekly schedule: every Sunday 9 AM UTC)
    ↓
check_availability.py (main script)
    ↓
TMDb API (film search + streaming providers + enrichment)
    ↓
results.json + results_summary.csv
    ↓
Copy results.json → film-ui/src/data/films.json
    ↓
Build React app (npm run build)
    ↓
Deploy to GitHub Pages (gh-pages)
    ↓
Live dashboard at yourusername.github.io/film-planner
```

**Collections (Criterion, etc.):**
```
Scraped/curated collection data (scrapers/)
    ↓
criterion_raw.json (title, year, spine_number, director)
    ↓
enrich_collection.py (fetch TMDb metadata + multi-country availability)
    ↓
criterion_enriched.json
    ↓
Copy to film-ui/src/data/collections/criterion.json
    ↓
React app loads on-demand when user toggles collection
    ↓
Merged with personal watchlist in UI
```

**Key Components:**

1. **check_availability.py** - Main availability checker
   - Fetches films from Google Sheet CSV URL (or local file for testing)
   - Searches TMDb for each film by title/year
   - Queries TMDb watch providers API for streaming availability
   - Fetches enriched data: ratings, runtime, genres, posters, trailers, overview
   - Rate limits requests (300ms delay between calls)
   - Outputs JSON (detailed) and CSV (summary) results

2. **film-ui/** - React dashboard (deployed to GitHub Pages)
   - **Tech Stack:** React 19 + Vite + Sass + PropTypes
   - **Features:**
     - Film grid with TMDb poster images
     - Search by title, genre, suggested_by, or collection
     - Filters: Prime toggle, Free toggle, Genre chips, Provider chips, Suggested By chips, Runtime chips
     - **Collections toggle** - Merge curated collections (Criterion) with personal watchlist
     - Sort options: Rating, Year, Runtime, Title, Recently Added
     - "Surprise Me" random film picker
     - Film detail modal with trailers, synopsis, ratings, providers
     - Mobile responsive
   - **Components:**
     - `App.jsx` - Main app with state management (includes collections state + merging logic)
     - `FilterBar.jsx` - Search, filters, and collection toggles
     - `FilmGrid.jsx` - Responsive grid layout
     - `FilmCard.jsx` - Individual film cards (shows collection badges)
     - `TrailerModal.jsx` - Full-screen film details with YouTube embed
   - **Data Sources:**
     - `src/data/films.json` - Personal watchlist (auto-updated by workflow)
     - `src/data/collections/*.json` - Curated collections (loaded on-demand)

3. **enrich_collection.py** - Collection data enrichment
   - Takes raw collection data (title, year, metadata)
   - Fetches TMDb data: ratings, runtime, genres, posters, trailers, cast, director
   - Queries streaming availability for multiple countries (GB, US, CA, AU, NZ)
   - Outputs enriched JSON for UI consumption
   - Usage: `python3 enrich_collection.py criterion_raw.json criterion_enriched.json`

4. **preprocess_sheet.py** - Data cleaning utility (currently not in workflow)
   - Extracts clean titles from messy input (removes "FILM:", parenthetical notes, etc.)
   - Extracts years from various formats: (2014) or "1994 (15th) Title"
   - Preserves all context in "notes" column
   - Can read from local file or URL

5. **scrapers/** - Collection data scrapers
   - Scripts to scrape/curate film collection data
   - Outputs raw JSON with collection metadata (spine numbers, etc.)

6. **.github/workflows/weekly.yml** - GitHub Actions automation
   - Runs every Sunday at 9 AM UTC
   - Can be manually triggered anytime
   - Uses secrets: TMDB_API_KEY
   - Uses variables: SHEET_CSV_URL, COUNTRY
   - Steps:
     1. Run check_availability.py
     2. Copy results.json to film-ui/src/data/films.json
     3. Commit updated data to repo
     4. Build React app
     5. Deploy to GitHub Pages
     6. Upload results as artifacts (90-day retention)

## Required Environment Variables

**For GitHub Actions:**
- `TMDB_API_KEY` (secret) - TMDb API key from themoviedb.org
- `SHEET_CSV_URL` (variable) - Published Google Sheet CSV URL
- `COUNTRY` (variable) - Two-letter country code (e.g., GB, US)

**For Local Development:**
```bash
export TMDB_API_KEY="your-api-key"
export SHEET_CSV_URL="https://docs.google.com/spreadsheets/.../pub?output=csv"
export COUNTRY="GB"
```

Optional for local testing:
```bash
export LOCAL_CSV_PATH="films_cleaned.csv"  # If not using SHEET_CSV_URL
```

## Working with Collections

**Adding a New Collection:**

1. **Create/scrape raw collection data** (in `scrapers/` or manually):
   ```json
   [
     {
       "title": "Film Title",
       "year": "1954",
       "collection": "Criterion",
       "collection_meta": {
         "spine_number": "2",
         "director": "Director Name"
       }
     }
   ]
   ```

2. **Enrich with TMDb data**:
   ```bash
   python3 enrich_collection.py criterion_raw.json criterion_enriched.json
   ```

3. **Copy to UI data directory**:
   ```bash
   cp criterion_enriched.json film-ui/src/data/collections/criterion.json
   ```

4. **Add collection toggle in UI** (`film-ui/src/components/FilterBar/FilterBar.jsx`):
   - Add button in collections section
   - Handle toggle in `handleCollectionToggle`

**Collections vs Personal Watchlist:**
- Collections are **curated, canonical lists** (Criterion Collection, AFI Top 100, etc.)
- Personal watchlist is **your own films to watch**
- Collections load **on-demand** when toggled (lazy loading for performance)
- Collections have **multi-country availability** (personal watchlist is single country)
- UI merges both sources with filters working across all films

## Common Commands

**Python Script (Backend):**
```bash
# Install dependencies
pip3 install -r requirements.txt

# Run availability checker (personal watchlist)
python3 check_availability.py

# Enrich collection data with TMDb
python3 enrich_collection.py criterion_raw.json criterion_enriched.json

# Run preprocessing (for cleaning messy data)
python3 preprocess_sheet.py

# View results
open results_summary.csv
```

**React UI Development:**
```bash
# Navigate to UI directory
cd film-ui

# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages (manual)
npm run deploy

# Lint code
npm run lint
```

**Manual Workflow Trigger:**
- Go to GitHub Actions tab
- Select "Check Film Availability"
- Click "Run workflow"
- Automatically updates live site after completion

## Google Sheet Format

**Required columns (lowercase):**
- `title` - Film title (clean format)
- `year` - Release year (optional but recommended)
- `suggested_by` - Who recommended it
- `notes` - Additional context

**Important:**
- Column headers must be exactly lowercase
- Sheet must be published to web as CSV
- URL format: `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv`
- No backslashes in URL when setting environment variable

## TMDb API Integration

**Rate Limiting:**
- TMDb allows 40 requests per 10 seconds
- Script uses 300ms delay between requests
- ~160 films = ~2-3 minutes to complete

**API Calls:**
1. `/search/movie` - Find film by title/year
2. `/movie/{id}/watch/providers` - Get streaming availability by country

**Common Issues:**
- Films not found: Check spelling, try adding year, use international title
- No streaming info: Not all films have provider data in all countries
- 404 errors: Usually means malformed SHEET_CSV_URL (check for escaped characters)

## Development Notes

**Adding New Features:**
- See FUTURE_PLANS.md for roadmap and detailed enhancement ideas
- **Current focus:** Phase 2.0 - Data embellishment (director, cast, preserve suggested_by/notes)
- UI enhancements: sort dropdown, "Surprise Me" button, runtime filters

**Data Structures:**

**Personal Watchlist (results.json):**
- **Input (Google Sheet):** title, year, suggested_by, notes
- **Output (results.json):**
  ```json
  {
    "title": "Film Title",
    "year": "2024",
    "tmdb_id": 12345,
    "prime": true,
    "free_any": true,
    "providers": ["Amazon Prime Video", "Netflix"],
    "suggested_by": "Friend Name",
    "notes": "Personal notes about why I want to watch this",
    "tmdb_rating": 8.5,
    "runtime": 148,
    "genres": ["Action", "Thriller"],
    "poster_url": "https://image.tmdb.org/t/p/w500/...",
    "backdrop_url": "https://image.tmdb.org/t/p/original/...",
    "trailer_url": "https://www.youtube.com/watch?v=...",
    "overview": "Film synopsis...",
    "release_date": "2024-01-15"
  }
  ```

**Collections Data (criterion.json, etc.):**
- **Input (raw JSON):** title, year, collection, collection_meta
- **Output (enriched JSON):**
  ```json
  {
    "title": "Seven Samurai",
    "year": "1954",
    "tmdb_id": 12345,
    "collection": "Criterion",
    "collection_meta": {
      "spine_number": "2",
      "director": "Akira Kurosawa"
    },
    "availability": {
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
- Collections have multi-country availability (personal watchlist is single country)
- Collections include `collection` and `collection_meta` fields
- Collections may have collection-specific metadata (spine numbers, etc.)
- UI merges both sources, with collection films showing special badges

**Current Limitations:**
- Personal watchlist: Single country per run (collections support multiple countries)
- Personal watchlist: Only checks free/subscription streaming (not rental/purchase)
- No historical tracking (each run is independent)
- No deduplication of films with same title across personal + collections
- Collections are manually curated (not auto-updated weekly like personal watchlist)

## Troubleshooting

**"Found X films" but "Total films checked: 0":**
- Google Sheet URL is returning HTML instead of CSV
- Re-publish sheet to web as CSV format
- Test URL directly in browser - should show plain text CSV

**"ERROR fetching films: 404":**
- SHEET_CSV_URL has escaped characters (backslashes)
- URL should have plain `?` and `=`, not `%5C` encoded

**Films not matching on TMDb:**
- Add year to improve matching
- Check for typos or alternate titles
- Some TV shows/documentaries may not be in TMDb movie database

**UI not updating after workflow runs:**
- Check that workflow completed successfully
- Verify results.json was copied to film-ui/src/data/films.json
- Check that gh-pages deployment succeeded
- Clear browser cache if needed
- May take 1-2 minutes for GitHub Pages to update

## Deployment

**Live Site:**
- URL: `https://yourusername.github.io/film-planner/`
- Hosted on GitHub Pages (free)
- Auto-deploys every Sunday after workflow runs
- Can also deploy manually: `cd film-ui && npm run deploy`

**How Deployment Works:**
1. GitHub Actions runs `check_availability.py`
2. Copies `results.json` → `film-ui/src/data/films.json`
3. Commits updated data to main branch
4. Runs `npm ci` to install UI dependencies
5. Runs `npm run deploy` which:
   - Builds production bundle (`npm run build`)
   - Pushes `dist/` folder to `gh-pages` branch
   - GitHub Pages serves from `gh-pages` branch

**Configuration:**
- `vite.config.js`: Sets `base: '/film-planner/'` for GitHub Pages subdirectory
- `package.json`: Contains `deploy` script using `gh-pages` package
- Requires `GITHUB_TOKEN` secret (automatically provided by GitHub Actions)

## UI Development Workflow

**Local Development:**
```bash
cd film-ui
npm run dev
# Visit http://localhost:5173
# Edit components in src/
# Hot reload enabled
```

**Testing with Real Data:**
- Run `python3 check_availability.py` in root directory
- Copy `results.json` to `film-ui/src/data/films.json`
- UI will automatically reload with new data

**Component Structure:**
- `src/App.jsx` - Main app, manages state (films, filters, selected film)
- `src/components/FilterBar/` - Search input, toggles, genre chips
- `src/components/FilmGrid/` - Responsive grid using CSS Grid
- `src/components/FilmCard/` - Individual film card with poster, rating, badges
- `src/components/TrailerModal/` - Full-screen modal with YouTube embed
- `src/styles/` - Global styles and SCSS variables

**Styling:**
- CSS Modules (scoped styles)
- SCSS variables in `src/styles/variables.scss`
- Mobile-first responsive design
- Dark theme
