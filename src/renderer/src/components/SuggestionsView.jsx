import { useCallback, useEffect, useState } from 'react'
import styles from './SuggestionsView.module.css'

const MODES = [
  { key: 'strict', label: 'Strict' },
  { key: 'partial', label: 'Partial' },
  { key: 'substitution', label: 'Substitution' }
]

export default function SuggestionsView({ onViewRecipe }) {
  const [matches, setMatches] = useState([])
  const [mode, setMode] = useState('partial')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadMatches = useCallback(async (currentMode) => {
    setLoading(true)
    setError(null)
    try {
      const matchRes = await window.api.recipes.getMatches(currentMode)
      if (matchRes.ok) {
        setMatches(matchRes.data || [])
      } else {
        setError(matchRes.error || 'Failed to load matches')
      }
    } catch (err) {
      setError(err.message || 'Unexpected error loading suggestions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    window.api.settings.get('match_mode').then((res) => {
      const savedMode = res.ok && res.data ? res.data : 'partial'
      setMode(savedMode)
      loadMatches(savedMode)
    })
  }, [loadMatches])

  async function handleModeChange(newMode) {
    if (newMode === mode) return
    setMode(newMode)
    try {
      await window.api.settings.update('match_mode', newMode)
    } catch {
      // Non-fatal: continue to load matches even if settings save fails
    }
    loadMatches(newMode)
  }

  return (
    <div className={styles.view}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Recipe Suggestions</h1>
          <span className={styles.subtitle}>What you can cook with what you have.</span>
        </div>
        <div className={styles.modeSelector} role="group" aria-label="Match mode">
          {MODES.map((m) => {
            const isActive = m.key === mode
            return (
              <button
                key={m.key}
                type="button"
                className={`${styles.modeBtn} ${isActive ? styles.modeBtnActive : ''}`}
                onClick={() => handleModeChange(m.key)}
                aria-pressed={isActive}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </header>

      {error && <div className={styles.viewError}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Finding what you can make…</div>
      ) : matches.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Nothing to suggest yet</div>
          <div className={styles.emptySubtitle}>
            Add ingredients to your pantry and recipes to your cookbook, then come back.
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {matches.map((match) => (
            <MatchCard
              key={match.recipe.id}
              match={match}
              mode={mode}
              onViewRecipe={onViewRecipe}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MatchCard({ match, mode, onViewRecipe }) {
  const { recipe, matchScore, missingIngredients, presentIngredients, substitutions } = match
  const percent = Math.round((matchScore ?? 0) * 100)
  const fillColor = scoreColor(matchScore)

  const subsArray =
    substitutions && !Array.isArray(substitutions)
      ? Object.entries(substitutions).map(([from, to]) => ({ from, to }))
      : (substitutions ?? [])
  const hasSubs = mode === 'substitution' && subsArray.length > 0

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{recipe.title}</h2>
        <span className={styles.scoreText} style={{ color: fillColor }}>
          {percent}%
        </span>
      </div>

      <div
        className={styles.scoreBar}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Match score ${percent}%`}
      >
        <div
          className={styles.scoreFill}
          style={{ width: `${percent}%`, background: fillColor }}
        />
      </div>

      <div className={styles.lists}>
        {presentIngredients && presentIngredients.length > 0 && (
          <div className={styles.listBlock}>
            <div className={styles.listLabel}>You have</div>
            <ul className={styles.ingredientList}>
              {presentIngredients.map((name) => (
                <li key={`have-${name}`} className={styles.ingredientItem}>
                  <span className={`${styles.dot} ${styles.dotFresh}`} aria-hidden="true" />
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {missingIngredients && missingIngredients.length > 0 && (
          <div className={styles.listBlock}>
            <div className={styles.listLabel}>You need</div>
            <ul className={styles.ingredientList}>
              {missingIngredients.map((name) => (
                <li key={`miss-${name}`} className={styles.ingredientItem}>
                  <span className={`${styles.dot} ${styles.dotWarning}`} aria-hidden="true" />
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {hasSubs && (
        <div className={styles.subsBlock}>
          <div className={styles.listLabel}>Can substitute</div>
          <ul className={styles.subsList}>
            {subsArray.map((s, idx) => (
              <li key={idx} className={styles.subsItem}>
                <span className={styles.subsFrom}>{s.from}</span>
                <span className={styles.subsArrow} aria-hidden="true">
                  →
                </span>
                <span className={styles.subsTo}>{s.to}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.cardFooter}>
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

function scoreColor(score) {
  if (score >= 1) return 'var(--fresh)'
  if (score >= 0.5) return 'var(--warning)'
  return 'var(--danger)'
}
