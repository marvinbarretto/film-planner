import { useState, useEffect, useMemo } from 'react'
import styles from './App.module.scss'
import filmsData from '@data/films.json'
import FilmGrid from '@components/FilmGrid/FilmGrid'
import FilterBar from '@components/FilterBar/FilterBar'
import TrailerModal from '@components/TrailerModal/TrailerModal'
import CountrySelector from '@components/CountrySelector/CountrySelector'
import ExperimentsIndex from './experiments/ExperimentsIndex'
import ExperimentLayout from './experiments/shared/ExperimentLayout'
import FabBottomSheet from './experiments/FabBottomSheet/FabBottomSheet'
import SwipeFilters from './experiments/SwipeFilters/SwipeFilters'
import AccordionFilters from './experiments/AccordionFilters/AccordionFilters'
import QuickFilters from './experiments/QuickFilters/QuickFilters'

// Default user preferences
const DEFAULT_PREFERENCES = {
  filters: {
    search: '',
    showFreeOnly: false,
    selectedGenres: [],
    selectedProviders: [],
    selectedSuggestedBy: [],
    selectedRuntimeRange: 'all'
  },
  sortBy: 'rating-desc',
  selectedCollections: ['personal'],
  selectedCountry: 'GB'
}

// Load preferences from localStorage with validation
function getInitialPreferences() {
  try {
    const stored = localStorage.getItem('filmPlannerPreferences')

    if (!stored) {
      // Check for old single-key format (migration)
      const oldCountry = localStorage.getItem('selectedCountry')
      if (oldCountry) {
        const migrated = { ...DEFAULT_PREFERENCES, selectedCountry: oldCountry }
        localStorage.removeItem('selectedCountry') // Clean up old key
        return migrated
      }
      return DEFAULT_PREFERENCES
    }

    const parsed = JSON.parse(stored)

    // Merge with defaults to handle schema evolution
    return {
      filters: { ...DEFAULT_PREFERENCES.filters, ...parsed.filters },
      sortBy: parsed.sortBy || DEFAULT_PREFERENCES.sortBy,
      selectedCollections: Array.isArray(parsed.selectedCollections)
        ? parsed.selectedCollections
        : DEFAULT_PREFERENCES.selectedCollections,
      selectedCountry: parsed.selectedCountry || DEFAULT_PREFERENCES.selectedCountry
    }
  } catch (error) {
    console.error('Failed to load preferences from localStorage:', error)
    return DEFAULT_PREFERENCES
  }
}

