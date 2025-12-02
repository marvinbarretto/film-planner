import PropTypes from 'prop-types'
import styles from './ExperimentsIndex.module.scss'

const experiments = [
  {
    id: 'fab-bottom-sheet',
    title: 'FAB + Bottom Sheet',
    description: 'Floating action button that opens a full-height bottom sheet with all filters',
    icon: '⬆️',
    tags: ['mobile-native', 'gesture'],
  },
  {
    id: 'swipe-filters',
    title: 'Swipe Carousel',
    description: 'Horizontal swipeable tabs for each filter category - thumb-friendly navigation',
    icon: '👆',
    tags: ['gesture', 'progressive'],
  },
  {
    id: 'accordion-filters',
    title: 'Accordion Filters',
    description: 'Collapsible sections with search always visible - compact but traditional',
    icon: '📂',
    tags: ['compact', 'familiar'],
  },
  {
    id: 'quick-filters',
    title: 'Smart Quick Filters',
    description: 'Pre-set filter combinations like "Free Tonight" and "Under 2hrs" - minimal UI',
    icon: '⚡',
    tags: ['minimal', 'smart'],
  },
]

function ExperimentsIndex({ onSelectExperiment, onBack }) {
  return (
    <div className={styles.index}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <span>&larr;</span> Back to App
        </button>
        <h1>Mobile Filter Experiments</h1>
        <p>Test different UX patterns for the FilterBar on mobile devices</p>
      </header>

      <div className={styles.grid}>
        {experiments.map(exp => (
          <button
            key={exp.id}
            className={styles.card}
            onClick={() => onSelectExperiment(exp.id)}
          >
            <span className={styles.icon}>{exp.icon}</span>
            <h2 className={styles.cardTitle}>{exp.title}</h2>
            <p className={styles.cardDescription}>{exp.description}</p>
            <div className={styles.tags}>
              {exp.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <footer className={styles.footer}>
        <p>All experiments use real film data and include haptic feedback (toggle in each experiment)</p>
      </footer>
    </div>
  )
}

ExperimentsIndex.propTypes = {
  onSelectExperiment: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default ExperimentsIndex
