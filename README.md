
  What We Accomplished Tonight

  ✅ Built a fully automated film availability checker:
  - 160+ films tracked in clean Google Sheet
  - Weekly GitHub Actions workflow checking TMDb
  - Results downloadable as CSV/JSON
  - Manual trigger anytime you want

  ✅ Created comprehensive documentation:
  - FUTURE_PLANS.md with all enhancement ideas organized
   by complexity
  - CLAUDE.md for future AI assistance
  - Clear next steps for building the dashboard

  ✅ Solved all the tricky issues:
  - Data preprocessing to clean messy titles
  - URL escaping problems
  - GitHub Actions artifact deprecation
  - CSV parsing issues

  Your System is Now:

  - Running automatically every Sunday at 9 AM UTC
  - Checking which films are on Prime Video
  - Ready for you to download results and find something
   to watch

  When You're Ready for Next Steps:

  The FUTURE_PLANS.md has everything mapped out. The
  personal dashboard is probably the best next project -
   makes it super easy to answer "what should I watch
  tonight?" from your phone.

  Great first Python project! 🎬




NOW

- think about how to configure some of this stuff?
- what if i gain access to Netflix temporarily
- what if I am on holiday in another country

- i am used to front end UI web development , but as this is python perhaps i should be thinking more widely about how to solve for these questions

but i think a UI could be useful here? can watch trailer etc... really nice one-pager, all super-responsive would work
but a telegram alert would be SWEET also



  Current Limitations:
  - ⚠️ Calls out that suggested_by/notes are being lost (needs fixing!)

  ---
  Next Steps Recommended

  Based on the updated docs, your Phase 2.0 priorities are:

  1. Fix data loss - Preserve suggested_by/notes from Google Sheet
  (check_availability.py:174-240)
  2. Add director - TMDb /movie/{id}/credits endpoint
  3. Add cast - Same credits endpoint, top 3 actors
  4. UI enhancements - Sort, random picker, runtime filters





# Film Availability Checker

Automated checker for film streaming availability using The Movie Database (TMDb) API.

## Overview

This project helps you track which films from your watchlist are available for free on Amazon Prime Video or other streaming platforms. It automatically checks availability weekly and generates downloadable reports.

## How It Works

1. Reads film titles from a public Google Sheet
2. Searches TMDb for each film
3. Checks streaming availability in your country
4. Generates reports showing which films are available on Prime or other free platforms
5. Runs automatically every Sunday at 9 AM UTC via GitHub Actions

## Setup Instructions

### 1. Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet with these columns:
   - `title` - Film title
   - `year` - Release year (optional but recommended for accurate matching)
3. Add your films to the sheet
4. **Publish to web:**
   - File → Share → Publish to web
   - Select your sheet and change format to "Comma-separated values (.csv)"
   - Copy the published URL

### 2. Get TMDb API Key

1. Sign up at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to Settings → API
3. Request an API Key (Developer tier)
4. Save your API key

### 3. Configure This Repository

Once you've pushed this code to GitHub:

1. Go to **Settings → Secrets and variables → Actions**
2. Add a new **Secret**:
   - Name: `TMDB_API_KEY`
   - Value: Your TMDb API key
3. Add new **Variables**:
   - Name: `SHEET_CSV_URL`
   - Value: Your Google Sheet CSV URL
   - Name: `COUNTRY`
   - Value: Your country code (e.g., `GB`, `US`, `CA`, `AU`)

### 4. Run the Workflow

1. Go to the **Actions** tab
2. Select "Check Film Availability"
3. Click "Run workflow" to test
4. Download results from the workflow artifacts

## Reports

The workflow generates two files:

- **results.json** - Detailed results with all provider information
- **results_summary.csv** - Easy-to-read spreadsheet with availability flags

### CSV Columns

- **Title** - Film title
- **Year** - Release year
- **TMDb ID** - Database ID (or "Not Found")
- **Prime** - Available on Amazon Prime Video (Yes/No)
- **Free Any** - Available free anywhere (Yes/No)
- **Providers** - List of streaming services

## Schedule

The workflow runs automatically every Sunday at 9:00 AM UTC. You can also trigger it manually anytime from the Actions tab.

To change the schedule, edit the cron expression in `.github/workflows/weekly.yml`:

```yaml
schedule:
  - cron: '0 9 * * 0'  # Sunday at 9 AM
```

Common schedules:
- Daily: `0 9 * * *`
- Twice weekly (Wed & Sun): `0 9 * * 0,3`

## Local Testing

If you want to test the script locally:

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export TMDB_API_KEY="your-api-key"
export SHEET_CSV_URL="your-sheet-url"
export COUNTRY="GB"

# Run the script
python check_availability.py

# View results
open results_summary.csv
```

## Future Enhancements

See [FUTURE_PLANS.md](FUTURE_PLANS.md) for ideas on extending this project, including:

- LLM integration for smart recommendations
- Enhanced spreadsheet tracking
- Email/Slack notifications
- Dashboard UI
- Historical availability tracking

## Project Structure

```
/
├── check_availability.py      # Main Python script
├── requirements.txt            # Python dependencies
├── .github/
│   └── workflows/
│       └── weekly.yml          # GitHub Actions workflow
├── FUTURE_PLANS.md            # Enhancement ideas
└── README.md                  # This file
```

## Country Codes

Common country codes for TMDb:
- `GB` - United Kingdom
- `US` - United States
- `CA` - Canada
- `AU` - Australia
- `DE` - Germany
- `FR` - France
- `JP` - Japan
- `IN` - India

## Troubleshooting

### No films found in sheet
- Verify your sheet is published to web as CSV
- Check column headers are exactly `title` and `year` (lowercase)
- Test the CSV URL in your browser

### Film not found on TMDb
- Check spelling
- Add the release year
- Try the international title if different

### No streaming info available
- Not all films have streaming data
- Availability varies by country
- Some films may not be available for streaming

## License

This is a personal project. Feel free to fork and adapt for your own use.

## Credits

- Film data provided by [The Movie Database (TMDb)](https://www.themoviedb.org/)
- This product uses the TMDb API but is not endorsed or certified by TMDb
