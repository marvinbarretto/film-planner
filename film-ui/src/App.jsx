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
    showFreeOnly: false
  })

  useEffect(() => {
    // Load films data
    setFilms(filmsData)
    setLoading(false)
  }, [])

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
          <h1>🎬 Film Planner</h1>
          <p>
            {filteredFilms.length} of {films.length} films • {films.filter(f => f.prime).length} on Prime • {films.filter(f => f.free_any).length} free
          </p>
        </header>

        <FilterBar filters={filters} onFiltersChange={setFilters} />

        <FilmGrid films={filteredFilms} onFilmClick={handleFilmClick} />
      </div>

      {selectedFilm && (
        <TrailerModal film={selectedFilm} onClose={() => setSelectedFilm(null)} />
      )}
    </div>
  )
}

export default App
