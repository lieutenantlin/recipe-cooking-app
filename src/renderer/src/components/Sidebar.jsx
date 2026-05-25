import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { key: 'pantry', label: 'Pantry', icon: PantryIcon },
  { key: 'recipes', label: 'Recipes', icon: RecipesIcon },
  { key: 'suggestions', label: 'Suggestions', icon: SuggestionsIcon },
  { key: 'calendar', label: 'Calendar', icon: CalendarIcon }
]

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>◐</span>
        <span className={styles.brandName}>
          Fridge<span className={styles.brandAccent}>Chef</span>
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

      <div className={styles.footer}>v0.1.0</div>
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
