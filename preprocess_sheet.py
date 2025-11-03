#!/usr/bin/env python3
"""
Film Data Preprocessor
Cleans raw film list data and extracts structured information
"""

import csv
import os
import sys
import re
import requests
from typing import Dict, Optional, Tuple


def extract_year(text: str) -> Optional[str]:
    """Extract year in format (YYYY) or at start of text"""
    # Look for 4-digit year in parentheses
    year_match = re.search(r'\((\d{4})\)', text)
    if year_match:
        return year_match.group(1)

    # Look for 4-digit year at the start of text (like "1994 (15th) Schindler's List")
    start_year_match = re.match(r'^(\d{4})\s', text)
    if start_year_match:
        return start_year_match.group(1)

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
        # Remove year in parentheses
        text = re.sub(r'\s*\(\d{4}\)\s*', ' ', text)
        # Remove year at start of text (e.g., "1994 (15th) Title" -> "(15th) Title")
        text = re.sub(r'^\d{4}\s+', '', text)

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


def fetch_raw_data(input_source: str) -> list:
    """
    Fetch raw CSV data from URL or local file
    Returns list of dictionaries
    """
    if input_source.startswith('http://') or input_source.startswith('https://'):
        # Fetch from URL
        print(f"Fetching from URL: {input_source[:60]}...")
        response = requests.get(input_source, timeout=10)
        response.raise_for_status()
        lines = response.text.splitlines()
        reader = csv.DictReader(lines)
        return list(reader)
    else:
        # Read from local file
        print(f"Reading from local file: {input_source}")
        with open(input_source, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)


def preprocess_data(raw_data: list, output_path: str):
    """
    Process the raw film list CSV and create cleaned version
    """
    processed_rows = []

    for row in raw_data:
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
    # Get input source from environment variable or use local file
    sheet_url = os.environ.get('SHEET_CSV_URL')
    if sheet_url:
        input_source = sheet_url
    else:
        # Fallback to local file for testing
        input_source = '/Users/marvinbarretto/Desktop/_The List_ - Sheet1 (1).csv'

    output_file = 'films_cleaned.csv'  # Output to current directory

    print("=" * 70)
    print("Film Data Preprocessor")
    print("=" * 70)

    try:
        # Fetch raw data
        raw_data = fetch_raw_data(input_source)
        print(f"Found {len(raw_data)} entries in source\n")

        # Process and save cleaned data
        preprocess_data(raw_data, output_file)

        print("\n" + "=" * 70)
        print("Done! Your cleaned data is ready.")
        print("=" * 70)
    except Exception as e:
        print(f"\nERROR: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
