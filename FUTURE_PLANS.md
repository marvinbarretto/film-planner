# Future Enhancements for Film Availability Checker

This document captures ideas for future improvements to the film availability checker. Start simple, then add features incrementally.

## Current Status (v2.0) 🎉

**What's Built:**
- ✅ **Phase 1 Complete:** TMDb API integration, weekly automation, 150+ films tracked
- ✅ **Phase 6 Complete:** React Dashboard deployed to GitHub Pages!
  - React 19 + Vite + Sass
  - Film grid with poster images
  - Search (title, genre, suggested_by)
  - Filters (Prime, Free, Genre chips)
  - Detail modal with YouTube trailers
  - Mobile responsive
  - Auto-deploys weekly from GitHub Actions
- ✅ **Data Enrichment (Partial):** TMDb ratings, runtime, genres, posters, backdrops, trailers, overview, release dates

**Live Dashboard:** [https://yourusername.github.io/film-planner/](GitHub Pages)

**What's Next:** Data embellishment + UI polish (see Phase 2.0 below)

---

## Phase 2.0: Data Embellishment (Next Up! 🎯)

**Goal:** Enhance the existing data and add missing UI features to make better viewing decisions.

### Python Script Enhancements (30-45 min)

**Missing TMDb Data:**
- ✅ ~~TMDb rating~~ (DONE)
- ✅ ~~Runtime~~ (DONE)
- ✅ ~~Genres~~ (DONE)
- ✅ ~~Poster URLs~~ (DONE)
- ✅ ~~Trailer links~~ (DONE)
- ⚠️ **Director name** - Use TMDb `/movie/{id}/credits` endpoint
- ⚠️ **Top 3 cast** - Also from credits endpoint
- ⚠️ **Preserve suggested_by and notes** - Currently lost from Google Sheet!

**Why this matters:**
- Director helps discover more films by favorite filmmakers
- Cast helps with "oh, they're in this!" moments
- suggested_by/notes are YOUR personal context - critical to preserve!

**Implementation:**
- Modify `check_availability.py:get_movie_details()` to fetch credits
- Modify `fetch_films_from_sheet()` to preserve suggested_by/notes fields
- Pass through to results.json

### UI Enhancements (30-45 min)

The React app is already built to handle these with minor updates:

**Sorting & Discovery:**
- ⚠️ **Sort dropdown** - By rating, year, runtime, title, recently added
- ⚠️ **"Surprise Me" button** - Random film picker (respect filters)
- ⚠️ **Runtime filter chips** - "Under 90min", "90-120min", "2+ hours"
- ⚠️ **Year/decade filter** - Slider or decade chips

**Better Stats:**
- ⚠️ Show "X new films this week" in header
- ⚠️ Display cast in film detail modal
- ⚠️ Display director in film card/modal

**Time estimate:** 60-90 minutes total for both Python + UI

---

## Phase 1: Original Implementation ✅

- ✅ Basic TMDb API integration
- ✅ Check Amazon Prime Video availability
- ✅ Weekly automated checks via GitHub Actions
- ✅ CSV/JSON output artifacts
- ✅ Clean Google Sheet with title, year, suggested_by, notes columns
- ✅ Preprocessing script for data cleanup
- ✅ 150+ films tracked

---

## Quick Wins Still Available

**A. Smart Filtering Scripts** (15 min)
- Python script: "Show films under 2 hours on Prime"
- "Show highly-rated (8+) available films"
- "Show comedies available tonight"
- **Impact:** Quick CLI answers without opening UI
- **Complexity:** Easy - CSV filtering with pandas

**B. Visual Reports** (30 min)
- Generate PDF report with charts
- "Availability by decade" chart
- "Films per friend" breakdown
- **Impact:** Nice shareable reports
- **Complexity:** Medium - needs matplotlib/plotly

---

## Medium Projects (2-4 hours each)

**C. Smart Notifications**
- Email when high-priority films available
- Weekly digest: "3 new on Prime this week"
- Slack/Discord bot notifications
- **Impact:** Proactive discovery
- **Complexity:** Medium - email API integration

**D. Rotten Tomatoes Scores**
- Fetch RT scores via API or scraping
- Add critics/audience scores to results
- Display in UI alongside TMDb rating
- **Impact:** More rating perspectives
- **Complexity:** Medium - API integration or ethical scraping

---

## Advanced Projects (4-8 hours each)

**E. LLM-Powered Features**
- "What should I watch tonight?" - AI recommendations based on mood
- Smart categorization and tagging
- Natural language queries
- **Impact:** Intelligent film discovery
- **Complexity:** High - Claude/OpenAI API integration

**F. Full CRUD Web App**
- Add films from web interface
- Mark as watched, rate films
- Update notes and priority
- Sync back to Google Sheet via API
- **Impact:** Complete management system
- **Complexity:** High - backend + Google Sheets API integration

**G. Watch Party Planner**
- Import friends' watchlists
- Find films you ALL can watch
- Voting system for group decisions
- **Impact:** Social film watching
- **Complexity:** High - multi-user system

---

## Phase 3: Enhanced Spreadsheet Columns

### Tracking & Organization
- ✅ **suggested_by** - Who suggested it (already in sheet, needs to be preserved in script!)
- ✅ **notes** - Personal context (already in sheet, needs to be preserved in script!)
- ⚠️ **watch_priority** - High/Medium/Low to prioritize viewing order
- ⚠️ **added_date** - When you added it to the list

### Post-Watch Tracking
- ⚠️ **watched** - Yes/No checkbox
- ⚠️ **date_watched** - When you watched it
- ⚠️ **my_rating** - Your rating after watching (1-5 stars)

### Auto-Populated from TMDb (Write Back to Sheet)
- ✅ **tmdb_rating** - Community rating (fetched, could write back)
- ✅ **runtime** - Length in minutes (fetched, could write back)
- ✅ **genres** - Full genre list from TMDb (fetched, could write back)
- ⚠️ **director** - Good for finding films by favorite directors (next up!)
- ⚠️ **cast** - Top cast members (next up!)
- ⚠️ **language** - Original language
- ⚠️ **last_checked_date** - When availability was last checked

### Availability History
- ⚠️ **date_became_available** - Track when it first became free on Prime
- ⚠️ **price_to_rent** - Current rental price if not free
- ⚠️ **price_to_buy** - Current purchase price if not free

**Implementation approach:** Requires Google Sheets API integration with service account for write operations.

---

## Phase 4: LLM Integration

### Smart Film Recommendations
- Analyze your watch history and ratings
- Identify patterns in your preferences (genres, directors, eras, themes)
- Suggest similar films to add to your list
- "You loved Parasite and The Handmaiden - here are 5 Korean thrillers you might enjoy"

### Better Film Matching
- Fuzzy title matching for typos and variations
- Handle alternate titles (international releases, working titles)
- Disambiguate films with similar names
  - "The Batman (2022) vs Batman (1989) vs The Batman (1943)"
- Intelligent year inference when missing
- Suggest corrections: "Did you mean 'Eternal Sunshine of the Spotless Mind'?"

### Implementation Ideas
- Use Claude API or OpenAI for natural language processing
- Build a preference profile based on watched films
- Cache recommendations to minimize API costs
- Weekly digest of personalized suggestions

---

## Phase 5: Notifications & Alerts

### Email Notifications
- Alert when a high-priority film becomes available on Prime
- Weekly digest of availability changes
- Customizable notification preferences

### Slack/Discord Integration
- Post updates to a channel
- Daily/weekly summaries
- Interactive commands to query availability

### Push Notifications
- Mobile notifications via services like Pushover or Telegram
- Real-time alerts for priority films

---

## Phase 6: Extended Provider Coverage

### Multiple Provider APIs
- Integrate JustWatch API for comprehensive coverage
- Add Watchmode API for pricing data
- Cross-reference multiple sources for accuracy

### Regional Support
- Support multiple countries simultaneously
- Compare availability across regions
- VPN recommendations when films unavailable locally

### Pricing Tracking
- Track price changes over time
- Alert when rental prices drop
- Historical price charts

---

## Phase 7: Dashboard UI & Personal Film Reference Tool ✅

**STATUS: COMPLETED!** 🎉

You built a React dashboard that exceeds the original plan. Here's what was originally planned vs what you built:

**Tech Stack Chosen:** React 19 + Vite + Sass (Modern, fast, type-safe with PropTypes)

**Features Implemented:**
- ✅ Film grid with TMDb poster images
- ✅ Search by title, genre, OR suggested_by
- ✅ Filters: Prime toggle, Free toggle, Genre chips (multi-select)
- ✅ Film detail modal with:
  - YouTube trailer embed
  - Full overview/synopsis
  - TMDb rating, runtime, release date
  - All streaming providers
  - Poster + backdrop images
  - Personal notes (suggested_by field)
- ✅ Mobile responsive design
- ✅ Auto-deployment via GitHub Actions to GitHub Pages
- ✅ Live stats in header (X of Y films, Z on Prime, A free)

**Data Flow (Fully Automated):**
```
Google Sheet (manual data entry)
    ↓
GitHub Actions (every Sunday 9 AM UTC)
    ↓
check_availability.py (fetch + enrich via TMDb)
    ↓
results.json → copied to film-ui/src/data/films.json
    ↓
React app build (npm run build)
    ↓
Deploy to GitHub Pages (gh-pages)
    ↓
Live at yourusername.github.io/film-planner
```

**What Still Could Be Added (from original plan):**
- ⚠️ Sort dropdown (rating, year, runtime, title)
- ⚠️ "Surprise Me" random picker
- ⚠️ Runtime filter chips
- ⚠️ Year/decade filter
- ⚠️ "X new films this week" stat
- ⚠️ Watch tracking (mark as watched, rate films)
- ⚠️ Add films from UI (CRUD with Google Sheets API)

---

## Phase 8: Advanced Analytics

### Viewing Statistics
- Films watched per month/year
- Average rating trends
- Genre preference analysis
- Director/actor frequency

### Availability Trends
- Chart availability changes over time
- Identify best times to watch (holiday releases, etc.)
- Provider comparison (which has most of your watchlist?)

### Export Options
- PDF reports with charts
- Shareable HTML pages
- Integration with Letterboxd, IMDb lists

---

## Phase 9: Social Features

### Collaborative Lists
- Share watchlists with friends
- Collaborative priority voting
- Group watch planning

### Integration with Social Platforms
- Sync with Letterboxd watchlist
- Import from IMDb lists
- Share watched films to social media

---

## Technical Debt & Improvements

### Release Management
- ✅ Added `commit-and-tag-version` for semantic versioning (v0.5.0)
- ⚠️ Consider migrating to `release-please` for automated GitHub Releases

### Code Quality
- Add unit tests
- Error handling improvements
- Retry logic for API failures
- Better logging

### Performance
- Parallel API requests for faster processing
- Caching layer for TMDb data
- Incremental updates (only check new/changed films)

### Data Storage
- Move from CSV to database (Supabase, Firestore, SQLite)
- Historical tracking of all availability changes
- Backup and restore functionality

---

## Quick Wins (Easy Additions)

1. ✅ ~~**Add runtime to output**~~ - DONE
2. ✅ ~~**TMDb rating in results**~~ - DONE
3. ⚠️ **Director name** - Discover more by favorite directors (NEXT UP!)
4. ✅ ~~**Poster images**~~ - DONE
5. ✅ ~~**Trailer links**~~ - DONE
6. ⚠️ **Filter by decade** - "Show me all 90s films available"
7. ⚠️ **Rental price threshold** - Alert when price drops below $3
8. ⚠️ **Duplicate detection** - Flag if title appears multiple times

---

## Resources & APIs

### Potential Integrations
- TMDb API: https://developers.themoviedb.org/3
- JustWatch API: https://www.justwatch.com/
- Watchmode API: https://api.watchmode.com/
- Google Sheets API: https://developers.google.com/sheets/api
- Claude API: https://www.anthropic.com/api
- SendGrid (email): https://sendgrid.com/
- Pushover (notifications): https://pushover.net/

### Learning Resources
- Python requests library: https://requests.readthedocs.io/
- GitHub Actions: https://docs.github.com/en/actions
- Google Sheets API Python: https://developers.google.com/sheets/api/quickstart/python

---

## Current Usage & Workflow (v2.0)

### How to Use Today

1. **Adding New Films:**
   - Open your Google Sheet
   - Add row with: title, year, suggested_by, notes
   - Keep format clean (or use preprocessing script if messy)

2. **Checking Availability:**
   - **Automatic:** Every Sunday at 9 AM UTC (GitHub Actions runs automatically)
   - **Manual:** GitHub Actions → "Check Film Availability" → "Run workflow"
   - Takes 2-3 minutes to run
   - Automatically updates the live website!

3. **Finding Films to Watch (NEW!):**
   - **🎬 Visit your live dashboard:** yourusername.github.io/film-planner
   - Search by title, genre, or friend's name
   - Filter by Prime, Free, or Genre
   - Click any film to see trailer, synopsis, and where to watch
   - **Mobile-friendly** - check from your phone!

4. **Alternative - Download Raw Data:**
   - Go to completed workflow run
   - Download "availability-results" artifact
   - Unzip and open `results_summary.csv`

### Recommended Next Step

**Phase 2.0: Data Embellishment (60-90 min total)**

Priority improvements:
1. ✅ Preserve suggested_by/notes from Google Sheet (currently lost!)
2. ⚠️ Add director name from TMDb
3. ⚠️ Add top 3 cast members
4. ⚠️ Add sort dropdown to UI
5. ⚠️ Add "Surprise Me" random picker
6. ⚠️ Add runtime filter chips

This gives you richer data without major architectural changes.

## Notes

- Always maintain backward compatibility
- Keep the core simple and reliable
- Add features incrementally based on actual usage
- Document each enhancement for future reference
- Consider API rate limits and costs for each integration

## Version History

- **v2.0** (2025-11-03): React dashboard deployed to GitHub Pages with automated updates, rich TMDb data (ratings, runtime, genres, posters, trailers), search & filters, mobile responsive
- **v1.0** (2025-01-03): Initial working system with TMDb integration, weekly automation, and 160+ films
