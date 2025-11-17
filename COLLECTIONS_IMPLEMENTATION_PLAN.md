# Film Collections Feature - Complete Implementation Plan

## Vision
Add curated film collections (Criterion, AFI, Sight & Sound, etc.) as **optional toggleable data sources** alongside the personal Google Sheet watchlist. Users control "pollution level" - default shows only personal list, can optionally blend in collections for discovery.

---

## Phase 1: Proof of Concept - Criterion Collection

### Step 1: Data Collection & Preparation

**1.1 Scrape Criterion Collection**
- Source: Criterion website or TMDb Criterion keyword
- Required fields:
  - `title` (string)
  - `year` (string)
  - `collection: "Criterion"` (string)
  - `spine_number` (string) - Criterion's catalog number
  - `director` (string)
  - `country` (string)
- Output: `film-ui/src/data/collections/criterion.json`
- Format: Array of film objects matching personal list schema

**1.2 Run Through TMDb Enrichment**
- Create script: `enrich_collection.py`
- Input: `criterion.json` (title/year only)
- Process: Same as `check_availability.py` - fetch TMDb data, streaming providers, ratings, posters
- Output: `criterion_enriched.json` with full availability data for all countries (GB, US, CA, AU, NZ)

**1.3 Schema Standardization**
Ensure collection films match personal list schema:
```javascript
{
  title: "Seven Samurai",
  year: "1954",
  collection: "Criterion",
  collection_meta: {
    spine_number: "2",
    director: "Akira Kurosawa"
  },
  suggested_by: null, // Collections don't have this
  notes: null,

  // TMDb enrichment (same as personal list)
  tmdb_id: 548,
  tmdb_rating: 8.5,
  runtime: 207,
  genres: ["Action", "Drama"],
  poster_url: "...",
  backdrop_url: "...",
  trailer_url: "...",
  availability: {
    GB: { providers: ["..."], prime: false, free_any: true },
    // ... other countries
  }
}
```

---

### Step 2: UI - Collections Toggle

**2.1 Update App.jsx State**
```javascript
const [selectedCollections, setSelectedCollections] = useState(['personal'])
const [collectionData, setCollectionData] = useState({})
```

**2.2 Load Collections on Demand**
```javascript
useEffect(() => {
  selectedCollections.forEach(async (collection) => {
    if (collection !== 'personal' && !collectionData[collection]) {
      const data = await import(`@data/collections/${collection}.json`)
      setCollectionData(prev => ({ ...prev, [collection]: data.default }))
    }
  })
}, [selectedCollections])
```

**2.3 Merge Films**
```javascript
const allFilms = useMemo(() => {
  const personal = films // from Google Sheet
  const collections = selectedCollections
    .filter(c => c !== 'personal')
    .flatMap(c => collectionData[c] || [])

  return [...personal, ...collections]
}, [films, selectedCollections, collectionData])
```

**2.4 Update Stats Display**
```html
<p>
  {filteredFilms.length} of {allFilms.length} films
  • {realPrimeCount} on Prime
  • {freeCount} free ({selectedCountry})
  {selectedCollections.length > 1 && (
    <span> • {selectedCollections.join(' + ')}</span>
  )}
</p>
```

---

### Step 3: FilterBar - Collections Section

**3.1 Add Collections UI**
Create new section in FilterBar.jsx:
```jsx
<div className={styles.collectionsSection}>
  <h4 className={styles.sectionTitle}>Collections</h4>
  <div className={styles.collectionChips}>
    <button
      className={`${styles.collectionChip} ${styles.personal} ${styles.active}`}
      disabled
      title="Your personal watchlist (always shown)"
    >
      Personal
    </button>

    <button
      className={`${styles.collectionChip} ${selectedCollections.includes('criterion') ? styles.active : ''}`}
      onClick={() => handleCollectionToggle('criterion')}
    >
      Criterion Collection
    </button>
  </div>
</div>
```

