# Automated Film Availability Checker

## Overview

You maintain a long list of films you'd like to watch, but you only have
an Amazon Prime Video account.\
The goal is to **automate checking whether each film is available for
free (or at a cost) on Amazon Prime or other channels**, updating this
information on a schedule without manual effort.

The chosen stack and approach leverage **free services**, are low
maintenance, and easy to extend.

------------------------------------------------------------------------

## Core Idea

A **Python script** runs automatically on **GitHub Actions**, reading
your list of films from a **Google Sheet (public CSV)**, checking each
film against **The Movie Database (TMDb)** API for streaming
availability.

### Key Outcomes

-   Daily or weekly automated checks.
-   Results saved as downloadable CSV/JSON artifacts.
-   Flags for:
    -   `prime` -- available on Amazon Prime Video.
    -   `free_any` -- available for free or with ads on any provider.
-   Fully free and serverless setup (public repo + free APIs).

------------------------------------------------------------------------

## Opportunities

  -----------------------------------------------------------------------
  Area                  Opportunity
  --------------------- -------------------------------------------------
  **Automation**        Fully automatic daily/weekly updates using GitHub
                        Actions.

  **Integration**       Could expand to include notifications (email,
                        Slack, etc.) when a film becomes free.

  **Extensibility**     Possible to add more APIs (e.g., JustWatch,
                        Watchmode) or include region-based filters.

  **UI Options**        In future, you could build a small frontend
                        dashboard or use Google Sheets for tracking.

  **Data Enrichment**   Add ratings, genres, or runtime from TMDb for
                        richer reporting.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Technical Components

### 1. **Data Source -- Google Sheet**

-   Google Sheet contains `title` and optional `year` columns.
-   Published as a **public CSV link**.
-   Read directly by the Python script (no auth required).

### 2. **Data Fetching -- TMDb API**

-   `/search/movie` → get film ID.
-   `/movie/{id}/watch/providers` → check available streaming providers
    by country (e.g., GB).
-   Results are parsed for Amazon Prime Video and free options.

### 3. **Automation -- GitHub Actions**

-   YAML workflow runs on schedule (cron syntax).
-   Installs Python and dependencies.
-   Executes script using secrets/variables for configuration.
-   Saves results as `results.json` and `results_summary.csv` artifacts.

### 4. **Configuration**

  -----------------------------------------------------------------------------------------------------------
  Setting                 Purpose                 Example
  ----------------------- ----------------------- -----------------------------------------------------------
  `TMDB_API_KEY`          Secret key for API      `abcd1234...`
                          access                  

  `SHEET_CSV_URL`         Public Google Sheet CSV `https://docs.google.com/spreadsheets/.../pub?output=csv`
                          link                    

  `COUNTRY`               Two-letter country code `GB`
  -----------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## High-Level Setup Plan

### Step 1. **Create the Google Sheet**

-   Columns: `title, year`
-   Fill in your films.
-   File → Share → *Publish to the web* → CSV → Copy link.

### Step 2. **Create a GitHub Repository**

-   Add `check_availability.py`, `requirements.txt`,
    `.github/workflows/weekly.yml`.
-   Commit and push.

### Step 3. **Set Secrets and Variables**

-   Go to **Settings → Secrets and variables → Actions**.
-   Add:
    -   `TMDB_API_KEY` (Secret)
    -   `SHEET_CSV_URL` (Variable)

### Step 4. **Verify Workflow**

-   Run manually from *Actions → Run workflow*.
-   Confirm `results.json` and `results_summary.csv` artifacts appear.

### Step 5. **Automate**

-   Workflow runs weekly at 09:00 UTC (adjust cron for daily if
    preferred).

------------------------------------------------------------------------

## Future Enhancements

-   **Notifications:** Send alerts when new films become available for
    free.
-   **Private Sheet Integration:** Use Google Sheets API (service
    account) for private data.
-   **Dashboard UI:** Build a static front-end (e.g., Astro or Next.js)
    that fetches and visualizes availability.
-   **Multiple Providers:** Integrate more APIs for deeper coverage and
    price tracking.
-   **Database Storage:** Save results to Firestore, Supabase, or SQLite
    for historical tracking.

------------------------------------------------------------------------

## Considerations

  -----------------------------------------------------------------------
  Category               Concern              Mitigation
  ---------------------- -------------------- ---------------------------
  **API Limits**         TMDb has rate limits Add short sleep between
                         per 10s/min          requests (already handled).

  **Regional             Film availability    Configure `COUNTRY` env
  Variations**           differs by country   variable.

  **Accuracy**           TMDb data may lag    Optionally add JustWatch
                         behind real          fallback later.
                         availability         

  **Privacy**            Public Google Sheet  Acceptable for this use
                         is readable to       case (non-sensitive).
                         anyone with the link 

  **Maintenance**        APIs can change over Script is modular and
                         time                 easily updated.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Summary

This setup provides a **free, automated, maintainable solution** for
monitoring film availability across streaming platforms---ideal for a
personal tracker.\
All logic runs serverlessly, data is stored publicly, and results are
reproducible.

------------------------------------------------------------------------

**Repository structure:**

    /
    ├── check_availability.py
    ├── requirements.txt
    └── .github/
        └── workflows/
            └── weekly.yml
