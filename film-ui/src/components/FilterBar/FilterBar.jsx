import PropTypes from 'prop-types'
import styles from './FilterBar.module.scss'

function FilterBar({ filters, onFiltersChange, genres, providers, suggestedBy, sortBy, onSortChange }) {
  const handleSearchChange = (e) => {
    onFiltersChange({ ...filters, search: e.target.value })
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
      showFreeOnly: false,
      selectedGenres: [],
      selectedProviders: [],
      selectedSuggestedBy: []
    })
  }

  const hasActiveFilters = filters.search ||
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
        <div className={styles.sortContainer}>
          <label htmlFor="sort-select" className={styles.sortLabel}>Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="rating-desc">Rating (High to Low)</option>
            <option value="rating-asc">Rating (Low to High)</option>
            <option value="runtime-asc">Runtime (Short to Long)</option>
            <option value="runtime-desc">Runtime (Long to Short)</option>
            <option value="year-desc">Year (Newest First)</option>
            <option value="year-asc">Year (Oldest First)</option>
            <option value="title-asc">Title (A-Z)</option>
          </select>
        </div>

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
        <div className={styles.providersSection}>
          <h4 className={styles.sectionTitle}>
            Streaming Providers
            {filters.selectedProviders.length > 0 && (
              <span className={styles.count}>({filters.selectedProviders.length})</span>
            )}
          </h4>
          <div className={styles.providerChips}>
            {/* Preset/priority providers first */}
            {['Amazon Prime Video', 'Netflix', 'Disney Plus', 'BBC iPlayer'].map(preset => {
              if (providers.includes(preset)) {
                return (
                  <button
                    key={preset}
                    className={`${styles.providerChip} ${styles.preset} ${filters.selectedProviders.includes(preset) ? styles.active : ''}`}
                    onClick={() => handleProviderClick(preset)}
                  >
                    {preset}
                  </button>
                )
              }
              return null
            })}

            {/* Separator */}
            {providers.some(p => ['Amazon Prime Video', 'Netflix', 'Disney Plus', 'BBC iPlayer'].includes(p)) &&
             providers.some(p => !['Amazon Prime Video', 'Netflix', 'Disney Plus', 'BBC iPlayer'].includes(p)) && (
              <div className={styles.separator}></div>
            )}

            {/* All other providers */}
            {providers
              .filter(p => !['Amazon Prime Video', 'Netflix', 'Disney Plus', 'BBC iPlayer'].includes(p))
              .map(provider => (
                <button
                  key={provider}
                  className={`${styles.providerChip} ${filters.selectedProviders.includes(provider) ? styles.active : ''}`}
                  onClick={() => handleProviderClick(provider)}
                >
                  {provider}
                </button>
              ))}
          </div>
        </div>
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
    showFreeOnly: PropTypes.bool,
    selectedGenres: PropTypes.arrayOf(PropTypes.string),
    selectedProviders: PropTypes.arrayOf(PropTypes.string),
    selectedSuggestedBy: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  genres: PropTypes.arrayOf(PropTypes.string),
  providers: PropTypes.arrayOf(PropTypes.string),
  suggestedBy: PropTypes.arrayOf(PropTypes.string),
  sortBy: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired
}

export default FilterBar
