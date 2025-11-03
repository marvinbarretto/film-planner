# Future Enhancements for Film Availability Checker

This document captures ideas for future improvements to the film availability checker. Start simple, then add features incrementally.

## Phase 1: Current Implementation (v1.0)
- Basic TMDb API integration
- Check Amazon Prime Video availability
- Weekly automated checks via GitHub Actions
- CSV/JSON output artifacts
- Simple Google Sheet with title and year columns

---

## Phase 2: Enhanced Spreadsheet Columns

### Tracking & Organization
- **watch_priority** - High/Medium/Low to prioritize viewing order
- **genre** - Action, Drama, Comedy, etc. (for mood-based filtering)
- **recommended_by** - Source of recommendation (friend, subreddit, podcast)
- **added_date** - When you added it to the list
- **notes** - Why you want to watch it, quick reminders

### Post-Watch Tracking
- **watched** - Yes/No checkbox
- **date_watched** - When you watched it
- **my_rating** - Your rating after watching (1-5 stars)

### Auto-Populated from TMDb
- **tmdb_rating** - Community rating
- **runtime** - Length in minutes (helps plan viewing sessions)
- **director** - Good for finding films by favorite directors
- **language** - Original language
- **genres** - Full genre list from TMDb

### Availability History
- **last_checked_date** - When availability was last checked
- **date_became_available** - Track when it first became free on Prime
- **price_to_rent** - Current rental price if not free
- **price_to_buy** - Current purchase price if not free

**Implementation approach:** Script could write back to Google Sheets (requires Google Sheets API integration with service account).

---

## Phase 3: LLM Integration

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

## Phase 4: Notifications & Alerts

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

## Phase 5: Extended Provider Coverage

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

## Phase 6: Dashboard UI

### Web Interface
- Build static site with Astro or Next.js
- Display all films with sortable/filterable table
- Visual indicators for availability status
- Click to view TMDb details

### Features
- Search and filter by genre, year, availability
- Sort by priority, rating, date added
- Quick actions: mark as watched, update priority
- Mobile-responsive design

### Hosting
- Deploy to Vercel, Netlify, or Cloudflare Pages (free tier)
- Static generation from JSON artifacts
- Optional: Real-time updates via GitHub Actions

---

## Phase 7: Advanced Analytics

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

## Phase 8: Social Features

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

1. **Add runtime to output** - Helps plan viewing sessions
2. **TMDb rating in results** - Compare community ratings
3. **Director name** - Discover more by favorite directors
4. **Poster images** - Visual identification
5. **Trailer links** - Quick preview before watching
6. **Filter by decade** - "Show me all 90s films available"
7. **Rental price threshold** - Alert when price drops below $3
8. **Duplicate detection** - Flag if title appears multiple times

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

## Notes

- Always maintain backward compatibility
- Keep the core simple and reliable
- Add features incrementally based on actual usage
- Document each enhancement for future reference
- Consider API rate limits and costs for each integration
