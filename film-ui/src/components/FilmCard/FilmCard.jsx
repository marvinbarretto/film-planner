import PropTypes from 'prop-types'
import styles from './FilmCard.module.scss'

function FilmCard({ film, onClick }) {
  const {
    title,
    year,
    poster_url,
    tmdb_rating,
    runtime,
    genres,
    prime,
    free_any,
    providers,
    suggested_by,
    not_found_on_tmdb
  } = film

  const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Check if actually on Amazon Prime Video (not just Amazon channels)
  const isRealPrime = providers?.some(p =>
    p === 'Amazon Prime Video' || p === 'Amazon Prime Video with Ads'
  )

  const posterPlaceholder = 'https://via.placeholder.com/500x750/1f1f1f/666?text=No+Poster'

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.posterContainer}>
        <img
          src={poster_url || posterPlaceholder}
          alt={`${title} poster`}
          className={styles.poster}
          loading="lazy"
        />

        {/* Availability badges */}
        <div className={styles.badges}>
          {not_found_on_tmdb && (
            <span className={`${styles.badge} ${styles.notFound}`}>
              Not Found
            </span>
          )}
          {!not_found_on_tmdb && isRealPrime && (
            <span className={`${styles.badge} ${styles.prime}`}>
              Prime
            </span>
          )}
          {!not_found_on_tmdb && free_any && !isRealPrime && (
            <span className={`${styles.badge} ${styles.free}`}>
              Free
            </span>
          )}
        </div>

        {/* Rating overlay */}
        {tmdb_rating && (
          <div className={styles.rating}>
            <span className={styles.star}>★</span>
            <span className={styles.ratingValue}>{tmdb_rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>

        {suggested_by && (
          <div className={styles.suggestedByBadge}>
            <span className={styles.icon}>👤</span>
            {suggested_by}
          </div>
        )}

        <div className={styles.meta}>
          <span className={styles.year}>{year}</span>
          {runtime && (
            <>
              <span className={styles.separator}>•</span>
              <span className={styles.runtime}>{formatRuntime(runtime)}</span>
            </>
          )}
        </div>

        {genres && genres.length > 0 && (
          <div className={styles.genres}>
            {genres.slice(0, 3).map(genre => (
              <span key={genre} className={styles.genre}>{genre}</span>
            ))}
          </div>
        )}

        {providers && providers.length > 0 && (
          <div className={styles.providers}>
            {providers.map(provider => (
              <span key={provider} className={styles.provider}>{provider}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

FilmCard.propTypes = {
  film: PropTypes.shape({
    title: PropTypes.string.isRequired,
    year: PropTypes.string,
    poster_url: PropTypes.string,
    tmdb_rating: PropTypes.number,
    runtime: PropTypes.number,
    genres: PropTypes.arrayOf(PropTypes.string),
    prime: PropTypes.bool,
    free_any: PropTypes.bool,
    providers: PropTypes.arrayOf(PropTypes.string),
    suggested_by: PropTypes.string,
    not_found_on_tmdb: PropTypes.bool
  }).isRequired,
  onClick: PropTypes.func
}

export default FilmCard
