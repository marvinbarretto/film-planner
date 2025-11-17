import { useState, useEffect, useMemo } from 'react'
import styles from './App.module.scss'
import filmsData from '@data/films.json'
import FilmGrid from '@components/FilmGrid/FilmGrid'
import FilterBar from '@components/FilterBar/FilterBar'
import TrailerModal from '@components/TrailerModal/TrailerModal'
import CountrySelector from '@components/CountrySelector/CountrySelector'

function App() {
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilm, setSelectedFilm] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    showFreeOnly: false,
    selectedGenres: [],
    selectedProviders: [],
    selectedSuggestedBy: []
  })
  const [sortBy, setSortBy] = useState('rating-desc')

  // Country selection state (no loading needed - all data is preloaded)
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return localStorage.getItem('selectedCountry') || 'GB'
  })

  useEffect(() => {
    // Load films data once on mount
    setFilms(filmsData)
    setLoading(false)
  }, [])

  // Handle country change - just update state, data is already loaded
  const handleCountryChange = (newCountry) => {
    setSelectedCountry(newCountry)
    localStorage.setItem('selectedCountry', newCountry)
    console.log(`🌍 Switched to ${newCountry}`)
  }

  // Get all unique genres
  const allGenres = useMemo(() => {
    const genreSet = new Set()
    films.forEach(film => {
      film.genres?.forEach(genre => genreSet.add(genre))
    })
    return Array.from(genreSet).sort()
  }, [films])

  // Get all unique providers for selected country
  const allProviders = useMemo(() => {
    const providerSet = new Set()
    films.forEach(film => {
      const countryData = film.availability?.[selectedCountry]
      countryData?.providers?.forEach(provider => providerSet.add(provider))
    })
    return Array.from(providerSet).sort()
  }, [films, selectedCountry])

  // Get all unique suggested_by values
  const allSuggestedBy = useMemo(() => {
    const suggestedSet = new Set()
    films.forEach(film => {
      if (film.suggested_by) {
        suggestedSet.add(film.suggested_by)
      }
    })
    return Array.from(suggestedSet).sort()
  }, [films])

  // Filter films based on current filters
  const filteredFilms = useMemo(() => {
    console.log('🔍 FILTERING WITH:', JSON.stringify(filters, null, 2))

    const result = films.filter(film => {
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

      // Suggested By filter (OR logic - film must be suggested by one of selected people)
      if (filters.selectedSuggestedBy.length > 0 &&
          !filters.selectedSuggestedBy.includes(film.suggested_by)) {
        console.log(`❌ SUGGESTED: "${film.title}" suggested by "${film.suggested_by}" not in [${filters.selectedSuggestedBy.join(', ')}]`)
        return false
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

    console.log(`📊 RESULT: ${sorted.length} of ${films.length} films (sorted by ${sortBy})`)
    console.log('📋 FILTERED FILMS:', sorted.map(f => `${f.title} (${f.tmdb_rating || 'N/A'})`))

    return sorted
  }, [films, filters, selectedCountry, sortBy])

  const handleFilmClick = (film) => {
    setSelectedFilm(film)
  }

  // Count real Prime films for selected country
  const realPrimeCount = useMemo(() => {
    return films.filter(film => {
      const countryData = film.availability?.[selectedCountry]
      return countryData?.providers?.some(p =>
        p === 'Amazon Prime Video' || p === 'Amazon Prime Video with Ads'
      )
    }).length
  }, [films, selectedCountry])

  // Count free films for selected country
  const freeCount = useMemo(() => {
    return films.filter(film => {
      const countryData = film.availability?.[selectedCountry]
      return countryData?.free_any
    }).length
  }, [films, selectedCountry])

  if (loading) {
    return <div className={styles.app}>Loading...</div>
  }

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1>🎬 Film Planner</h1>
            <div className={styles.headerControls}>
              <CountrySelector
                selectedCountry={selectedCountry}
                onCountryChange={handleCountryChange}
              />
              <a
                href="https://docs.google.com/spreadsheets/d/1rlKS3PJhRjeiiQ9KEdIuMchrJxAn5TdCPjV7a2ZVcw8/edit"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.editLink}
                title="Edit film list"
              >
                ✏️ THE LIST
              </a>
            </div>
          </div>
          <p>
            {filteredFilms.length} of {films.length} films • {realPrimeCount} on Prime • {freeCount} free ({selectedCountry})
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