**3.2 Add Styling (FilterBar.module.scss)**
```scss
.collectionsSection {
  width: 100%;
  margin-top: var(--spacing-2xl);

  h4 {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.collectionChips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.collectionChip {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--background);
  border: none;
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: var(--accent-lavender-bg);
    color: var(--text-primary);
  }

  &.active {
    background: var(--primary);
    color: var(--background);
  }

  &.personal {
    font-weight: 600;
    cursor: default;
    opacity: 1;
  }

  &:disabled {
    cursor: default;
  }
}
```

---

### Step 4: Update Suggested By Filter

**4.1 Derive Unique Sources**
Update `allSuggestedBy` computation in App.jsx:
```javascript
const allSuggestedBy = useMemo(() => {
  const sourceSet = new Set()
  allFilms.forEach(film => {
    if (film.suggested_by) {
      sourceSet.add(film.suggested_by)
    } else if (film.collection) {
      sourceSet.add(`Collection: ${film.collection}`)
    }
  })
  return Array.from(sourceSet).sort()
}, [allFilms])
```

**4.2 Update Filtering Logic**
```javascript
// Suggested By filter (now handles collections too)
if (filters.selectedSuggestedBy.length > 0) {
  const filmSource = film.suggested_by || (film.collection ? `Collection: ${film.collection}` : null)
  if (!filters.selectedSuggestedBy.includes(filmSource)) {
    return false
  }
}
```

---

### Step 5: FilmCard - Show Collection Source

