import PropTypes from 'prop-types'
import FilmCard from '@components/FilmCard/FilmCard'
import styles from './FilmGrid.module.scss'

function FilmGrid({ films, onFilmClick, selectedCountry }) {
  if (films.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No films match your filters</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {films.map((film, index) => (
        <FilmCard
          key={`${film.tmdb_id || 'unknown'}-${film.title}-${index}`}
          film={film}
          selectedCountry={selectedCountry}
          onClick={() => onFilmClick && onFilmClick(film)}
        />
      ))}
    </div>
  )
}

FilmGrid.propTypes = {
  films: PropTypes.arrayOf(PropTypes.object).isRequired,
  onFilmClick: PropTypes.func,
  selectedCountry: PropTypes.string.isRequired
}

export default FilmGrid
