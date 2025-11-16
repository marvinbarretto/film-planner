import PropTypes from 'prop-types'
import styles from './CountrySelector.module.scss'

const COUNTRIES = [
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: 'NZ', flag: '🇳🇿', name: 'New Zealand' }
]

function CountrySelector({ selectedCountry, onCountryChange }) {
  return (
    <div className={styles.countrySelector}>
      <span className={styles.label}>Region:</span>
      <div className={styles.flags}>
        {COUNTRIES.map(country => (
          <button
            key={country.code}
            className={`${styles.flagButton} ${selectedCountry === country.code ? styles.active : ''}`}
            onClick={() => onCountryChange(country.code)}
            title={country.name}
            aria-label={`Switch to ${country.name}`}
          >
            {country.flag}
          </button>
        ))}
      </div>
    </div>
  )
}

CountrySelector.propTypes = {
  selectedCountry: PropTypes.string.isRequired,
  onCountryChange: PropTypes.func.isRequired
}

export default CountrySelector
