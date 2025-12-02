import { useState } from 'react'
import { useFilmData } from '../shared/useFilmData'
import { useHaptics } from '../shared/useHaptics'
import styles from './FabBottomSheet.module.scss'

function FabBottomSheet() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
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

  const handleOpenSheet = () => {
    haptics.medium()
    setIsSheetOpen(true)
  }

  const handleCloseSheet = () => {
    haptics.light()
    setIsSheetOpen(false)
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

  const handleClearAll = () => {
    haptics.warning()
    clearFilters()
  }

  const handleSurpriseMe = () => {
    haptics.success()
    const film = getRandomFilm()
    if (film) {
      alert(`Watch: ${film.title} (${film.year})`)
    }
  }

  return (
    <div className={styles.container}>
      {/* Header with stats */}
      <header className={styles.header}>
        <h2>{films.length} Films</h2>
        <p>{stats.freeCount} free • {stats.primeCount} on Prime</p>
      </header>

      {/* Search bar - always visible */}
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

      {/* Film grid (simplified) */}
      <div className={styles.filmGrid}>
        {films.slice(0, 20).map(film => (
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

      {/* FAB Button */}
      <button className={styles.fab} onClick={handleOpenSheet}>
        <span className={styles.fabIcon}>⚙️</span>
        {activeFilterCount > 0 && (
          <span className={styles.fabBadge}>{activeFilterCount}</span>
        )}
      </button>

      {/* Bottom Sheet */}
      {isSheetOpen && (
        <>
          <div className={styles.backdrop} onClick={handleCloseSheet} />
          <div className={styles.bottomSheet}>
            <div className={styles.sheetHandle} />

            <div className={styles.sheetHeader}>
              <h3>Filters</h3>
              {activeFilterCount > 0 && (
                <button className={styles.clearAll} onClick={handleClearAll}>
                  Clear All
                </button>
              )}
            </div>

            <div className={styles.sheetContent}>
              {/* Sort */}
              <section className={styles.section}>
                <h4>Sort By</h4>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
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
              </section>

              {/* Quick Actions */}
              <section className={styles.section}>
                <h4>Quick Actions</h4>
                <div className={styles.quickActions}>
                  <button
                    className={`${styles.quickChip} ${filters.showFreeOnly ? styles.active : ''}`}
                    onClick={handleFreeToggle}
                  >
                    Free Only
                  </button>
                  <button
                    className={styles.surpriseChip}
                    onClick={handleSurpriseMe}
                  >
                    🎲 Surprise Me
                  </button>
                </div>
              </section>

              {/* Runtime */}
              <section className={styles.section}>
                <h4>Runtime</h4>
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
              </section>

              {/* Genres */}
              <section className={styles.section}>
                <h4>Genres {filters.selectedGenres.length > 0 && `(${filters.selectedGenres.length})`}</h4>
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
              </section>

              {/* Providers */}
              <section className={styles.section}>
                <h4>Providers {filters.selectedProviders.length > 0 && `(${filters.selectedProviders.length})`}</h4>
                <div className={styles.chips}>
                  {allProviders.slice(0, 10).map(provider => (
                    <button
                      key={provider}
                      className={`${styles.chip} ${filters.selectedProviders.includes(provider) ? styles.active : ''}`}
                      onClick={() => handleChipToggle('selectedProviders', provider)}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className={styles.sheetFooter}>
              <button className={styles.applyButton} onClick={handleCloseSheet}>
                Show {films.length} Films
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default FabBottomSheet
