import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { key: 'pantry', label: 'Pantry', icon: PantryIcon },
  { key: 'recipes', label: 'Recipes', icon: RecipesIcon },
  { key: 'suggestions', label: 'Suggestions', icon: SuggestionsIcon },
  { key: 'calendar', label: 'Calendar', icon: CalendarIcon }
]

export default function Sidebar({ activeView, theme, onNavigate, onToggleTheme }) {
  const isLightTheme = theme === 'light'

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>◐</span>
        <span className={styles.brandName}>
          <span className={styles.brandAccent}>G</span>lean
        </span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = activeView === key
          return (
            <button
              key={key}
              type="button"
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              onClick={() => onNavigate(key)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={styles.icon} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      <div className={styles.footer}>
        <span>v0.1.0</span>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={onToggleTheme}
          aria-pressed={isLightTheme}
          aria-label={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
          title={isLightTheme ? 'Dark mode' : 'Light mode'}
        >
          {isLightTheme ? <MoonIcon className={styles.icon} /> : <SunIcon className={styles.icon} />}
        </button>
      </div>
    </aside>
  )
}

function PantryIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4h14v16H5z" />
      <path d="M5 12h14" />
      <path d="M9 8v0.01" />
      <path d="M9 16v0.01" />
    </svg>
  )
}

function RecipesIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z" />
      <path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2" />
      <path d="M9 8h7" />
      <path d="M9 12h7" />
      <path d="M9 16h4" />
    </svg>
  )
}

function SuggestionsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0-4 10.5V16a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.5A6 6 0 0 0 12 3z" />
      <path d="M10 21h4" />
    </svg>
  )
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  )
}

function SunIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2" />
      <path d="M12 19.5v2" />
      <path d="m4.6 4.6 1.4 1.4" />
      <path d="m18 18 1.4 1.4" />
      <path d="M2.5 12h2" />
      <path d="M19.5 12h2" />
      <path d="m4.6 19.4 1.4-1.4" />
      <path d="m18 6 1.4-1.4" />
    </svg>
  )
}

function MoonIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.5 14.5A8 8 0 0 1 9.5 3.5a7 7 0 1 0 11 11z" />
    </svg>
  )
}
