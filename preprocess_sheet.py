#!/usr/bin/env python3
"""
Film Data Preprocessor
Cleans raw film list data and extracts structured information
"""

import csv
import re
from typing import Dict, Optional, Tuple


def extract_year(text: str) -> Optional[str]:
    """Extract year in format (YYYY) from text"""
    # Look for 4-digit year in parentheses
    year_match = re.search(r'\((\d{4})\)', text)
    if year_match:
        return year_match.group(1)
    return None


def remove_prefix(title: str) -> str:
    """Remove common prefixes from title"""
    prefixes = [
        'FILM : DOCU:',
        'FILM: DOCU:',
        'TV series:',
        'TV SERIES:',
        'FILM :',
        'FILM:',
        'TV:',
        'Film:',
        'TV :',
    ]

    title_clean = title.strip()
    for prefix in prefixes:
        if title_clean.upper().startswith(prefix.upper()):
            title_clean = title_clean[len(prefix):].strip()
            break

    return title_clean


def extract_clean_title(raw_title: str) -> Tuple[str, Optional[str], str]:
    """
    Extract clean title, year, and notes from raw title field

    Returns:
        Tuple of (clean_title, year, notes)
    """
    # Remove prefix
    text = remove_prefix(raw_title)

    # Extract year first (before we remove all parentheses)
    year = extract_year(text)

    # Collect all notes components
    notes_parts = []

    # Remove year from text and save it separately
    if year:
        text = re.sub(r'\s*\(\d{4}\)\s*', ' ', text)

    # Extract ALL remaining parenthetical content and add to notes
    # This handles multiple sets of parentheses
    while True:
        paren_match = re.search(r'\s*\(([^)]+)\)\s*', text)
        if paren_match:
            parenthetical_content = paren_match.group(1).strip()
            if parenthetical_content:
                notes_parts.append(f"({parenthetical_content})")
            # Remove this parenthetical from text
            text = text[:paren_match.start()] + ' ' + text[paren_match.end():]
        else:
            break

    # Find where the actual title ends and notes begin
    # Common patterns that indicate notes:
    # - comma followed by lowercase word or name
    # - dash followed by descriptive text
    # - URLs

    title_end = len(text)
    notes_start = len(text)

    # Look for URLs (notes definitely start here)
    url_match = re.search(r'(https?://|www\.)', text)
    if url_match:
        title_end = min(title_end, url_match.start())
        notes_start = url_match.start()

    # Look for comma followed by descriptive text
    # Pattern: ", [lowercase word or description]"
    comma_pattern = re.search(r',\s+(?:[a-z]|recommended|film|recom|Amazon|Netflix|IMDb)', text)
    if comma_pattern:
        title_end = min(title_end, comma_pattern.start())
        notes_start = comma_pattern.start()

    # Look for dash followed by descriptive text
    # Pattern: " - [description]"
    # But avoid removing if it's part of the actual title (tricky!)
    dash_pattern = re.search(r'\s+-\s+(?:[a-z]|[A-Z]{2}|recommended|film|precursor|political|https|www|IMDb)', text)
    if dash_pattern:
        title_end = min(title_end, dash_pattern.start())
        notes_start = dash_pattern.start()

    # Extract clean title
    clean_title = text[:title_end].strip()

    # Add remaining text to notes
    remaining_text = text[notes_start:].strip()
    if remaining_text:
        notes_parts.append(remaining_text)

    # Combine all notes
    notes = ' '.join(notes_parts)

    # Remove trailing punctuation from title
    clean_title = clean_title.rstrip(' ,-')

    # Clean up multiple spaces
    clean_title = ' '.join(clean_title.split())

    # Normalize title capitalization (Title Case)
    # But preserve acronyms and special cases
    if clean_title and not clean_title.isupper():
        # Simple title case
        words = clean_title.split()
        clean_title = ' '.join(word.capitalize() if len(word) > 2 else word.lower()
                               for word in words)

    return clean_title, year, notes


def preprocess_file(input_path: str, output_path: str):
    """
    Process the raw film list CSV and create cleaned version
    """
    print(f"Reading from: {input_path}")

    processed_rows = []

    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            raw_title = row.get('Film title', '').strip()
            suggested_by = row.get('Suggested by', '').strip()

            if not raw_title:
                continue

            # Extract structured data
            clean_title, year, notes = extract_clean_title(raw_title)

            # Combine notes from title field with suggested_by context
            all_notes = notes
            if suggested_by and suggested_by not in notes:
                if all_notes:
                    all_notes = f"{all_notes} | Suggested by: {suggested_by}"
                else:
                    all_notes = f"Suggested by: {suggested_by}"

            processed_rows.append({
                'title': clean_title,
                'year': year or '',
                'suggested_by': suggested_by,
                'notes': all_notes
            })

            # Print progress
            print(f"✓ {raw_title[:50]:<50} → {clean_title}")

    # Write cleaned data
    print(f"\nWriting cleaned data to: {output_path}")

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['title', 'year', 'suggested_by', 'notes']
        writer = csv.DictWriter(f, fieldnames=fieldnames)

        writer.writeheader()
        writer.writerows(processed_rows)

    print(f"\n✓ Processed {len(processed_rows)} entries")
    print(f"✓ Cleaned file saved to: {output_path}")

    # Print some statistics
    with_year = sum(1 for row in processed_rows if row['year'])
    with_notes = sum(1 for row in processed_rows if row['notes'])

    print(f"\nStatistics:")
    print(f"  Total entries: {len(processed_rows)}")
    print(f"  Entries with year: {with_year}")
    print(f"  Entries with notes: {with_notes}")


def main():
    """Main execution"""
    input_file = '/Users/marvinbarretto/Desktop/_The List_ - Sheet1.csv'
    output_file = '/Users/marvinbarretto/development/film-planner/films_cleaned.csv'

    print("=" * 70)
    print("Film Data Preprocessor")
    print("=" * 70)

    preprocess_file(input_file, output_file)

    print("\n" + "=" * 70)
    print("Done! Your cleaned data is ready.")
    print("=" * 70)


if __name__ == '__main__':
    main()
