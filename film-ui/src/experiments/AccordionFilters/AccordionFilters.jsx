import { useState } from 'react'
import { useFilmData } from '../shared/useFilmData'
import { useHaptics } from '../shared/useHaptics'
import styles from './AccordionFilters.module.scss'

function AccordionFilters() {
  const [openSection, setOpenSection] = useState(null)
  const { haptics } = useHaptics()

  const {
    films,
    allGenres,
    allProviders,
    filters,
    setFilters,
    activeFilterCount,
    clearFilters,
    sortBy,
    setSortBy,
    getRandomFilm,
    stats,
  } = useFilmData()

  const toggleSection = (sectionId) => {
    haptics.light()
    setOpenSection(openSection === sectionId ? null : sectionId)
  }

  const handleChipToggle = (type, value) => {
    const currentArray = filters[type]
    const isSelected = currentArray.includes(value)

    if (isSelected) {
      haptics.double()
      setFilters({
        ...filters,
        [type]: currentArray.filter(v => v !== value)
      })
    } else {
      haptics.light()
      setFilters({
        ...filters,
        [type]: [...currentArray, value]
      })
    }
  }

  const handleRuntimeChange = (range) => {
    haptics.light()
    setFilters({
      ...filters,
      selectedRuntimeRange: filters.selectedRuntimeRange === range ? 'all' : range
    })
  }

  const handleFreeToggle = () => {
    haptics.light()
    setFilters({
      ...filters,
      showFreeOnly: !filters.showFreeOnly
    })
  }

  const handleSurpriseMe = () => {
    haptics.success()
    const film = getRandomFilm()
    if (film) {
      alert(`Watch: ${film.title} (${film.year})`)
    }
  }

  const getSectionCount = (sectionId) => {
    switch (sectionId) {
      case 'runtime':
        return filters.selectedRuntimeRange !== 'all' ? 1 : 0
      case 'genres':
        return filters.selectedGenres.length
      case 'providers':
        return filters.selectedProviders.length
      case 'sort':
        return 0
      default:
        return 0
    }
  }

  const sections = [
    { id: 'sort', label: 'Sort & Quick Actions' },
    { id: 'runtime', label: 'Runtime' },
    { id: 'genres', label: 'Genres' },
    { id: 'providers', label: 'Providers' },
  ]

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h2>{films.length} Films</h2>
        <p>{stats.freeCount} free • {stats.primeCount} on Prime</p>
      </header>

      {/* Search - always visible */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search films..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className={styles.searchInput}
        />
        {filters.search && (
          <button
            className={styles.clearSearch}
            onClick={() => setFilters({ ...filters, search: '' })}
          >
            ✕
          </button>
        )}
      </div>

      {/* Clear all */}
      {activeFilterCount > 0 && (
        <div className={styles.clearAllBar}>
          <span>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
          <button onClick={() => {
            haptics.warning()
            clearFilters()
          }}>
            Clear All
          </button>
        </div>
      )}

      {/* Accordion sections */}
      <div className={styles.accordion}>
        {sections.map(section => {
          const count = getSectionCount(section.id)
          const isOpen = openSection === section.id

          return (
            <div key={section.id} className={styles.section}>
              <button
                className={`${styles.sectionHeader} ${isOpen ? styles.open : ''}`}
                onClick={() => toggleSection(section.id)}
              >
                <span className={styles.sectionLabel}>
                  {section.label}
                  {count > 0 && <span className={styles.badge}>{count}</span>}
                </span>
                <span className={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className={styles.sectionContent}>
                  {section.id === 'sort' && (
                    <>
                      <div className={styles.quickActions}>
                        <button
                          className={`${styles.quickChip} ${filters.showFreeOnly ? styles.active : ''}`}
                          onClick={handleFreeToggle}
                        >
                          🆓 Free Only
                        </button>
                        <button
                          className={styles.surpriseChip}
                          onClick={handleSurpriseMe}
                        >
                          🎲 Surprise Me
                        </button>
                      </div>
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          haptics.light()
                          setSortBy(e.target.value)
                        }}
                        className={styles.sortSelect}
                      >
                        <option value="rating-desc">Rating (High to Low)</option>
                        <option value="rating-asc">Rating (Low to High)</option>
                        <option value="year-desc">Year (Newest)</option>
                        <option value="year-asc">Year (Oldest)</option>
                        <option value="runtime-asc">Runtime (Shortest)</option>
                        <option value="runtime-desc">Runtime (Longest)</option>
                        <option value="title-asc">Title (A-Z)</option>
                      </select>
                    </>
                  )}

                  {section.id === 'runtime' && (
                    <div className={styles.chips}>
                      {[
                        { id: 'under90', label: '< 90 min' },
                        { id: '90-120', label: '90-120 min' },
                        { id: '120-180', label: '2-3 hrs' },
                        { id: 'over180', label: '3+ hrs' },
                      ].map(runtime => (
                        <button
                          key={runtime.id}
                          className={`${styles.chip} ${filters.selectedRuntimeRange === runtime.id ? styles.active : ''}`}
                          onClick={() => handleRuntimeChange(runtime.id)}
                        >
                          {runtime.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {section.id === 'genres' && (
                    <div className={styles.chips}>
                      {allGenres.map(genre => (
                        <button
                          key={genre}
                          className={`${styles.chip} ${filters.selectedGenres.includes(genre) ? styles.active : ''}`}
                          onClick={() => handleChipToggle('selectedGenres', genre)}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  )}

                  {section.id === 'providers' && (
                    <div className={styles.chips}>
                      {allProviders.map(provider => (
                        <button
                          key={provider}
                          className={`${styles.chip} ${filters.selectedProviders.includes(provider) ? styles.active : ''}`}
                          onClick={() => handleChipToggle('selectedProviders', provider)}
                        >
                          {provider}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Film grid */}
      <div className={styles.filmGrid}>
        {films.slice(0, 15).map(film => (
          <div key={film.tmdb_id} className={styles.filmCard}>
            {film.poster_url ? (
              <img src={film.poster_url} alt={film.title} />
            ) : (
              <div className={styles.placeholder}>{film.title[0]}</div>
            )}
            <div className={styles.filmInfo}>
              <span className={styles.rating}>{film.tmdb_rating?.toFixed(1) || '?'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AccordionFilters
