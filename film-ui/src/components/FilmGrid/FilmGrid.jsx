import PropTypes from 'prop-types'
import FilmCard from '@components/FilmCard/FilmCard'
import styles from './FilmGrid.module.scss'

function FilmGrid({ films, onFilmClick }) {
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
          key={film.tmdb_id || index}
          film={film}
          onClick={() => onFilmClick && onFilmClick(film)}
        />
      ))}
    </div>
  )
}

FilmGrid.propTypes = {
  films: PropTypes.arrayOf(PropTypes.object).isRequired,
  onFilmClick: PropTypes.func
}

export default FilmGrid
