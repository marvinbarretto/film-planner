#!/usr/bin/env python3
"""
Collection Enrichment Script
Takes raw collection data and enriches with TMDb metadata:
- Streaming availability (all countries)
- TMDb ratings, runtime, genres
- Poster and backdrop images
- Trailers
- Director and cast
"""

import os
import sys
import json
import time
import argparse
from typing import Dict, List, Optional
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'
REQUEST_DELAY = 0.3  # 300ms between requests

# Countries to fetch provider data for
COUNTRIES = ['GB', 'US', 'CA', 'AU', 'NZ']


def validate_config():
    """Validate required configuration is present"""
    if not TMDB_API_KEY:
        print("ERROR: TMDB_API_KEY environment variable not set")
        sys.exit(1)
    print("Configuration validated")


def search_film(title: str, year: Optional[str] = None) -> Optional[Dict]:
    """Search for film on TMDb and return movie data"""
    params = {
        'api_key': TMDB_API_KEY,
        'query': title,
        'language': 'en-US'
    }

    if year:
        params['year'] = year

    try:
        response = requests.get(f'{TMDB_BASE_URL}/search/movie', params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data['results']:
            movie = data['results'][0]
            print(f"  Found on TMDb: {movie['title']} ({movie.get('release_date', 'N/A')[:4]})")
            return movie
        else:
            print(f"  Not found on TMDb: {title}")
            return None
    except Exception as e:
        print(f"  ERROR searching for {title}: {e}")
        return None


def get_watch_providers(movie_id: int) -> Dict:
    """Get streaming providers for all configured countries"""
    url = f'{TMDB_BASE_URL}/movie/{movie_id}/watch/providers'
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
        return {country: {'providers': [], 'prime': False, 'free_any': False} for country in COUNTRIES}


def get_movie_details(movie_id: int) -> Dict:
    """Get additional movie details including trailer, poster, rating, etc."""
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
        movie_url = f'{TMDB_BASE_URL}/movie/{movie_id}'
        params = {'api_key': TMDB_API_KEY, 'language': 'en-US'}

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

        time.sleep(REQUEST_DELAY)

        # Get videos (trailers)
        videos_url = f'{TMDB_BASE_URL}/movie/{movie_id}/videos'
        videos_response = requests.get(videos_url, params=params, timeout=10)
        videos_response.raise_for_status()
        videos_data = videos_response.json()

        # Find official trailer (prefer YouTube)
        for video in videos_data.get('results', []):
            if video['site'] == 'YouTube' and video['type'] in ['Trailer', 'Teaser']:
                details['trailer_url'] = f"https://www.youtube.com/watch?v={video['key']}"
                break

        time.sleep(REQUEST_DELAY)

        # Get credits (director and cast)
        credits_url = f'{TMDB_BASE_URL}/movie/{movie_id}/credits'
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


def enrich_film(film: Dict) -> Dict:
    """Enrich a single film with TMDb data"""
    title = film['title']
    year = film.get('year')

    print(f"\nEnriching: {title}" + (f" ({year})" if year else ""))

    enriched = film.copy()
    enriched['tmdb_id'] = None
    enriched['not_found_on_tmdb'] = False
    enriched['availability'] = {}

    # Search for film
    movie_data = search_film(title, year if year else None)
    if not movie_data:
        enriched['not_found_on_tmdb'] = True
        return enriched

    movie_id = movie_data['id']
    enriched['tmdb_id'] = movie_id

    time.sleep(REQUEST_DELAY)

    # Get movie details
    details = get_movie_details(movie_id)

    # Merge TMDb data with collection data
    # If director exists from collection, keep it (may be more accurate for Criterion)
    if not enriched['collection_meta'].get('director'):
        enriched['collection_meta']['director'] = details.get('director')

    enriched.update({
        'tmdb_rating': details['tmdb_rating'],
        'runtime': details['runtime'],
        'genres': details['genres'],
        'poster_url': details['poster_url'],
        'backdrop_url': details['backdrop_url'],
        'trailer_url': details['trailer_url'],
        'overview': details['overview'],
        'release_date': details['release_date'],
        'cast': details['cast']
    })

    time.sleep(REQUEST_DELAY)

    # Get watch providers for all countries
    availability = get_watch_providers(movie_id)
    enriched['availability'] = availability

    # Print summary
    for country_code in COUNTRIES:
        country_avail = availability.get(country_code, {})
        providers = country_avail.get('providers', [])
        if providers:
            print(f"  {country_code}: {', '.join(providers)}")

    return enriched


def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description='Enrich collection films with TMDb metadata')
    parser.add_argument('--input', default='criterion_raw.json', help='Input JSON file (default: criterion_raw.json)')
    parser.add_argument('--output', default=None, help='Output JSON file (default: [collection]_enriched.json)')
    args = parser.parse_args()

    print("=" * 60)
    print("Collection Enrichment Script")
    print("=" * 60)

    # Validate configuration
    validate_config()

    # Load raw collection data
    try:
        with open(args.input, 'r') as f:
            films = json.load(f)
        print(f"\nLoaded {len(films)} films from {args.input}")
    except Exception as e:
        print(f"ERROR loading input file: {e}")
        sys.exit(1)

    print("\nStarting enrichment process...")
    print("-" * 60)

    # Enrich each film
    enriched_films = []
    for i, film in enumerate(films):
        print(f"\n[{i+1}/{len(films)}]", end=" ")
        enriched = enrich_film(film)
        enriched_films.append(enriched)

    # Determine output filename
    if args.output:
        output_file = args.output
    else:
        collection_name = films[0].get('collection', 'collection').lower()
        output_file = f'{collection_name}_enriched.json'

    # Save enriched results
    with open(output_file, 'w') as f:
        json.dump(enriched_films, f, indent=2)

    print("\n" + "=" * 60)
    print(f"Saved enriched data to {output_file}")

    # Print summary statistics
    total = len(enriched_films)
    found = sum(1 for f in enriched_films if f['tmdb_id'])

    print(f"\nTotal films: {total}")
    print(f"Found on TMDb: {found}")
    print(f"Not found: {total - found}")

    # Print availability stats for each country
    for country_code in COUNTRIES:
        prime_count = sum(1 for f in enriched_films if f.get('availability', {}).get(country_code, {}).get('prime', False))
        free_count = sum(1 for f in enriched_films if f.get('availability', {}).get(country_code, {}).get('free_any', False))
        print(f"\n{country_code}:")
        print(f"  Available on Prime: {prime_count}")
        print(f"  Available free anywhere: {free_count}")

    print("\n" + "=" * 60)
    print("Next step: Copy enriched data to film-ui/src/data/collections/")
    print("=" * 60)


if __name__ == '__main__':
    main()
