import { useState } from 'react'
import { useFilmData } from '../shared/useFilmData'
import { useHaptics } from '../shared/useHaptics'
import styles from './QuickFilters.module.scss'

// Pre-defined smart filter presets
const PRESETS = [
  {
    id: 'free-tonight',
    label: 'Free Tonight',
    emoji: '🆓',
    description: 'Free films under 2 hours',
    apply: (setFilters, clearFilters) => {
      clearFilters()
      setFilters(prev => ({
        ...prev,
        showFreeOnly: true,
        selectedRuntimeRange: 'under90'
      }))
    }
  },
  {
    id: 'highly-rated',
    label: 'Top Rated',
    emoji: '⭐',
    description: 'Films rated 8.0+',
    apply: (setFilters, clearFilters, setSortBy) => {
      clearFilters()
      setSortBy('rating-desc')
    }
  },
  {
    id: 'quick-watch',
    label: 'Quick Watch',
    emoji: '⚡',
    description: 'Under 90 minutes',
    apply: (setFilters, clearFilters) => {
      clearFilters()
      setFilters(prev => ({
        ...prev,
        selectedRuntimeRange: 'under90'
      }))
    }
  },
  {
    id: 'movie-night',
    label: 'Movie Night',
    emoji: '🍿',
    description: '2-3 hour epics',
    apply: (setFilters, clearFilters) => {
      clearFilters()
      setFilters(prev => ({
        ...prev,
        selectedRuntimeRange: '120-180'
      }))
    }
  },
  {
    id: 'classics',
    label: 'Classics',
    emoji: '🎬',
    description: 'Pre-2000 films',
    apply: (setFilters, clearFilters, setSortBy) => {
      clearFilters()
      setSortBy('year-asc')
    }
  },
  {
    id: 'recent',
    label: 'Recent',
    emoji: '🆕',
    description: 'Newest releases',
    apply: (setFilters, clearFilters, setSortBy) => {
      clearFilters()
      setSortBy('year-desc')
    }
  },
]

function QuickFilters() {
  const [activePreset, setActivePreset] = useState(null)
  const [showAllFilters, setShowAllFilters] = useState(false)
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

  const handlePresetClick = (preset) => {
    haptics.medium()
    setActivePreset(activePreset === preset.id ? null : preset.id)
    if (activePreset !== preset.id) {
      preset.apply(setFilters, clearFilters, setSortBy)
    } else {
      clearFilters()
    }
  }

  const handleSurpriseMe = () => {
    haptics.success()
    const film = getRandomFilm()
    if (film) {
      alert(`Watch: ${film.title} (${film.year})`)
    }
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
    setActivePreset(null) // Clear preset when manually filtering
  }

  const handleRuntimeChange = (range) => {
    haptics.light()
    setFilters({
      ...filters,
      selectedRuntimeRange: filters.selectedRuntimeRange === range ? 'all' : range
    })
    setActivePreset(null)
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h2>{films.length} Films</h2>
        <p>{stats.freeCount} free • {stats.primeCount} on Prime</p>
      </header>

      {/* Big Surprise Me Button */}
      <button className={styles.surpriseButton} onClick={handleSurpriseMe}>
        <span className={styles.surpriseEmoji}>🎲</span>
        <span className={styles.surpriseText}>Surprise Me</span>
        <span className={styles.surpriseSubtext}>Pick a random film</span>
      </button>

      {/* Quick Preset Chips */}
      <div className={styles.presetsSection}>
        <h3>Quick Picks</h3>
        <div className={styles.presets}>
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              className={`${styles.presetChip} ${activePreset === preset.id ? styles.active : ''}`}
              onClick={() => handlePresetClick(preset)}
            >
              <span className={styles.presetEmoji}>{preset.emoji}</span>
              <span className={styles.presetLabel}>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expandable All Filters */}
      <button
        className={styles.allFiltersToggle}
        onClick={() => {
          haptics.light()
          setShowAllFilters(!showAllFilters)
        }}
      >
        {showAllFilters ? 'Hide Filters' : 'All Filters'}
        {activeFilterCount > 0 && !showAllFilters && (
          <span className={styles.filterBadge}>{activeFilterCount}</span>
        )}
        <span className={styles.toggleIcon}>{showAllFilters ? '▲' : '▼'}</span>
      </button>

      {showAllFilters && (
        <div className={styles.allFilters}>
          {/* Search */}
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search films..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value })
                setActivePreset(null)
              }}
              className={styles.searchInput}
            />
          </div>

          {/* Runtime */}
          <div className={styles.filterSection}>
            <h4>Runtime</h4>
            <div className={styles.chips}>
              {[
                { id: 'under90', label: '< 90min' },
                { id: '90-120', label: '90-120' },
                { id: '120-180', label: '2-3hrs' },
                { id: 'over180', label: '3+hrs' },
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
          </div>

          {/* Genres */}
          <div className={styles.filterSection}>
            <h4>Genres</h4>
            <div className={styles.chips}>
              {allGenres.slice(0, 8).map(genre => (
                <button
                  key={genre}
                  className={`${styles.chip} ${filters.selectedGenres.includes(genre) ? styles.active : ''}`}
                  onClick={() => handleChipToggle('selectedGenres', genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Providers */}
          <div className={styles.filterSection}>
            <h4>Providers</h4>
            <div className={styles.chips}>
              {allProviders.slice(0, 6).map(provider => (
                <button
                  key={provider}
                  className={`${styles.chip} ${filters.selectedProviders.includes(provider) ? styles.active : ''}`}
                  onClick={() => handleChipToggle('selectedProviders', provider)}
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              className={styles.clearAll}
              onClick={() => {
                haptics.warning()
                clearFilters()
                setActivePreset(null)
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Film grid */}
      <div className={styles.filmGrid}>
        {films.slice(0, showAllFilters ? 9 : 18).map(film => (
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

export default QuickFilters
