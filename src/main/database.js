import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db = null

const SCHEMA = `
CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT '',
  expiry_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`

const SUBSTITUTIONS = {
  cream: 'milk',
  milk: 'cream',
  butter: 'olive oil',
  'olive oil': 'butter',
  egg: 'flax egg',
  eggs: 'flax egg',
  flour: 'almond flour',
  'almond flour': 'flour',
  sugar: 'honey',
  honey: 'sugar',
  'lemon juice': 'lime juice',
  'lime juice': 'lemon juice',
  'sour cream': 'greek yogurt',
  'greek yogurt': 'sour cream',
  breadcrumbs: 'crushed crackers',
  wine: 'chicken broth',
  'chicken broth': 'wine',
  mayonnaise: 'greek yogurt'
}

export function initDatabase() {
  const dbPath = join(app.getPath('userData'), 'recipe-app.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('match_mode', 'partial')`).run()
  return db
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

// --- Ingredients ---

export function getIngredients() {
  return getDatabase().prepare('SELECT * FROM ingredients ORDER BY created_at DESC').all()
}

export function addIngredient(data) {
  const { name, quantity = 1, unit = '', expiry_date = null } = data
  const stmt = getDatabase().prepare(
    'INSERT INTO ingredients (name, quantity, unit, expiry_date) VALUES (?, ?, ?, ?)'
  )
  const info = stmt.run(name, quantity, unit, expiry_date)
  return getDatabase().prepare('SELECT * FROM ingredients WHERE id = ?').get(info.lastInsertRowid)
}

export function updateIngredient(id, data) {
  const existing = getDatabase().prepare('SELECT * FROM ingredients WHERE id = ?').get(id)
  if (!existing) return null
  const merged = {
    name: data.name ?? existing.name,
    quantity: data.quantity ?? existing.quantity,
    unit: data.unit ?? existing.unit,
    expiry_date: data.expiry_date ?? existing.expiry_date
  }
  getDatabase()
    .prepare(
      'UPDATE ingredients SET name = ?, quantity = ?, unit = ?, expiry_date = ? WHERE id = ?'
    )
    .run(merged.name, merged.quantity, merged.unit, merged.expiry_date, id)
  return getDatabase().prepare('SELECT * FROM ingredients WHERE id = ?').get(id)
}

export function deleteIngredient(id) {
  const info = getDatabase().prepare('DELETE FROM ingredients WHERE id = ?').run(id)
  return { deleted: info.changes > 0 }
}

export function getExpiringIngredients() {
  // ingredients where expiry_date is within 7 days from today (and not null)
  const pad = (n) => String(n).padStart(2, '0')
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const future = new Date(now)
  future.setDate(future.getDate() + 7)
  const sevenStr = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}`
  return getDatabase()
    .prepare(
      `SELECT * FROM ingredients
       WHERE expiry_date IS NOT NULL
         AND expiry_date != ''
         AND expiry_date >= ?
         AND expiry_date <= ?
       ORDER BY expiry_date ASC`
    )
    .all(todayStr, sevenStr)
}

// --- Recipes ---

function hydrateRecipe(recipe) {
  if (!recipe) return null
  const ingredients = getDatabase()
    .prepare('SELECT id, name, quantity, unit FROM recipe_ingredients WHERE recipe_id = ?')
    .all(recipe.id)
  return { ...recipe, ingredients }
}

export function getRecipes() {
  const recipes = getDatabase().prepare('SELECT * FROM recipes ORDER BY created_at DESC').all()
  return recipes.map(hydrateRecipe)
}

export function getRecipe(id) {
  const recipe = getDatabase().prepare('SELECT * FROM recipes WHERE id = ?').get(id)
  return hydrateRecipe(recipe)
}

export function addRecipe(data) {
  const { title, instructions = '', ingredients = [] } = data
  const database = getDatabase()
  const insertRecipe = database.prepare('INSERT INTO recipes (title, instructions) VALUES (?, ?)')
  const insertIngredient = database.prepare(
    'INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)'
  )
  const txn = database.transaction(() => {
    const info = insertRecipe.run(title, instructions)
    const recipeId = info.lastInsertRowid
    for (const ing of ingredients) {
      insertIngredient.run(recipeId, ing.name, ing.quantity ?? 1, ing.unit ?? '')
    }
    return recipeId
  })
  const newId = txn()
  return getRecipe(newId)
}

export function updateRecipe(id, data) {
  const database = getDatabase()
  const existing = database.prepare('SELECT * FROM recipes WHERE id = ?').get(id)
  if (!existing) return null
  const merged = {
    title: data.title ?? existing.title,
    instructions: data.instructions ?? existing.instructions
  }
  const insertIngredient = database.prepare(
    'INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)'
  )
  const txn = database.transaction(() => {
    database
      .prepare('UPDATE recipes SET title = ?, instructions = ? WHERE id = ?')
      .run(merged.title, merged.instructions, id)
    if (Array.isArray(data.ingredients)) {
      database.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(id)
      for (const ing of data.ingredients) {
        insertIngredient.run(id, ing.name, ing.quantity ?? 1, ing.unit ?? '')
      }
    }
  })
  txn()
  return getRecipe(id)
}

export function deleteRecipe(id) {
  // ensure cascade works even if WAL ran before pragma; recipe_ingredients FK is ON DELETE CASCADE
  const info = getDatabase().prepare('DELETE FROM recipes WHERE id = ?').run(id)
  // safety net in case FKs not enforced for any reason
  getDatabase().prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(id)
  return { deleted: info.changes > 0 }
}

// --- Matching ---

function normalize(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
}

export function getRecipeMatches(mode = 'partial') {
  const recipes = getRecipes()
  const pantry = getIngredients()
  const pantryNames = new Set(pantry.map((p) => normalize(p.name)))

  const results = recipes.map((recipe) => {
    const recipeIngredientNames = (recipe.ingredients || []).map((i) => i.name)
    const present = []
    const missing = []
    for (const name of recipeIngredientNames) {
      if (pantryNames.has(normalize(name))) {
        present.push(name)
      } else {
        missing.push(name)
      }
    }
    const total = recipeIngredientNames.length
    const matchScore = total === 0 ? 1 : present.length / total

    const entry = {
      recipe,
      matchScore,
      missingIngredients: missing,
      presentIngredients: present
    }

    if (mode === 'substitution') {
      const substitutions = {}
      for (const missingName of missing) {
        const key = normalize(missingName)
        if (SUBSTITUTIONS[key]) {
          substitutions[missingName] = SUBSTITUTIONS[key]
        }
      }
      entry.substitutions = substitutions
    }

    return entry
  })

  if (mode === 'strict') {
    return results.filter((r) => r.matchScore === 1.0)
  }
  // partial and substitution both sort by score desc
  return results.sort((a, b) => b.matchScore - a.matchScore)
}

// --- Settings ---

export function getSetting(key) {
  const row = getDatabase().prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? row.value : null
}

export function updateSetting(key, value) {
  getDatabase()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(key, String(value))
  return { key, value: String(value) }
}
