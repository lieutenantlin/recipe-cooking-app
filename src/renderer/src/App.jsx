import './styles/globals.css'
import { useEffect, useLayoutEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import PantryView from './components/PantryView'
import RecipesView from './components/RecipesView'
import SuggestionsView from './components/SuggestionsView'
import CalendarView from './components/CalendarView'

const THEME_STORAGE_KEY = 'glean:theme'

function isTheme(value) {
  return value === 'light' || value === 'dark'
}

function getSystemTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

    if (isTheme(storedTheme)) {
      return storedTheme
    }
  } catch {
    // Ignore storage failures and fall back to the system preference.
  }

  return getSystemTheme()
}

function hasStoredTheme() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return isTheme(window.localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return false
  }
}

export default function App() {
  const [activeView, setActiveView] = useState('pantry')
  const [theme, setTheme] = useState(getInitialTheme)
  const [followsSystemTheme, setFollowsSystemTheme] = useState(() => !hasStoredTheme())

  const handleViewRecipe = () => setActiveView('recipes')
  const handleToggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light'

      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
      } catch {
        // Theme changes should still work even if persistence is unavailable.
      }

      return nextTheme
    })
    setFollowsSystemTheme(false)
  }

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (!followsSystemTheme || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const handleSystemThemeChange = (event) => setTheme(event.matches ? 'light' : 'dark')

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [followsSystemTheme])

  return (
    <div className="app-layout">
      <Sidebar
        activeView={activeView}
        theme={theme}
        onNavigate={setActiveView}
        onToggleTheme={handleToggleTheme}
      />
      <main className="app-main">
        {activeView === 'pantry' && <PantryView />}
        {activeView === 'recipes' && <RecipesView />}
        {activeView === 'suggestions' && <SuggestionsView onViewRecipe={handleViewRecipe} />}
        {activeView === 'calendar' && <CalendarView onViewRecipe={handleViewRecipe} />}
      </main>
    </div>
  )
}
