#!/usr/bin/env python3
"""
AFI Top 100 Scraper
Loads AFI's 100 Greatest American Films (2007 edition) from seed data
Outputs raw film list with title, year, and AFI metadata
"""

import os
import sys
import json

# Seed data path
SEED_DATA_PATH = os.path.join(os.path.dirname(__file__), 'afi_seed_data.json')


def load_afi_seed_data() -> list:
    """
    Load AFI Top 100 films from seed data JSON file
    Returns list of films with title, year, and rank
    """
    films = []

    print(f"Loading AFI Top 100 seed data...")

    try:
        with open(SEED_DATA_PATH, 'r') as f:
            seed_data = json.load(f)

        for item in seed_data:
            film = {
                'title': item['title'],
                'year': item['year'],
                'collection': 'AFI',
                'collection_meta': {
                    'rank': item['rank'],
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
    print("AFI Top 100 Scraper (2007 Edition)")
    print("=" * 60)

    # Load AFI films from seed data
    films = load_afi_seed_data()

    if not films:
        print("No films found")
        sys.exit(0)

    # Films are already sorted by rank in seed data

    # Save raw results
    output_file = 'afi_raw.json'
    with open(output_file, 'w') as f:
        json.dump(films, f, indent=2)

    print(f"\nSaved {len(films)} films to {output_file}")

    # Print sample
    print("\nSample films (top 10):")
    for film in films[:10]:
        rank = film['collection_meta']['rank']
        print(f"  #{rank:>3} - {film['title']} ({film['year']}) - {film['collection_meta']['director']}")

    print(f"\nLast film:")
    if films:
        last_film = films[-1]
        rank = last_film['collection_meta']['rank']
        print(f"  #{rank:>3} - {last_film['title']} ({last_film['year']}) - {last_film['collection_meta']['director']}")

    print("\n" + "=" * 60)
    print("Next step: Run enrich_collection.py to add TMDb metadata")
    print("  python3 enrich_collection.py afi_raw.json afi_enriched.json")
    print("=" * 60)


if __name__ == '__main__':
    main()
