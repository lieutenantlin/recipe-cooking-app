# Glean

Smart recipe management from your pantry.

Glean is an Electron desktop app that helps you track pantry ingredients, manage recipes, and discover what you can cook with what you have on hand.

## Features

- **Pantry** — Track ingredients with quantities, units, and expiry dates. Visual freshness indicators (green/orange/red) show what's fresh, expiring, or expired.
- **Recipes** — Store your favorite recipes with full ingredient lists and instructions. Two-panel layout for browsing and editing.
- **Suggestions** — Cross-reference your pantry against your recipes. Three match modes: **Strict** (only if you have everything), **Partial** (match score), and **Substitution** (suggests ingredient swaps from a built-in substitution map).
- **Calendar** — 7-day expiry view showing what's about to expire and which recipes can use those ingredients.

## Architecture

```
src/
├── main/           # Electron main process
│   ├── index.js          — Window creation, app lifecycle
│   ├── database.js       — SQLite schema & queries (better-sqlite3)
│   └── ipc-handlers.js   — IPC channel handlers with validation
├── preload/
│   └── index.js          — contextBridge → window.api
└── renderer/
    └── src/
        ├── main.jsx           — React entry
        ├── App.jsx            — View routing via state
        ├── styles/globals.css — Design tokens (Warm Dark Kitchen theme)
        └── components/
            ├── Sidebar.jsx           — Navigation
            ├── PantryView.jsx        — Ingredient CRUD
            ├── RecipesView.jsx       — Recipe CRUD
            ├── SuggestionsView.jsx   — Recipe matching
            └── CalendarView.jsx      — Expiry calendar
```

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Electron 33 |
| Build | electron-vite 2.3, Vite 5.4 |
| UI | React 18.3 |
| Database | SQLite via better-sqlite3 11.5 |
| Native rebuild | @electron/rebuild 3.7 |

## Database

Tables: `ingredients`, `recipes`, `recipe_ingredients`, `settings`. Stored at `{userData}/recipe-app.db` with WAL journal mode and foreign keys enabled.

## IPC API

All channels return `{ ok, data?, error? }` envelope:

| Channel | Purpose |
|---------|---------|
| `ingredients:getAll` | List all ingredients |
| `ingredients:add` | Add ingredient |
| `ingredients:update` | Update ingredient fields |
| `ingredients:delete` | Remove ingredient |
| `ingredients:getExpiring` | Items expiring within 7 days |
| `recipes:getAll` | List all recipes with ingredients |
| `recipes:add` | Create recipe with ingredients |
| `recipes:update` | Update recipe and ingredients |
| `recipes:delete` | Remove recipe |
| `recipes:getMatches` | Match recipes to pantry (strict/partial/substitution) |
| `settings:get` | Read setting |
| `settings:update` | Write setting |

## Scripts

```bash
npm run dev        # Start dev server + Electron
npm run build      # Production build → out/
npm run preview    # Preview production build
npm run start      # Start Electron
npm run rebuild    # Rebuild native modules
```

## Design

Warm Dark Kitchen theme — a dark, warm editorial aesthetic inspired by cast iron, aged wood, and spices. Uses Fraunces (display), Source Sans 3 (body), JetBrains Mono (data). Custom properties throughout, 8-point spacing grid. See `DESIGN.md` for the full spec.