function App() {
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilm, setSelectedFilm] = useState(null)

  // Experiments view state
  const [currentView, setCurrentView] = useState('main') // 'main' | 'experiments' | experiment id

  // User preferences (persisted to localStorage)
  const [filters, setFilters] = useState(() => getInitialPreferences().filters)
  const [sortBy, setSortBy] = useState(() => getInitialPreferences().sortBy)
  const [selectedCollections, setSelectedCollections] = useState(() => getInitialPreferences().selectedCollections)
  const [selectedCountry, setSelectedCountry] = useState(() => getInitialPreferences().selectedCountry)

  // Collections state
  const [collectionData, setCollectionData] = useState({})
  const [collectionsLoading, setCollectionsLoading] = useState(false)

  useEffect(() => {
    // Load films data once on mount
    setFilms(filmsData)
    setLoading(false)
  }, [])

  // Load collections on demand when toggled
  useEffect(() => {
    const loadCollections = async () => {
      for (const collection of selectedCollections) {
        if (collection !== 'personal' && !collectionData[collection]) {
          setCollectionsLoading(true)
          try {
            const module = await import(`@data/collections/${collection}.json`)
            setCollectionData(prev => ({ ...prev, [collection]: module.default }))
            console.log(`✅ Loaded ${collection} collection`)
          } catch (error) {
            console.error(`❌ Failed to load ${collection} collection:`, error)
          } finally {
            setCollectionsLoading(false)
          }
        }
      }
    }
    loadCollections()
  }, [selectedCollections, collectionData])

  // Persist user preferences to localStorage whenever they change
  useEffect(() => {
    try {
      const preferences = {
        filters,
        sortBy,
        selectedCollections,
        selectedCountry
      }
      localStorage.setItem('filmPlannerPreferences', JSON.stringify(preferences))
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, preferences not saved')
      } else {
        console.error('Failed to save preferences:', error)
      }
    }
  }, [filters, sortBy, selectedCollections, selectedCountry])

  // Handle country change
  const handleCountryChange = (newCountry) => {
    setSelectedCountry(newCountry)
    console.log(`🌍 Switched to ${newCountry}`)
  }

  // Merge films from personal list and selected collections
  // Deduplicate by tmdb_id, merging collection metadata for films in multiple collections
  const allFilms = useMemo(() => {
    const personal = films.map(f => ({ ...f, collection: 'personal', collection_meta: null }))
    const collections = selectedCollections
      .filter(c => c !== 'personal')
      .flatMap(c => collectionData[c] || [])

    const combined = [...personal, ...collections]
    const filmMap = new Map()

    combined.forEach(film => {
      const key = film.tmdb_id
      if (!filmMap.has(key)) {
        // First occurrence - store film with collection as array
        filmMap.set(key, {
          ...film,
          collections: [film.collection],
          collection_metas: film.collection_meta ? [{ collection: film.collection, ...film.collection_meta }] : []
        })
      } else {
        // Duplicate found - merge collection info
        const existing = filmMap.get(key)
        if (!existing.collections.includes(film.collection)) {
          existing.collections.push(film.collection)
        }
        if (film.collection_meta) {
          existing.collection_metas.push({ collection: film.collection, ...film.collection_meta })
        }
      }
    })

    return Array.from(filmMap.values())
  }, [films, selectedCollections, collectionData])

  // Get all unique genres
  const allGenres = useMemo(() => {
    const genreSet = new Set()
    allFilms.forEach(film => {
      film.genres?.forEach(genre => genreSet.add(genre))
    })
    return Array.from(genreSet).sort()
  }, [allFilms])

  // Get all unique providers for selected country
  const allProviders = useMemo(() => {
    const providerSet = new Set()
    allFilms.forEach(film => {
      const countryData = film.availability?.[selectedCountry]
      countryData?.providers?.forEach(provider => providerSet.add(provider))
    })
    return Array.from(providerSet).sort()
  }, [allFilms, selectedCountry])

  // Get all unique suggested_by values (includes collection sources)
  const allSuggestedBy = useMemo(() => {
    const suggestedSet = new Set()
    allFilms.forEach(film => {
      if (film.suggested_by) {
        suggestedSet.add(film.suggested_by)
      } else if (film.collection) {
        suggestedSet.add(`Collection: ${film.collection}`)
      }
    })
    return Array.from(suggestedSet).sort()
  }, [allFilms])

  // Filter films based on current filters
  const filteredFilms = useMemo(() => {
    console.log('🔍 FILTERING WITH:', JSON.stringify(filters, null, 2))

    const result = allFilms.filter(film => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesTitle = film.title.toLowerCase().includes(searchLower)
        const matchesGenres = film.genres?.some(g => g.toLowerCase().includes(searchLower))
        const matchesSuggestedBy = film.suggested_by?.toLowerCase().includes(searchLower)

        if (!matchesTitle && !matchesGenres && !matchesSuggestedBy) {
          console.log(`❌ SEARCH: "${film.title}" doesn't match search "${filters.search}"`)
          return false
        }
      }

      // Get country-specific availability data
      const countryData = film.availability?.[selectedCountry] || { providers: [], prime: false, free_any: false }

      // Free filter
      if (filters.showFreeOnly && !countryData.free_any) {
        console.log(`❌ FREE: "${film.title}" is not free in ${selectedCountry}`)
        return false
      }

      // Genre filter (OR logic - film must have at least one selected genre)
      if (filters.selectedGenres.length > 0) {
        const hasMatchingGenre = film.genres?.some(g => filters.selectedGenres.includes(g))
        if (!hasMatchingGenre) {
          console.log(`❌ GENRE: "${film.title}" genres [${film.genres?.join(', ')}] don't include any of [${filters.selectedGenres.join(', ')}]`)
          return false
        }
      }

      // Provider filter (OR logic - film must have at least one selected provider)
      if (filters.selectedProviders.length > 0 &&
          !countryData.providers?.some(p => filters.selectedProviders.includes(p))) {
        console.log(`❌ PROVIDER: "${film.title}" providers [${countryData.providers?.join(', ')}] don't include any of [${filters.selectedProviders.join(', ')}]`)
        return false
      }

      // Suggested By filter (OR logic - includes collections)
      if (filters.selectedSuggestedBy.length > 0) {
        const filmSource = film.suggested_by || (film.collection ? `Collection: ${film.collection}` : null)
        if (!filters.selectedSuggestedBy.includes(filmSource)) {
          console.log(`❌ SUGGESTED: "${film.title}" source "${filmSource}" not in [${filters.selectedSuggestedBy.join(', ')}]`)
          return false
        }
      }

      // Runtime filter
      if (filters.selectedRuntimeRange !== 'all' && film.runtime) {
        const runtime = film.runtime
        let inRange = false

        switch (filters.selectedRuntimeRange) {
          case 'under90':
            inRange = runtime < 90
            break
          case '90-120':
            inRange = runtime >= 90 && runtime < 120
            break
          case '120-180':
            inRange = runtime >= 120 && runtime < 180
            break
          case 'over180':
            inRange = runtime >= 180
            break
          default:
            inRange = true
        }

        if (!inRange) {
          console.log(`❌ RUNTIME: "${film.title}" runtime ${runtime}min not in range ${filters.selectedRuntimeRange}`)
          return false
        }
      }

      console.log(`✅ PASS: "${film.title}"`)
      return true
    })

    // Sort based on selected sortBy option
    const sorted = result.sort((a, b) => {
      switch (sortBy) {
        case 'rating-desc':
          return (b.tmdb_rating || 0) - (a.tmdb_rating || 0)
        case 'rating-asc':
          return (a.tmdb_rating || 0) - (b.tmdb_rating || 0)
        case 'runtime-asc':
          return (a.runtime || 0) - (b.runtime || 0)
        case 'runtime-desc':
          return (b.runtime || 0) - (a.runtime || 0)
        case 'year-desc':
          return (parseInt(b.year) || 0) - (parseInt(a.year) || 0)
        case 'year-asc':
          return (parseInt(a.year) || 0) - (parseInt(b.year) || 0)
        case 'title-asc':
          return a.title.localeCompare(b.title)
        default:
          return (b.tmdb_rating || 0) - (a.tmdb_rating || 0)
      }
    })

    console.log(`📊 RESULT: ${sorted.length} of ${allFilms.length} films (sorted by ${sortBy})`)
    console.log('📋 FILTERED FILMS:', sorted.map(f => `${f.title} (${f.tmdb_rating || 'N/A'})`))

    return sorted
  }, [allFilms, filters, selectedCountry, sortBy])

  const handleFilmClick = (film) => {
    setSelectedFilm(film)
  }

  const handleSurpriseMe = () => {
    if (filteredFilms.length === 0) return
    const randomIndex = Math.floor(Math.random() * filteredFilms.length)
    setSelectedFilm(filteredFilms[randomIndex])
  }

  // Count real Prime films for selected country
  const realPrimeCount = useMemo(() => {
    return allFilms.filter(film => {
      const countryData = film.availability?.[selectedCountry]
      return countryData?.providers?.some(p =>
        p === 'Amazon Prime Video' || p === 'Amazon Prime Video with Ads'
      )
    }).length
  }, [allFilms, selectedCountry])

  // Count free films for selected country
  const freeCount = useMemo(() => {
    return allFilms.filter(film => {
      const countryData = film.availability?.[selectedCountry]
      return countryData?.free_any
    }).length
  }, [allFilms, selectedCountry])

  if (loading) {
    return <div className={styles.app}>Loading...</div>
  }

  // Render experiment views
  if (currentView === 'experiments') {
    return (
      <ExperimentsIndex
        onSelectExperiment={(id) => setCurrentView(id)}
        onBack={() => setCurrentView('main')}
      />
    )
  }

  if (currentView === 'fab-bottom-sheet') {
    return (
      <ExperimentLayout
        title="FAB + Bottom Sheet"
        description="Floating action button opens a sliding filter panel"
        onBack={() => setCurrentView('experiments')}
      >
        <FabBottomSheet />
      </ExperimentLayout>
    )
  }

  if (currentView === 'swipe-filters') {
    return (
      <ExperimentLayout
        title="Swipe Carousel"
        description="Horizontal swipeable filter categories"
        onBack={() => setCurrentView('experiments')}
      >
        <SwipeFilters />
      </ExperimentLayout>
    )
  }

  if (currentView === 'accordion-filters') {
    return (
      <ExperimentLayout
        title="Accordion Filters"
        description="Collapsible sections with search always visible"
        onBack={() => setCurrentView('experiments')}
      >
        <AccordionFilters />
      </ExperimentLayout>
    )
  }

  if (currentView === 'quick-filters') {
    return (
      <ExperimentLayout
        title="Smart Quick Filters"
        description="Pre-set filter presets for common use cases"
        onBack={() => setCurrentView('experiments')}
      >
        <QuickFilters />
      </ExperimentLayout>
    )
  }

  // Main app view
  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1>Film Planner</h1>
            <div className={styles.headerControls}>
              <CountrySelector
                selectedCountry={selectedCountry}
                onCountryChange={handleCountryChange}
              />
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSd4-LKFqFd6W5jVW62U1r_5n5CIV7C-8pGhhjYQxSZxYJibfg/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.editLink}
                title="Add a new film"
              >
                Add Film
              </a>
              <a
                href="https://docs.google.com/spreadsheets/d/1rlKS3PJhRjeiiQ9KEdIuMchrJxAn5TdCPjV7a2ZVcw8/edit"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.editLink}
                title="Edit film list"
              >
                Edit List
              </a>
              <button
                className={styles.experimentsLink}
                onClick={() => setCurrentView('experiments')}
                title="UX Experiments"
              >
                Experiments
              </button>
            </div>
          </div>
          <p>
            {filteredFilms.length} of {allFilms.length} films • {realPrimeCount} on Prime • {freeCount} free ({selectedCountry})
            {selectedCollections.length > 1 && (
              <span> • {selectedCollections.filter(c => c !== 'personal').join(' + ')}</span>
            )}
          </p>
        </header>

        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          genres={allGenres}
          providers={allProviders}
          suggestedBy={allSuggestedBy}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onSurpriseMe={handleSurpriseMe}
          hasFilms={filteredFilms.length > 0}
          selectedCollections={selectedCollections}
          onCollectionsChange={setSelectedCollections}
          collectionsLoading={collectionsLoading}
        />

        <FilmGrid films={filteredFilms} onFilmClick={handleFilmClick} selectedCountry={selectedCountry} />
      </div>

      {selectedFilm && (
        <TrailerModal film={selectedFilm} onClose={() => setSelectedFilm(null)} />
      )}
    </div>
  )
}

export default App
