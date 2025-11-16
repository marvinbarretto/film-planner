#!/usr/bin/env python3
"""
Film Availability Checker
Checks streaming availability for films listed in a Google Sheet using TMDb API
"""

import os
import sys
import json
import csv
import time
from typing import Dict, List, Optional
import requests
from dotenv import load_dotenv

# Load environment variables from .env file (for local development)
load_dotenv()

# Configuration from environment variables
TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
SHEET_CSV_URL = os.environ.get('SHEET_CSV_URL')
COUNTRY = os.environ.get('COUNTRY', 'GB')  # Default to GB (United Kingdom) - kept for backward compatibility
LOCAL_CSV_PATH = os.environ.get('LOCAL_CSV_PATH', 'films_cleaned.csv')  # Default to local file

# Countries to fetch provider data for
COUNTRIES = ['GB', 'US', 'CA', 'AU', 'NZ']

# TMDb API endpoints
TMDB_BASE_URL = 'https://api.themoviedb.org/3'
SEARCH_ENDPOINT = f'{TMDB_BASE_URL}/search/movie'
WATCH_PROVIDERS_ENDPOINT = f'{TMDB_BASE_URL}/movie/{{movie_id}}/watch/providers'
CREDITS_ENDPOINT = f'{TMDB_BASE_URL}/movie/{{movie_id}}/credits'

# Rate limiting (TMDb allows 40 requests per 10 seconds)
REQUEST_DELAY = 0.3  # 300ms between requests


def validate_config():
    """Validate required configuration is present"""
    if not TMDB_API_KEY:
        print("ERROR: TMDB_API_KEY environment variable not set")
        sys.exit(1)

    # Check if we're using local file or remote URL
    if SHEET_CSV_URL:
        print(f"Using remote Google Sheet: {SHEET_CSV_URL[:50]}...")
    else:
        print(f"Using local CSV file: {LOCAL_CSV_PATH}")

    print(f"Configuration validated. Country: {COUNTRY}")


