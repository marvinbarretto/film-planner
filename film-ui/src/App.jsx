import { useState, useEffect, useMemo } from 'react'
import styles from './App.module.scss'
import filmsData from '@data/films.json'
import FilmGrid from '@components/FilmGrid/FilmGrid'
import FilterBar from '@components/FilterBar/FilterBar'
import TrailerModal from '@components/TrailerModal/TrailerModal'

function App() {
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilm, setSelectedFilm] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    showPrimeOnly: false,
    showFreeOnly: false,
    selectedGenres: []
  })

  useEffect(() => {
    // Load films data
    setFilms(filmsData)
    setLoading(false)
  }, [])

  // Get all unique genres
  const allGenres = useMemo(() => {
    const genreSet = new Set()
    films.forEach(film => {
      film.genres?.forEach(genre => genreSet.add(genre))
    })
    return Array.from(genreSet).sort()
  }, [films])

  // Filter films based on current filters
  const filteredFilms = useMemo(() => {
    return films.filter(film => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesTitle = film.title.toLowerCase().includes(searchLower)
        const matchesGenres = film.genres?.some(g => g.toLowerCase().includes(searchLower))
        const matchesSuggestedBy = film.suggested_by?.toLowerCase().includes(searchLower)

        if (!matchesTitle && !matchesGenres && !matchesSuggestedBy) {
          return false
        }
      }

      // Prime filter
      if (filters.showPrimeOnly && !film.prime) {
        return false
      }

      // Free filter
      if (filters.showFreeOnly && !film.free_any) {
        return false
      }

      // Genre filter (OR logic - film must have at least one selected genre)
      if (filters.selectedGenres.length > 0 &&
          !film.genres?.some(g => filters.selectedGenres.includes(g))) {
        return false
      }

      return true
    })
  }, [films, filters])

  const handleFilmClick = (film) => {
    setSelectedFilm(film)
  }

  if (loading) {
    return <div className={styles.app}>Loading...</div>
  }

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1>🎬 Film Planner</h1>
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
          <p>
            {filteredFilms.length} of {films.length} films • {films.filter(f => f.prime).length} on Prime • {films.filter(f => f.free_any).length} free
          </p>
        </header>

        <FilterBar filters={filters} onFiltersChange={setFilters} genres={allGenres} />

        <FilmGrid films={filteredFilms} onFilmClick={handleFilmClick} />
      </div>

      {selectedFilm && (
        <TrailerModal film={selectedFilm} onClose={() => setSelectedFilm(null)} />
      )}
    </div>
  )
}

export default App