**5.1 Update FilmCard.jsx**
Display collection info when `suggested_by` is null:
```jsx
{film.suggested_by ? (
  <div className={styles.suggestedBy}>
    <span className={styles.icon}>👤</span>
    {film.suggested_by}
  </div>
) : film.collection && (
  <div className={styles.collectionBadge}>
    <span className={styles.icon}>📚</span>
    {film.collection}
    {film.collection_meta?.spine_number && ` #${film.collection_meta.spine_number}`}
  </div>
)}
```

**5.2 Add Styling**
```scss
.collectionBadge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.8;
  white-space: nowrap;

  .icon {
    font-size: 0.7rem;
    opacity: 0.7;
  }
}
```

---

## Phase 2: Additional Collections (After POC Success)

### Collections to Add
1. **AFI Top 100** (~100 films)
2. **Sight & Sound Top 250** (~250 films)
3. **Cannes Palme d'Or Winners** (~75 films)
4. **Sundance Grand Jury Prize** (~40 films)
5. **MUBI Top 1000** (if accessible)
6. **BFI Top 100 British Films**
7. **Roger Ebert Great Movies** (~400 films)

### Implementation Pattern (Repeatable)
For each collection:
1. Create scraper script: `scrapers/scrape_[collection].py`
2. Output raw list: `data/raw/[collection]_raw.json`
3. Run enrichment: `python enrich_collection.py --source [collection]`
4. Output to: `film-ui/src/data/collections/[collection].json`
5. Add toggle button to FilterBar
6. Add to `handleCollectionToggle` logic

---

## Appendix A: Complete Data Sources Directory

This section catalogs 30+ curated film collection sources, prioritized for **art house/independent** and **international cinema**. Use this as a menu of options when expanding beyond the Criterion POC.

### Priority Levels
- **P1** (Must-Have): Core collections for art house focus
- **P2** (Should-Have): Strong additions for discovery
- **P3** (Nice-to-Have): Supplementary collections

---

### Art House & Independent Cinema (P1)

| Collection | Size | Update | Art House | Notes |
|------------|------|--------|-----------|-------|
| **Criterion Collection** | ~1,600 | Annual | ✓ | Gold standard for art house, already in POC |
| **A24 Films Catalog** | ~150 | Ongoing | ✓ | Modern American independent |
| **IFC Films Catalog** | ~500 | Ongoing | ✓ | Independent & foreign distribution |
| **Neon Films Catalog** | ~50 | Ongoing | ✓ | Boutique distributor (Parasite, Portrait of a Lady) |
| **MUBI Top 1000** | ~1,000 | Annual | ✓ | Curated art house streaming |
| **Sundance Film Festival Archives** | ~400 | Annual | ✓ | Indie focus, Grand Jury + Audience winners |
| **Tribeca Film Festival Winners** | ~100 | Annual | Mixed | Documentary-heavy indie |

---

### International Cinema by Region (P1)

| Collection | Size | Update | Art House | Notes |
|------------|------|--------|-----------|-------|
| **French New Wave Essentials** | ~100 | Static | ✓ | Godard, Truffaut, Resnais, Varda |
| **Italian Neorealism Classics** | ~50 | Static | ✓ | Rossellini, De Sica, Visconti |
| **Japanese Cinema Masters** | ~200 | Static | ✓ | Kurosawa, Ozu, Mizoguchi, Naruse |
| **Korean New Wave & Contemporary** | ~150 | Ongoing | ✓ | Hong Sang-soo, Park Chan-wook, Bong Joon-ho |
| **Iranian Cinema** | ~75 | Ongoing | ✓ | Kiarostami, Farhadi, Panahi, Makhmalbaf |
| **Latin American Cinema** | ~100 | Static | ✓ | Mexico, Argentina, Brazil classics |
| **African Cinema Essentials** | ~50 | Static | ✓ | Sembène, Sissako, Bekolo |
| **Eastern European Art Cinema** | ~100 | Static | ✓ | Poland, Czech, Hungary, Romania |
| **German New Wave** | ~75 | Static | ✓ | Fassbinder, Herzog, Wenders |
| **Spanish Cinema Masters** | ~80 | Static | ✓ | Almodóvar, Buñuel, Erice |

---

### Film Festival Winners & Selections (P2)

| Collection | Size | Update | Art House | Notes |
|------------|------|--------|-----------|-------|
| **Cannes Palme d'Or Winners** | ~75 | Annual | ✓ | Most prestigious film prize |
| **Venice Golden Lion Winners** | ~80 | Annual | ✓ | Second-oldest festival |
| **Berlin Golden Bear Winners** | ~75 | Annual | ✓ | Political/social focus |
| **Sundance Grand Jury Prize** | ~40 | Annual | ✓ | American independent |
| **Toronto TIFF People's Choice** | ~50 | Annual | Mixed | Oscar predictor |
| **Locarno Golden Leopard** | ~70 | Annual | ✓ | Auteur discovery |
| **Rotterdam Tiger Awards** | ~50 | Annual | ✓ | Experimental/avant-garde |
| **Busan New Currents** | ~30 | Annual | ✓ | Asian cinema focus |
| **Karlovy Vary Crystal Globe** | ~60 | Annual | Mixed | Central/Eastern European |

---

### Critics' Lists & Rankings (P2)

| Collection | Size | Update | Art House | Notes |
|------------|------|--------|-----------|-------|
| **Sight & Sound Top 250** | 250 | Decade | ✓ | 2022 critics + directors poll |
| **Roger Ebert Great Movies** | ~400 | Static | Mixed | Accessible canon |
| **BFI Top 100 British Films** | 100 | Static | Mixed | National cinema |
| **AFI Top 100 American Films** | 100 | Static | Mixed | Hollywood-centric |
| **Metacritic Top by Decade** | ~500 | Ongoing | Mixed | 2020s, 2010s, 2000s, etc. |
| **Letterboxd Official Top 250** | 250 | Annual | Mixed | Community-driven |
| **TSPDT Top 1000** | 1,000 | Annual | ✓ | Aggregated critics lists |
| **Cahiers du Cinéma Top 100** | 100 | Decade | ✓ | French critics perspective |

---

### National Film Archives (P3)

| Collection | Size | Update | Art House | Notes |
|------------|------|--------|-----------|-------|
| **National Film Registry (US)** | ~850 | Annual | Mixed | Library of Congress preservation |
| **BFI National Archive Highlights** | ~300 | Static | ✓ | British Film Institute |
| **Cinémathèque Française Collection** | ~200 | Static | ✓ | Essential French cinema |
| **Deutsche Kinemathek Classics** | ~150 | Static | ✓ | German film history |
| **NFDC India Archive** | ~100 | Static | Mixed | Parallel cinema movement |

---

### Streaming Service Curations (P3)

| Collection | Size | Update | Art House | Notes |
|------------|------|--------|-----------|-------|
| **MUBI Featured Collections** | ~200 | Monthly | ✓ | Rotating curated picks |
| **Criterion Channel Monthly** | ~100 | Monthly | ✓ | Thematic collections |
| **Kanopy Art House Collection** | ~500 | Ongoing | ✓ | Library streaming service |
| **FilmStruck Archive** | ~300 | Static | ✓ | Historical (service defunct) |

---

### Phased Rollout Strategy

**Phase 1 (POC):**
- Criterion Collection

**Phase 2 (Art House Core) - P1 Priority:**
- A24 Films
- MUBI Top 1000
- French New Wave Essentials
- Korean New Wave & Contemporary
- Iranian Cinema

**Phase 3 (International Expansion) - P1 Priority:**
- Japanese Cinema Masters
- Italian Neorealism
- Latin American Cinema
- Eastern European Art Cinema
- German New Wave

**Phase 4 (Festival Circuit) - P2 Priority:**
- Cannes Palme d'Or
- Venice Golden Lion
- Berlin Golden Bear
- Sundance Grand Jury
- Locarno Golden Leopard
- Rotterdam Tiger Awards

**Phase 5 (Critics & Archives) - P2 Priority:**
- Sight & Sound Top 250
- Roger Ebert Great Movies
- TSPDT Top 1000
- Letterboxd Official Top 250

**Phase 6 (Supplementary) - P3 Priority:**
- National Film Registry
- BFI Archive Highlights
- Streaming curations

---

### Implementation Notes

**For Scraper Development:**
- Start with collections that have structured data (Criterion spine numbers, festival year/award)
- Use TMDb keywords/collections when available (e.g., "Criterion Collection")
- Consider Wikipedia/Wikidata for historical lists (festival winners)
- Respect robots.txt and rate limits when scraping

**Data Quality:**
- Verify TMDb matching accuracy (especially for international films with multiple titles)
- Manual curation may be needed for smaller/niche collections
- Include original language titles for international films
- Document data sources in collection metadata

**Size Considerations:**
- Total across all collections: ~10,000-15,000 films
- Average enriched JSON size: ~0.3-0.5MB per 100 films
- With lazy loading, bundle impact is minimal (only loaded collections)

---

## Phase 3: Performance Optimizations

### Lazy Loading
```javascript
// Only load collection when toggled on
const loadCollection = async (name) => {
  if (!collectionData[name]) {
    setLoading(true)
    const module = await import(`@data/collections/${name}.json`)
    setCollectionData(prev => ({ ...prev, [name]: module.default }))
    setLoading(false)
  }
}
```

### Virtual Scrolling (If Needed)
If total films exceed ~5,000 with all collections:
- Implement react-window or react-virtualized for FilmGrid
- Only render visible cards
- Improves scroll performance dramatically

### Data Splitting
If bundle size gets too large:
- Split collections into separate chunks
- Use dynamic imports for each collection
- Vite will code-split automatically

---

## Phase 4: Advanced Features (Future)

### 4.1 Collection Metadata Display
- Show collection description when hovering chip
- Display total count: "Criterion (1,234 films)"
- Last updated date

### 4.2 Collection-Specific Filters
- Filter by spine number range (Criterion)
- Filter by decade within collection
- Sort by collection rank/order

### 4.3 "Save Collection Picks"
- Browse collection with it toggled on
- Star/bookmark films from collection
- "Add to Personal List" → appends to Google Sheet

### 4.4 Collection Discovery View
- Dedicated page: `/discover`
- Browse collections with bigger cards
- More visual, less compact than main list
- "Add to My List" button on each card

---

## Implementation Order (Recommended)

**Session 1: Data Prep (Python)**
1. Create `scrapers/scrape_criterion.py`
2. Scrape Criterion catalog to JSON
3. Create `enrich_collection.py` (reuse check_availability.py logic)
4. Generate `film-ui/src/data/collections/criterion.json`

**Session 2: Core Integration (React)**
1. Update App.jsx: Add collection state & merging logic
2. Update filtering to handle collections
3. Update stats display
4. Test with hardcoded Criterion data

**Session 3: UI Implementation**
1. Add Collections section to FilterBar
2. Add toggle interaction
3. Update FilmCard to show collection badge
4. Style collection chips with pastel theme

**Session 4: Polish & Testing**
1. Test with all filters combined
2. Verify performance with 1,600+ films
3. Edge case handling (no collections, all collections)
4. Update README/documentation

**Session 5: Add More Collections**
1. Repeat scraper pattern for AFI, Sight & Sound
2. Add toggles for new collections
3. Test with multiple collections enabled

---

## Files to Create

### New Files
```
film-ui/src/data/collections/
  criterion.json
  afi_top100.json
  sight_and_sound.json

