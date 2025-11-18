import PropTypes from 'prop-types'
import styles from './FilmCard.module.scss'

function FilmCard({ film, selectedCountry, onClick }) {
  const {
    title,
    year,
    poster_url,
    tmdb_rating,
    runtime,
    genres,
    suggested_by,
    not_found_on_tmdb,
    availability
  } = film

  // Get country-specific availability data
  const countryData = availability?.[selectedCountry] || { providers: [], prime: false, free_any: false }
  const { providers, prime, free_any } = countryData

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
      {/* Poster on the left - hidden on mobile */}
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
      </div>

      {/* Info section */}
      <div className={styles.info}>
        <div className={styles.mainInfo}>
          <h3 className={styles.title}>
            {title} <span className={styles.year}>({year})</span>
          </h3>

          <div className={styles.meta}>
            {tmdb_rating && (
              <>
                <div className={styles.rating}>
                  <span className={styles.star}>★</span>
                  <span className={styles.ratingValue}>{tmdb_rating.toFixed(1)}</span>
                </div>
                <span className={styles.separator}>•</span>
              </>
            )}
            {runtime && (
              <>
                <span className={styles.separator}>•</span>
                <span className={styles.runtime}>{formatRuntime(runtime)}</span>
              </>
            )}
            {film.collections && film.collections.length > 0 && (
              <>
                <span className={styles.separator}>•</span>
                {film.collections.map((collection, idx) => {
                  const meta = film.collection_metas?.find(m => m.collection === collection)
                  let label = collection.charAt(0).toUpperCase() + collection.slice(1)
                  if (meta?.spine_number) label += ` #${meta.spine_number}`
                  else if (meta?.rank) label += ` #${meta.rank}`

                  return (
                    <span key={collection} className={styles.collectionBadge}>
                      {idx === 0 && <span className={styles.icon}>📚</span>}
                      {label}
                      {idx < film.collections.length - 1 && <span className={styles.collectionSeparator}> + </span>}
                    </span>
                  )
                })}
              </>
            )}
          </div>

          {genres && genres.length > 0 && (
            <div className={styles.genres}>
              {genres.map(genre => (
                <span key={genre} className={styles.genre}>{genre}</span>
              ))}
            </div>
          )}

          {providers && providers.length > 0 && (
            <>
              <div className={styles.divider}></div>
              <div className={styles.providers}>
                <span className={styles.icon}>📺</span>
                {providers.map(provider => (
                  <span key={provider} className={styles.provider}>{provider}</span>
                ))}
              </div>
            </>
          )}

          {suggested_by && (
            <div className={styles.suggestedBy}>
              <span className={styles.icon}>👤</span>
              Suggested by {suggested_by}
            </div>
          )}
        </div>

        {/* Desktop-only provider display on right side */}
        {providers && providers.length > 0 && (
          <div className={styles.providersDesktop}>
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
    suggested_by: PropTypes.string,
    not_found_on_tmdb: PropTypes.bool,
    availability: PropTypes.objectOf(PropTypes.shape({
      providers: PropTypes.arrayOf(PropTypes.string),
      prime: PropTypes.bool,
      free_any: PropTypes.bool
    })),
    collection: PropTypes.string,
    collection_meta: PropTypes.shape({
      spine_number: PropTypes.string,
      director: PropTypes.string
    })
  }).isRequired,
  selectedCountry: PropTypes.string.isRequired,
  onClick: PropTypes.func
}

export default FilmCard
