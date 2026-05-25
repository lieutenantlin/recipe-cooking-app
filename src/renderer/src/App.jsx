import './styles/globals.css'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import PantryView from './components/PantryView'
import RecipesView from './components/RecipesView'
import SuggestionsView from './components/SuggestionsView'
import CalendarView from './components/CalendarView'

export default function App() {
  const [activeView, setActiveView] = useState('pantry')

  const handleViewRecipe = () => setActiveView('recipes')

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="app-main">
        {activeView === 'pantry' && <PantryView />}
        {activeView === 'recipes' && <RecipesView />}
        {activeView === 'suggestions' && <SuggestionsView onViewRecipe={handleViewRecipe} />}
        {activeView === 'calendar' && <CalendarView onViewRecipe={handleViewRecipe} />}
      </main>
    </div>
  )
}
