import { useState, useEffect, useMemo, useCallback } from 'react'
import filmsData from '@data/films.json'

// Default filter state
const DEFAULT_FILTERS = {
  search: '',
  showFreeOnly: false,
  selectedGenres: [],
  selectedProviders: [],
  selectedSuggestedBy: [],
  selectedRuntimeRange: 'all'
}

// Hook for loading and filtering film data
// Extracted from App.jsx for reuse across experiments
export function useFilmData(options = {}) {
  const {
    initialCountry = 'GB',
    initialSortBy = 'rating-desc',
    initialCollections = ['personal'],
  } = options

  // Core state
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sortBy, setSortBy] = useState(initialSortBy)
  const [selectedCountry, setSelectedCountry] = useState(initialCountry)
  const [selectedCollections, setSelectedCollections] = useState(initialCollections)

  // Collections state
  const [collectionData, setCollectionData] = useState({})
  const [collectionsLoading, setCollectionsLoading] = useState(false)

  // Load films on mount
  useEffect(() => {
    setFilms(filmsData)
    setLoading(false)
  }, [])

  // Load collections on demand
  useEffect(() => {
    const loadCollections = async () => {
      for (const collection of selectedCollections) {
        if (collection !== 'personal' && !collectionData[collection]) {
          setCollectionsLoading(true)
          try {
            const module = await import(`@data/collections/${collection}.json`)
            setCollectionData(prev => ({ ...prev, [collection]: module.default }))
          } catch (error) {
            console.error(`Failed to load ${collection} collection:`, error)
          } finally {
            setCollectionsLoading(false)
          }
        }
      }
    }
    loadCollections()
  }, [selectedCollections, collectionData])

  // Merge films from personal list and selected collections
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
        filmMap.set(key, {
          ...film,
          collections: [film.collection],
          collection_metas: film.collection_meta ? [{ collection: film.collection, ...film.collection_meta }] : []
        })
      } else {
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

  // Derived data
  const allGenres = useMemo(() => {
    const genreSet = new Set()
    allFilms.forEach(film => {
      film.genres?.forEach(genre => genreSet.add(genre))
    })
    return Array.from(genreSet).sort()
  }, [allFilms])

  const allProviders = useMemo(() => {
    const providerSet = new Set()
    allFilms.forEach(film => {
      const countryData = film.availability?.[selectedCountry]
      countryData?.providers?.forEach(provider => providerSet.add(provider))
    })
    return Array.from(providerSet).sort()
  }, [allFilms, selectedCountry])

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

  // Filtered and sorted films
  const filteredFilms = useMemo(() => {
    const result = allFilms.filter(film => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesTitle = film.title.toLowerCase().includes(searchLower)
        const matchesGenres = film.genres?.some(g => g.toLowerCase().includes(searchLower))
        const matchesSuggestedBy = film.suggested_by?.toLowerCase().includes(searchLower)
        if (!matchesTitle && !matchesGenres && !matchesSuggestedBy) return false
      }

      const countryData = film.availability?.[selectedCountry] || { providers: [], prime: false, free_any: false }

      // Free filter
      if (filters.showFreeOnly && !countryData.free_any) return false

      // Genre filter (OR logic)
      if (filters.selectedGenres.length > 0) {
        const hasMatchingGenre = film.genres?.some(g => filters.selectedGenres.includes(g))
        if (!hasMatchingGenre) return false
      }

      // Provider filter (OR logic)
      if (filters.selectedProviders.length > 0 &&
          !countryData.providers?.some(p => filters.selectedProviders.includes(p))) {
        return false
      }

      // Suggested By filter
      if (filters.selectedSuggestedBy.length > 0) {
        const filmSource = film.suggested_by || (film.collection ? `Collection: ${film.collection}` : null)
        if (!filters.selectedSuggestedBy.includes(filmSource)) return false
      }

      // Runtime filter
      if (filters.selectedRuntimeRange !== 'all' && film.runtime) {
        const runtime = film.runtime
        let inRange = false
        switch (filters.selectedRuntimeRange) {
          case 'under90': inRange = runtime < 90; break
          case '90-120': inRange = runtime >= 90 && runtime < 120; break
          case '120-180': inRange = runtime >= 120 && runtime < 180; break
          case 'over180': inRange = runtime >= 180; break
          default: inRange = true
        }
        if (!inRange) return false
      }

      return true
    })

    // Sort
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'rating-desc': return (b.tmdb_rating || 0) - (a.tmdb_rating || 0)
        case 'rating-asc': return (a.tmdb_rating || 0) - (b.tmdb_rating || 0)
        case 'runtime-asc': return (a.runtime || 0) - (b.runtime || 0)
        case 'runtime-desc': return (b.runtime || 0) - (a.runtime || 0)
        case 'year-desc': return (parseInt(b.year) || 0) - (parseInt(a.year) || 0)
        case 'year-asc': return (parseInt(a.year) || 0) - (parseInt(b.year) || 0)
        case 'title-asc': return a.title.localeCompare(b.title)
        default: return (b.tmdb_rating || 0) - (a.tmdb_rating || 0)
      }
    })
  }, [allFilms, filters, selectedCountry, sortBy])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.showFreeOnly) count++
    if (filters.selectedGenres.length > 0) count += filters.selectedGenres.length
    if (filters.selectedProviders.length > 0) count += filters.selectedProviders.length
    if (filters.selectedSuggestedBy.length > 0) count += filters.selectedSuggestedBy.length
    if (filters.selectedRuntimeRange !== 'all') count++
    return count
  }, [filters])

  // Actions
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const getRandomFilm = useCallback(() => {
    if (filteredFilms.length === 0) return null
    const randomIndex = Math.floor(Math.random() * filteredFilms.length)
    return filteredFilms[randomIndex]
  }, [filteredFilms])

  // Stats
  const stats = useMemo(() => {
    const primeCount = allFilms.filter(film => {
      const countryData = film.availability?.[selectedCountry]
      return countryData?.providers?.some(p =>
        p === 'Amazon Prime Video' || p === 'Amazon Prime Video with Ads'
      )
    }).length

    const freeCount = allFilms.filter(film => {
      const countryData = film.availability?.[selectedCountry]
      return countryData?.free_any
    }).length

    return { primeCount, freeCount }
  }, [allFilms, selectedCountry])

  return {
    // Data
    films: filteredFilms,
    allFilms,
    loading,
    collectionsLoading,

    // Derived lists
    allGenres,
    allProviders,
    allSuggestedBy,

    // Filter state
    filters,
    setFilters,
    activeFilterCount,
    clearFilters,

    // Sort state
    sortBy,
    setSortBy,

    // Country state
    selectedCountry,
    setSelectedCountry,

    // Collections state
    selectedCollections,
    setSelectedCollections,

    // Actions
    getRandomFilm,

    // Stats
    stats,
  }
}

export default useFilmData
