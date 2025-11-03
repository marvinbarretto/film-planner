import { useEffect } from 'react'
import PropTypes from 'prop-types'
import styles from './TrailerModal.module.scss'

function TrailerModal({ film, onClose }) {
  const {
    title,
    year,
    poster_url,
    backdrop_url,
    tmdb_rating,
    runtime,
    genres,
    overview,
    trailer_url,
    prime,
    free_any,
    providers,
    suggested_by,
    notes
  } = film

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null
    const videoId = url.split('v=')[1]?.split('&')[0]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  const embedUrl = getYouTubeEmbedUrl(trailer_url)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        {/* Hero section with backdrop */}
        <div
          className={styles.hero}
          style={{
            backgroundImage: backdrop_url ? `url(${backdrop_url})` : 'none'
          }}
        >
          <div className={styles.heroOverlay}>
            <div className={styles.heroContent}>
              <h2 className={styles.title}>{title}</h2>
              <div className={styles.meta}>
                <span className={styles.year}>{year}</span>
                {tmdb_rating && (
                  <>
                    <span className={styles.separator}>•</span>
                    <span className={styles.rating}>
                      <span className={styles.star}>★</span> {tmdb_rating.toFixed(1)}
                    </span>
                  </>
                )}
                {runtime && (
                  <>
                    <span className={styles.separator}>•</span>
                    <span>{formatRuntime(runtime)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.main}>
            {/* Trailer */}
            {embedUrl && (
              <div className={styles.trailerContainer}>
                <iframe
                  className={styles.trailer}
                  src={embedUrl}
                  title={`${title} trailer`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Overview */}
            {overview && (
              <div className={styles.section}>
                <h3>Overview</h3>
                <p>{overview}</p>
              </div>
            )}

            {/* Genres */}
            {genres && genres.length > 0 && (
              <div className={styles.section}>
                <h3>Genres</h3>
                <div className={styles.genres}>
                  {genres.map(genre => (
                    <span key={genre} className={styles.genre}>{genre}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Where to Watch */}
            {providers && providers.length > 0 && (
              <div className={styles.section}>
                <h3>Where to Watch</h3>
                <div className={styles.providers}>
                  {providers.map(provider => (
                    <div key={provider} className={styles.provider}>
                      {provider}
                      {prime && provider.includes('Prime') && (
                        <span className={styles.badge}>✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal notes */}
            {(suggested_by || notes) && (
              <div className={styles.section}>
                <h3>Your Notes</h3>
                {suggested_by && (
                  <p><strong>Suggested by:</strong> {suggested_by}</p>
                )}
                {notes && <p>{notes}</p>}
              </div>
            )}
          </div>

          <div className={styles.sidebar}>
            {poster_url && (
              <img src={poster_url} alt={`${title} poster`} className={styles.poster} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

TrailerModal.propTypes = {
  film: PropTypes.shape({
    title: PropTypes.string.isRequired,
    year: PropTypes.string,
    poster_url: PropTypes.string,
    backdrop_url: PropTypes.string,
    tmdb_rating: PropTypes.number,
    runtime: PropTypes.number,
    genres: PropTypes.arrayOf(PropTypes.string),
    overview: PropTypes.string,
    trailer_url: PropTypes.string,
    prime: PropTypes.bool,
    free_any: PropTypes.bool,
    providers: PropTypes.arrayOf(PropTypes.string),
    suggested_by: PropTypes.string,
    notes: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired
}

export default TrailerModal
