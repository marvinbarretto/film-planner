import PropTypes from 'prop-types'
import styles from './FilterBar.module.scss'

function FilterBar({ filters, onFiltersChange, genres, providers, suggestedBy }) {
  const handleSearchChange = (e) => {
    onFiltersChange({ ...filters, search: e.target.value })
  }

  const handlePrimeToggle = () => {
    onFiltersChange({ ...filters, showPrimeOnly: !filters.showPrimeOnly })
  }

  const handleFreeToggle = () => {
    onFiltersChange({ ...filters, showFreeOnly: !filters.showFreeOnly })
  }

  const handleGenreClick = (genre) => {
    onFiltersChange({
      ...filters,
      selectedGenres: filters.selectedGenres.includes(genre)
        ? filters.selectedGenres.filter(g => g !== genre)  // Remove if already selected
        : [...filters.selectedGenres, genre]  // Add if not selected
    })
  }

  const handleProviderClick = (provider) => {
    onFiltersChange({
      ...filters,
      selectedProviders: filters.selectedProviders.includes(provider)
        ? filters.selectedProviders.filter(p => p !== provider)
        : [...filters.selectedProviders, provider]
    })
  }

  const handleSuggestedByClick = (person) => {
    onFiltersChange({
      ...filters,
      selectedSuggestedBy: filters.selectedSuggestedBy.includes(person)
        ? filters.selectedSuggestedBy.filter(s => s !== person)
        : [...filters.selectedSuggestedBy, person]
    })
  }

  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      showPrimeOnly: false,
      showFreeOnly: false,
      selectedGenres: [],
      selectedProviders: [],
      selectedSuggestedBy: []
    })
  }

  const hasActiveFilters = filters.search ||
    filters.showPrimeOnly ||
    filters.showFreeOnly ||
    filters.selectedGenres.length > 0 ||
    filters.selectedProviders.length > 0 ||
    filters.selectedSuggestedBy.length > 0

  return (
    <div className={styles.filterBar}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search films..."
          value={filters.search}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        {filters.search && (
          <button
            onClick={() => onFiltersChange({ ...filters, search: '' })}
            className={styles.clearSearch}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className={styles.toggles}>
        <button
          className={`${styles.toggle} ${filters.showPrimeOnly ? styles.active : ''}`}
          onClick={handlePrimeToggle}
        >
          <span className={styles.toggleIcon}>🎬</span>
          Prime Only
        </button>

        <button
          className={`${styles.toggle} ${filters.showFreeOnly ? styles.active : ''}`}
          onClick={handleFreeToggle}
        >
          <span className={styles.toggleIcon}>🆓</span>
          Free Only
        </button>
      </div>

      {hasActiveFilters && (
        <button onClick={handleClearFilters} className={styles.clearAll}>
          Clear All
        </button>
      )}

      {genres && genres.length > 0 && (
        <div className={styles.genresSection}>
          <div className={styles.genreChips}>
            {genres.map(genre => (
              <button
                key={genre}
                className={`${styles.genreChip} ${filters.selectedGenres.includes(genre) ? styles.active : ''}`}
                onClick={() => handleGenreClick(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}

      {providers && providers.length > 0 && (
        <details className={styles.providersSection}>
          <summary className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              Streaming Providers
              {filters.selectedProviders.length > 0 && (
                <span className={styles.count}>({filters.selectedProviders.length})</span>
              )}
            </span>
            <span className={styles.chevron}>▼</span>
          </summary>
          <div className={styles.providerChips}>
            {providers.map(provider => (
              <button
                key={provider}
                className={`${styles.providerChip} ${filters.selectedProviders.includes(provider) ? styles.active : ''}`}
                onClick={() => handleProviderClick(provider)}
              >
                {provider}
              </button>
            ))}
          </div>
        </details>
      )}

      {suggestedBy && suggestedBy.length > 0 && (
        <div className={styles.suggestedBySection}>
          <h4 className={styles.sectionTitle}>
            Suggested By
            {filters.selectedSuggestedBy.length > 0 && (
              <span className={styles.count}>({filters.selectedSuggestedBy.length})</span>
            )}
          </h4>
          <div className={styles.suggestedByChips}>
            {suggestedBy.map(person => (
              <button
                key={person}
                className={`${styles.suggestedByChip} ${filters.selectedSuggestedBy.includes(person) ? styles.active : ''}`}
                onClick={() => handleSuggestedByClick(person)}
              >
                {person}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

FilterBar.propTypes = {
  filters: PropTypes.shape({
    search: PropTypes.string,
    showPrimeOnly: PropTypes.bool,
    showFreeOnly: PropTypes.bool,
    selectedGenres: PropTypes.arrayOf(PropTypes.string),
    selectedProviders: PropTypes.arrayOf(PropTypes.string),
    selectedSuggestedBy: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  genres: PropTypes.arrayOf(PropTypes.string),
  providers: PropTypes.arrayOf(PropTypes.string),
  suggestedBy: PropTypes.arrayOf(PropTypes.string)
}

export default FilterBar