scrapers/
  scrape_criterion.py
  scrape_afi.py
  scrape_sight_and_sound.py
  enrich_collection.py
```

### Files to Modify
```
film-ui/src/App.jsx
  - Add selectedCollections state
  - Add collection loading logic
  - Merge films from multiple sources
  - Update filtering logic
  - Update stats display

film-ui/src/components/FilterBar/FilterBar.jsx
  - Add Collections section UI
  - Add handleCollectionToggle
  - Pass collections state to parent

film-ui/src/components/FilterBar/FilterBar.module.scss
  - Add .collectionsSection styles
  - Add .collectionChip styles

film-ui/src/components/FilmCard/FilmCard.jsx
  - Add collection badge display
  - Handle collection metadata

film-ui/src/components/FilmCard/FilmCard.module.scss
  - Add .collectionBadge styles
```

---

## Success Metrics

**Phase 1 POC Complete When:**
- ✅ Criterion collection loads on toggle
- ✅ Films merge correctly with personal list
- ✅ Filtering works across both sources
- ✅ Collection chips styled with pastel theme
- ✅ Performance acceptable with 1,600+ films
- ✅ Personal list is default (Criterion opt-in)

**Full Feature Complete When:**
- ✅ 5+ collections available
- ✅ User can toggle any combination
- ✅ Suggested By filter shows collections
- ✅ FilmCard shows collection source
- ✅ Stats reflect active collections
- ✅ Documentation updated

---

## Technical Considerations

### Data Size
- Personal list: ~50KB
- Criterion enriched: ~500KB (with posters/availability)
- All 5 collections: ~2-3MB
- **Solution:** Lazy loading, only load when toggled

### Deduplication
- Same film may appear in multiple collections
- **Decision:** Show duplicates (user sees it's in both)
- Alternative: Dedupe by tmdb_id, combine collection tags

### Google Sheet Pollution
- Collections do NOT touch Google Sheet
- Sheet remains authoritative for "Personal"
- "Add to List" feature (future) would append to Sheet

### Country Availability
- Collections use same multi-country data structure
- Country selector works identically
- Availability checked for all 5 countries (GB, US, CA, AU, NZ)

---

## Documentation Needed

Update CLAUDE.md with:
- Collections feature overview
- How to add new collections
- Data schema for collections
- Scraper pattern documentation

Update README.md with:
- Collections feature in feature list
- How to toggle collections
- Available collections list

---

## Next Steps for Fresh Context

**Start with:**
"I want to implement the Collections feature as planned in COLLECTIONS_IMPLEMENTATION_PLAN.md. Let's start with Phase 1: Criterion Collection proof of concept. First step: create the Criterion scraper."

**This plan provides:**
- Complete architecture
- Step-by-step implementation order
- Code examples for each component
- File structure
- Success criteria
- Future roadmap
