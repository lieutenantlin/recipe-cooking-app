import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './CalendarView.module.css'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MS_PER_DAY = 1000 * 60 * 60 * 24

export default function CalendarView({ onViewRecipe }) {
  const [ingredients, setIngredients] = useState([])
  const [expiringIngredients, setExpiringIngredients] = useState([])
  const [urgentMatches, setUrgentMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [allRes, expiringRes, matchRes] = await Promise.all([
        window.api.ingredients.getAll(),
        window.api.ingredients.getExpiring(),
        window.api.recipes.getMatches('partial')
      ])
      if (allRes.ok) {
        setIngredients(allRes.data || [])
      } else {
        setError(allRes.error || 'Failed to load ingredients')
      }
      if (expiringRes.ok) {
        setExpiringIngredients(expiringRes.data || [])
      }
      if (matchRes.ok) {
        const expiringNames = new Set(
          (expiringRes.ok ? expiringRes.data ?? [] : []).map((i) => i.name.toLowerCase())
        )
        const urgent = (matchRes.data ?? []).filter((m) =>
          (m.presentIngredients ?? []).some((name) =>
            expiringNames.has(String(name).toLowerCase())
          )
        )
        setUrgentMatches(urgent)
      }
    } catch (err) {
      setError(err.message || 'Unexpected error loading calendar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const todayKey = new Date().toDateString()
  const weekDays = useMemo(() => getWeekDays(), [todayKey])
  const today = weekDays[0]
  const lastDay = weekDays[weekDays.length - 1]

  // Build ingredients-per-day map. Expired (before today) all bucket to today.
  const ingredientsByDay = useMemo(() => {
    const buckets = weekDays.map(() => [])
    for (const ing of ingredients) {
      if (!ing.expiry_date) continue
      const expiry = parseLocalDate(ing.expiry_date)
      if (!expiry) continue
      const daysFromToday = daysBetween(today, expiry)
      if (daysFromToday < 0) {
        buckets[0].push({ ...ing, daysLeft: daysFromToday, expired: true })
      } else if (daysFromToday >= 0 && daysFromToday < 7) {
        buckets[daysFromToday].push({ ...ing, daysLeft: daysFromToday, expired: false })
      }
    }
    return buckets
  }, [ingredients, weekDays, today])

  const expiringNamesSet = useMemo(
    () => new Set(expiringIngredients.map((i) => i.name.toLowerCase())),
    [expiringIngredients]
  )

  return (
    <div className={styles.view}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>This Week</h1>
          <span className={styles.subtitle}>
            {formatDateRange(today, lastDay)}
          </span>
        </div>
      </header>

      {error && <div className={styles.viewError}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading your week…</div>
      ) : (
        <>
          <div className={styles.weekGrid}>
            {weekDays.map((date, idx) => {
              const items = ingredientsByDay[idx]
              const isToday = idx === 0
              const dayName = DAY_NAMES[date.getDay()]
              const ariaLabel = `${dayName} ${date.toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric'
              })}${isToday ? ' (today)' : ''}`
              return (
                <div
                  key={idx}
                  className={`${styles.dayCol} ${isToday ? styles.dayColToday : ''}`}
                  aria-label={ariaLabel}
                >
                  <div className={styles.dayHead}>
                    <div className={styles.dayName}>
                      {isToday ? 'Today' : dayName}
                    </div>
                    <div className={styles.dayNumber}>{date.getDate()}</div>
                  </div>
                  <div className={styles.chipList}>
                    {items.length === 0 ? (
                      <div className={styles.dayEmpty} aria-hidden="true">
                        —
                      </div>
                    ) : (
                      items.map((ing) => (
                        <IngredientChip key={ing.id} ingredient={ing} />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <section className={styles.urgentSection} aria-label="Use these up">
            <h2 className={styles.urgentTitle}>Use These Up</h2>
            {expiringIngredients.length === 0 ? (
              <div className={styles.urgentEmpty}>
                Nothing expiring this week 🎉
              </div>
            ) : urgentMatches.length === 0 ? (
              <div className={styles.urgentEmpty}>
                No matching recipes for your expiring ingredients yet.
              </div>
            ) : (
              <div className={styles.urgentGrid}>
                {urgentMatches.map((match) => (
                  <UrgentCard
                    key={match.recipe.id}
                    match={match}
                    expiringNames={expiringNamesSet}
                    onViewRecipe={onViewRecipe}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function IngredientChip({ ingredient }) {
  const { name, daysLeft, expired } = ingredient
  let chipClass = styles.chip
  let label = ''
  if (expired) {
    chipClass = `${styles.chip} ${styles.chipExpired}`
    label = 'Expired'
  } else if (daysLeft === 0) {
    chipClass = `${styles.chip} ${styles.chipDanger}`
    label = 'Today!'
  } else if (daysLeft <= 3) {
    chipClass = `${styles.chip} ${styles.chipExpiring}`
    label = `${daysLeft}d`
  } else {
    chipClass = `${styles.chip} ${styles.chipSoft}`
    label = `${daysLeft}d`
  }
  return (
    <div className={chipClass} title={`${name} — ${label}`}>
      <span className={styles.chipName}>{name}</span>
      <span className={styles.chipMeta}>{label}</span>
    </div>
  )
}

function UrgentCard({ match, expiringNames, onViewRecipe }) {
  const { recipe, presentIngredients } = match
  const usedExpiring = (presentIngredients ?? []).filter((n) =>
    expiringNames.has(String(n).toLowerCase())
  )
  return (
    <article className={styles.urgentCard}>
      <div className={styles.urgentCardHeader}>
        <h3 className={styles.urgentCardTitle}>{recipe.title}</h3>
      </div>
      <div className={styles.urgentUses}>
        <span className={styles.urgentLabel}>Uses</span>
        <div className={styles.urgentChipRow}>
          {usedExpiring.map((name) => (
            <span key={name} className={`${styles.chip} ${styles.chipExpiring}`}>
              <span className={styles.chipName}>{name}</span>
            </span>
          ))}
        </div>
      </div>
      <div className={styles.urgentFooter}>
        <button
          type="button"
          className={styles.viewBtn}
          onClick={() => onViewRecipe && onViewRecipe(recipe.id)}
          aria-label={`View recipe: ${recipe.title}`}
        >
          View Recipe
        </button>
      </div>
    </article>
  )
}

/* Helpers */

function getWeekDays() {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

function daysBetween(a, b) {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / MS_PER_DAY)
}

function parseLocalDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return null
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateRange(start, end) {
  if (!start || !end) return ''
  const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const endStr = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  return `${startStr} – ${endStr}`
}
