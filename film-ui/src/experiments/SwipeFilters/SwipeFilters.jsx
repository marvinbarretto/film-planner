import { useState, useRef } from 'react'
import { useFilmData } from '../shared/useFilmData'
import { useHaptics } from '../shared/useHaptics'
import styles from './SwipeFilters.module.scss'

const FILTER_TABS = [
  { id: 'runtime', label: 'Runtime' },
  { id: 'genres', label: 'Genres' },
  { id: 'providers', label: 'Providers' },
  { id: 'sort', label: 'Sort' },
]

function SwipeFilters() {
  const [activeTab, setActiveTab] = useState('runtime')
  const tabsRef = useRef(null)
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

  const handleTabChange = (tabId) => {
    haptics.tick()
    setActiveTab(tabId)
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

  const handleSurpriseMe = () => {
    haptics.success()
    const film = getRandomFilm()
    if (film) {
      alert(`Watch: ${film.title} (${film.year})`)
    }
  }

  const getTabBadge = (tabId) => {
    switch (tabId) {
      case 'runtime':
        return filters.selectedRuntimeRange !== 'all' ? 1 : 0
      case 'genres':
        return filters.selectedGenres.length
      case 'providers':
        return filters.selectedProviders.length
      default:
        return 0
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'runtime':
        return (
          <div className={styles.chips}>
            {[
              { id: 'under90', label: '< 90 min', emoji: '⚡' },
              { id: '90-120', label: '90-120 min', emoji: '🎬' },
              { id: '120-180', label: '2-3 hrs', emoji: '🍿' },
              { id: 'over180', label: '3+ hrs', emoji: '🎭' },
            ].map(runtime => (
              <button
                key={runtime.id}
                className={`${styles.chip} ${filters.selectedRuntimeRange === runtime.id ? styles.active : ''}`}
                onClick={() => handleRuntimeChange(runtime.id)}
              >
                <span className={styles.chipEmoji}>{runtime.emoji}</span>
                {runtime.label}
              </button>
            ))}
          </div>
        )

      case 'genres':
        return (
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
        )

      case 'providers':
        return (
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
        )

      case 'sort':
        return (
          <div className={styles.sortOptions}>
            {[
              { id: 'rating-desc', label: 'Highest Rated', emoji: '⭐' },
              { id: 'rating-asc', label: 'Lowest Rated', emoji: '📉' },
              { id: 'year-desc', label: 'Newest First', emoji: '🆕' },
              { id: 'year-asc', label: 'Oldest First', emoji: '📜' },
              { id: 'runtime-asc', label: 'Shortest', emoji: '⏱️' },
              { id: 'runtime-desc', label: 'Longest', emoji: '⏳' },
              { id: 'title-asc', label: 'A to Z', emoji: '🔤' },
            ].map(option => (
              <button
                key={option.id}
                className={`${styles.sortOption} ${sortBy === option.id ? styles.active : ''}`}
                onClick={() => {
                  haptics.light()
                  setSortBy(option.id)
                }}
              >
                <span className={styles.sortEmoji}>{option.emoji}</span>
                <span className={styles.sortLabel}>{option.label}</span>
                {sortBy === option.id && <span className={styles.sortCheck}>✓</span>}
              </button>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h2>{films.length} Films</h2>
          <button className={styles.surpriseButton} onClick={handleSurpriseMe}>
            🎲
          </button>
        </div>
        <p>{stats.freeCount} free • {stats.primeCount} on Prime</p>
      </header>

      {/* Search bar */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search films..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className={styles.searchInput}
        />
      </div>

      {/* Swipeable tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs} ref={tabsRef}>
          {FILTER_TABS.map(tab => {
            const badge = getTabBadge(tab.id)
            return (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
                {badge > 0 && <span className={styles.tabBadge}>{badge}</span>}
              </button>
            )
          })}
        </div>

        {activeFilterCount > 0 && (
          <button className={styles.clearButton} onClick={() => {
            haptics.warning()
            clearFilters()
          }}>
            Clear
          </button>
        )}
      </div>

      {/* Tab content */}
      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>

      {/* Film grid */}
      <div className={styles.filmGrid}>
        {films.slice(0, 18).map(film => (
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

export default SwipeFilters