def fetch_films_from_sheet() -> List[Dict[str, str]]:
    """Fetch films from Google Sheet CSV or local file"""
    try:
        if SHEET_CSV_URL:
            # Fetch from remote URL
            print(f"Fetching films from Google Sheet...")
            response = requests.get(SHEET_CSV_URL, timeout=10)
            response.raise_for_status()
            lines = response.text.splitlines()
            reader = csv.DictReader(lines)
            films = list(reader)
        else:
            # Read from local file
            print(f"Reading films from local file: {LOCAL_CSV_PATH}")
            with open(LOCAL_CSV_PATH, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                films = list(reader)

        print(f"Found {len(films)} films")
        return films
    except Exception as e:
        print(f"ERROR fetching films: {e}")
        sys.exit(1)


def search_film(title: str, year: Optional[str] = None) -> Optional[int]:
    """Search for film on TMDb and return movie ID"""
    params = {
        'api_key': TMDB_API_KEY,
        'query': title,
        'language': 'en-US'
    }

    if year:
        params['year'] = year

    try:
        response = requests.get(SEARCH_ENDPOINT, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data['results']:
            # Return first result's ID
            movie = data['results'][0]
            print(f"  Found: {movie['title']} ({movie.get('release_date', 'N/A')[:4]})")
            return movie['id']
        else:
            print(f"  No results found for: {title}")
            return None
    except Exception as e:
        print(f"  ERROR searching for {title}: {e}")
        return None


def get_watch_providers(movie_id: int) -> Dict:
    """Get streaming providers for all configured countries"""
    url = WATCH_PROVIDERS_ENDPOINT.format(movie_id=movie_id)
    params = {'api_key': TMDB_API_KEY}

    availability = {}

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        # Extract providers for each country
        for country_code in COUNTRIES:
            country_data = data['results'].get(country_code, {})

            providers = []
            prime = False
            free_any = False

            # Check flatrate (subscription services)
            if 'flatrate' in country_data:
                for provider in country_data['flatrate']:
                    provider_name = provider['provider_name']
                    providers.append(provider_name)

                    # Check for Amazon Prime
                    if 'Prime Video' in provider_name or 'Amazon' in provider_name:
                        prime = True

                    free_any = True

            # Check free with ads
            if 'free' in country_data:
                for provider in country_data['free']:
                    provider_name = provider['provider_name']
                    if provider_name not in providers:
                        providers.append(provider_name)
                    free_any = True

            availability[country_code] = {
                'providers': providers,
                'prime': prime,
                'free_any': free_any
            }

        return availability

    except Exception as e:
        print(f"  ERROR fetching providers: {e}")
        # Return empty availability for all countries
        return {country: {'providers': [], 'prime': False, 'free_any': False} for country in COUNTRIES}


def get_movie_details(movie_id: int) -> Dict:
    """Get additional movie details including trailer, poster, rating, etc."""
    movie_url = f'{TMDB_BASE_URL}/movie/{movie_id}'
    videos_url = f'{TMDB_BASE_URL}/movie/{movie_id}/videos'
    params = {'api_key': TMDB_API_KEY, 'language': 'en-US'}

    details = {
        'tmdb_rating': None,
        'runtime': None,
        'genres': [],
        'poster_url': None,
        'backdrop_url': None,
        'trailer_url': None,
        'overview': None,
        'release_date': None,
        'director': None,
        'cast': []
    }

    try:
        # Get movie details
        movie_response = requests.get(movie_url, params=params, timeout=10)
        movie_response.raise_for_status()
        movie_data = movie_response.json()

        details['tmdb_rating'] = movie_data.get('vote_average')
        details['runtime'] = movie_data.get('runtime')
        details['genres'] = [g['name'] for g in movie_data.get('genres', [])]
        details['overview'] = movie_data.get('overview')
        details['release_date'] = movie_data.get('release_date')

        # Build image URLs
        if movie_data.get('poster_path'):
            details['poster_url'] = f"https://image.tmdb.org/t/p/w500{movie_data['poster_path']}"
        if movie_data.get('backdrop_path'):
            details['backdrop_url'] = f"https://image.tmdb.org/t/p/original{movie_data['backdrop_path']}"

        time.sleep(REQUEST_DELAY)  # Rate limiting

        # Get videos (trailers)
        videos_response = requests.get(videos_url, params=params, timeout=10)
        videos_response.raise_for_status()
        videos_data = videos_response.json()

        # Find official trailer (prefer YouTube)
        for video in videos_data.get('results', []):
            if video['site'] == 'YouTube' and video['type'] in ['Trailer', 'Teaser']:
                details['trailer_url'] = f"https://www.youtube.com/watch?v={video['key']}"
                break

        time.sleep(REQUEST_DELAY)  # Rate limiting

        # Get credits (director and cast)
        credits_url = CREDITS_ENDPOINT.format(movie_id=movie_id)
        credits_response = requests.get(credits_url, params=params, timeout=10)
        credits_response.raise_for_status()
        credits_data = credits_response.json()

        # Extract director from crew
        crew = credits_data.get('crew', [])
        for member in crew:
            if member.get('job') == 'Director':
                details['director'] = member.get('name')
                break

        # Extract top 3 cast members
        cast = credits_data.get('cast', [])
        details['cast'] = [actor.get('name') for actor in cast[:3] if actor.get('name')]

        return details

    except Exception as e:
        print(f"  ERROR fetching movie details: {e}")
        return details


def check_film_availability(title: str, year: Optional[str] = None, suggested_by: str = '', notes: str = '') -> Dict:
    """Check availability for a single film"""
    print(f"Checking: {title}" + (f" ({year})" if year else ""))

    result = {
        'title': title,
        'year': year or 'N/A',
        'suggested_by': suggested_by,
        'notes': notes,
        'tmdb_id': None,
        'not_found_on_tmdb': False,
        'availability': {}  # Will hold providers for each country
    }

    # Search for film
    movie_id = search_film(title, year)
    if not movie_id:
        result['not_found_on_tmdb'] = True
        print(f"  Skipping - not found on TMDb")
        return result

    result['tmdb_id'] = movie_id

    # Small delay to respect rate limits
    time.sleep(REQUEST_DELAY)

    # Get movie details (rating, poster, trailer, etc.)
    details = get_movie_details(movie_id)
    result.update(details)

    # Small delay to respect rate limits
    time.sleep(REQUEST_DELAY)

    # Get watch providers for all countries
    availability = get_watch_providers(movie_id)
    result['availability'] = availability

    # Print availability summary for configured countries
    for country_code in COUNTRIES:
        country_avail = availability.get(country_code, {})
        providers = country_avail.get('providers', [])
        if providers:
            print(f"  {country_code}: {', '.join(providers)}")
            if country_avail.get('prime'):
                print(f"    ✓ Available on Prime Video in {country_code}!")

    return result


def main():
    """Main execution function"""
    print("=" * 60)
    print("Film Availability Checker")
    print("=" * 60)

    # Validate configuration
    validate_config()

    # Fetch films from sheet
    films = fetch_films_from_sheet()

    if not films:
        print("No films found in sheet")
        sys.exit(0)

    print("\nStarting availability checks...")
    print("-" * 60)

    # Check each film
    results = []
    for film in films:
        title = film.get('title', '').strip()
        year = film.get('year', '').strip()
        suggested_by = film.get('suggested_by', '').strip()
        notes = film.get('notes', '').strip()

        if not title:
            continue

        result = check_film_availability(title, year if year else None, suggested_by, notes)
        results.append(result)
        print()  # Blank line between films

    # Save detailed results as JSON
    with open('results.json', 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Saved detailed results to results.json")

    # Create summary CSV (using GB as default for backward compatibility)
    with open('results_summary.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Title', 'Year', 'TMDb ID', 'Prime (GB)', 'Free Any (GB)', 'Providers (GB)'])

        for r in results:
            gb_data = r.get('availability', {}).get('GB', {})
            writer.writerow([
                r['title'],
                r['year'],
                r['tmdb_id'] or 'Not Found',
                'Yes' if gb_data.get('prime', False) else 'No',
                'Yes' if gb_data.get('free_any', False) else 'No',
                ', '.join(gb_data.get('providers', [])) if gb_data.get('providers') else 'None'
            ])

    print(f"Saved summary to results_summary.csv")

    # Print summary statistics for all countries
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    total = len(results)
    found = sum(1 for r in results if r['tmdb_id'])

    print(f"Total films checked: {total}")
    print(f"Found on TMDb: {found}")

    # Print stats for each country
    for country_code in COUNTRIES:
        prime_count = sum(1 for r in results if r.get('availability', {}).get(country_code, {}).get('prime', False))
        free_count = sum(1 for r in results if r.get('availability', {}).get(country_code, {}).get('free_any', False))
        print(f"\n{country_code}:")
        print(f"  Available on Prime: {prime_count}")
        print(f"  Available free anywhere: {free_count}")

    print("=" * 60)


if __name__ == '__main__':
    main()
