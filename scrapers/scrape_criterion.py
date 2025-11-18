#!/usr/bin/env python3
"""
Criterion Collection Scraper
Loads Criterion Collection films from seed data
Outputs raw film list with title, year, and Criterion metadata

Note: This uses a curated seed list of ~50 notable Criterion films for POC.
For a complete list, scrape from criterion.com or use a complete JSON source.
"""

import os
import sys
import json

# Seed data path
SEED_DATA_PATH = os.path.join(os.path.dirname(__file__), 'criterion_seed_data.json')


def load_criterion_seed_data() -> list:
    """
    Load Criterion Collection films from seed data JSON file
    Returns list of films with title, year, and spine number
    """
    films = []

    print(f"Loading Criterion Collection seed data...")

    try:
        with open(SEED_DATA_PATH, 'r') as f:
            seed_data = json.load(f)

        for item in seed_data:
            film = {
                'title': item['title'],
                'year': item['year'],
                'collection': 'Criterion',
                'collection_meta': {
                    'spine_number': item['spine'],
                    'director': item['director']
                }
            }
            films.append(film)

        print(f"  Loaded {len(films)} films from seed data")
        return films

    except Exception as e:
        print(f"  ERROR loading seed data: {e}")
        return []


def main():
    """Main execution function"""
    print("=" * 60)
    print("Criterion Collection Scraper (POC)")
    print("=" * 60)

    # Load Criterion films from seed data
    films = load_criterion_seed_data()

    if not films:
        print("No films found")
        sys.exit(0)

    # Sort by spine number (convert to int for proper sorting)
    films.sort(key=lambda x: int(x['collection_meta']['spine_number']) if x['collection_meta']['spine_number'] and x['collection_meta']['spine_number'].isdigit() else 9999)

    # Save raw results
    output_file = 'criterion_raw.json'
    with open(output_file, 'w') as f:
        json.dump(films, f, indent=2)

    print(f"\nSaved {len(films)} films to {output_file}")

    # Print sample
    print("\nSample films (first 10 by spine number):")
    for film in films[:10]:
        spine = film['collection_meta']['spine_number']
        print(f"  #{spine:>4} - {film['title']} ({film['year']}) - {film['collection_meta']['director']}")

    print(f"\nLast film by spine number:")
    if films:
        last_film = films[-1]
        spine = last_film['collection_meta']['spine_number']
        print(f"  #{spine:>4} - {last_film['title']} ({last_film['year']}) - {last_film['collection_meta']['director']}")

    print("\n" + "=" * 60)
    print("Next step: Run enrich_collection.py to add TMDb metadata")
    print("  (streaming availability, posters, ratings, trailers, etc.)")
    print("\nNote: This POC uses ~50 notable Criterion films.")
    print("For complete catalog, expand criterion_seed_data.json or use")
    print("alternative scraping methods.")
    print("=" * 60)


if __name__ == '__main__':
    main()
