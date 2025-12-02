import PropTypes from 'prop-types'
import { useHaptics } from './useHaptics'
import styles from './ExperimentLayout.module.scss'

function ExperimentLayout({
  title,
  description,
  children,
  onBack,
  showHapticsToggle = true
}) {
  const { hapticsEnabled, toggleHaptics, isSupported } = useHaptics()

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <span className={styles.backArrow}>&larr;</span>
          Back
        </button>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {showHapticsToggle && isSupported && (
          <button
            className={`${styles.hapticsToggle} ${hapticsEnabled ? styles.active : ''}`}
            onClick={toggleHaptics}
            title={hapticsEnabled ? 'Haptics enabled' : 'Haptics disabled'}
          >
            {hapticsEnabled ? '📳' : '📴'}
          </button>
        )}
      </header>

      <div className={styles.mobileViewport}>
        <div className={styles.phoneFrame}>
          <div className={styles.notch} />
          <div className={styles.screen}>
            {children}
          </div>
          <div className={styles.homeIndicator} />
        </div>
      </div>

      <footer className={styles.footer}>
        <p>Test on a real mobile device for haptic feedback</p>
      </footer>
    </div>
  )
}

ExperimentLayout.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  onBack: PropTypes.func.isRequired,
  showHapticsToggle: PropTypes.bool,
}

export default ExperimentLayout
