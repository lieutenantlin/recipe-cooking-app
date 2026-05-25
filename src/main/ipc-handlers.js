import { ipcMain } from 'electron'
import {
  getIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  getExpiringIngredients,
  getRecipes,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeMatches,
  getSetting,
  updateSetting
} from './database.js'

function isPositiveInt(val) {
  return Number.isInteger(val) && val > 0
}

function isValidIngredientData(data) {
  return data !== null && typeof data === 'object' && typeof data.name === 'string' && data.name.trim().length > 0
}

function isValidRecipeData(data) {
  return data !== null && typeof data === 'object' && typeof data.title === 'string' && data.title.trim().length > 0
}

export function registerIpcHandlers() {
  // Ingredients
  ipcMain.handle('ingredients:getAll', () => {
    try {
      return { ok: true, data: getIngredients() }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('ingredients:add', (_event, data) => {
    try {
      if (!isValidIngredientData(data)) return { ok: false, error: 'Invalid data' }
      return { ok: true, data: addIngredient(data) }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('ingredients:update', (_event, id, data) => {
    try {
      if (!isPositiveInt(id)) return { ok: false, error: 'Invalid id' }
      if (!isValidIngredientData(data)) return { ok: false, error: 'Invalid data' }
      return { ok: true, data: updateIngredient(id, data) }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('ingredients:delete', (_event, id) => {
    try {
      if (!isPositiveInt(id)) return { ok: false, error: 'Invalid id' }
      return { ok: true, data: deleteIngredient(id) }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('ingredients:getExpiring', () => {
    try {
      return { ok: true, data: getExpiringIngredients() }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })

  // Recipes
  ipcMain.handle('recipes:getAll', () => {
    try {
      return { ok: true, data: getRecipes() }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('recipes:add', (_event, data) => {
    try {
      if (!isValidRecipeData(data)) return { ok: false, error: 'Invalid data' }
      return { ok: true, data: addRecipe(data) }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('recipes:update', (_event, id, data) => {
    try {
      if (!isPositiveInt(id)) return { ok: false, error: 'Invalid id' }
      if (!isValidRecipeData(data)) return { ok: false, error: 'Invalid data' }
      return { ok: true, data: updateRecipe(id, data) }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('recipes:delete', (_event, id) => {
    try {
      if (!isPositiveInt(id)) return { ok: false, error: 'Invalid id' }
      return { ok: true, data: deleteRecipe(id) }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('recipes:getMatches', (_event, mode) => {
    try {
      return { ok: true, data: getRecipeMatches(mode) }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })

  // Settings
  ipcMain.handle('settings:get', (_event, key) => {
    try {
      return { ok: true, data: getSetting(key) }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle('settings:update', (_event, key, value) => {
    try {
      return { ok: true, data: updateSetting(key, value) }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  })
}
