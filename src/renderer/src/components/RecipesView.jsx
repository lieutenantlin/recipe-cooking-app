import { useCallback, useEffect, useState } from 'react'
import styles from './RecipesView.module.css'

const EMPTY_INGREDIENT = { name: '', quantity: 1, unit: '' }
const EMPTY_FORM = {
  title: '',
  instructions: '',
  ingredients: [{ ...EMPTY_INGREDIENT }]
}

export default function RecipesView() {
  const [recipes, setRecipes] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadRecipes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.api.recipes.getAll()
      if (res.ok) {
        setRecipes(res.data)
      } else {
        setError(res.error || 'Failed to load recipes')
      }
    } catch (err) {
      setError(err.message || 'Unexpected error loading recipes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  const selectedRecipe = recipes.find((r) => r.id === selectedId) || null

  function openAdd() {
    if (isEditing) return
    setForm({
      title: '',
      instructions: '',
      ingredients: [{ ...EMPTY_INGREDIENT }]
    })
    setFormError(null)
    setIsNew(true)
    setIsEditing(true)
    setSelectedId(null)
  }

  function openEdit(recipe) {
    setDeletingId(null)
    setForm({
      title: recipe.title || '',
      instructions: recipe.instructions || '',
      ingredients:
        recipe.ingredients && recipe.ingredients.length > 0
          ? recipe.ingredients.map((ing) => ({
              name: ing.name || '',
              quantity: ing.quantity ?? 1,
              unit: ing.unit || ''
            }))
          : [{ ...EMPTY_INGREDIENT }]
    })
    setFormError(null)
    setIsNew(false)
    setIsEditing(true)
    setSelectedId(recipe.id)
  }

  function cancelEdit() {
    setIsEditing(false)
    setIsNew(false)
    setFormError(null)
  }

  function selectRecipe(id) {
    if (isEditing) return
    setSelectedId(id)
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addIngredientRow() {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, { ...EMPTY_INGREDIENT }] }))
  }

  function removeIngredientRow(idx) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.filter((_, i) => i !== idx)
    }))
  }

  function updateIngredientRow(idx, field, value) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const title = form.title.trim()
    if (!title) {
      setFormError('Title is required')
      return
    }

    const cleanedIngredients = form.ingredients
      .map((ing) => ({
        name: (ing.name || '').trim(),
        quantity:
          ing.quantity === '' || ing.quantity === null || ing.quantity === undefined
            ? 1
            : Number(ing.quantity),
        unit: (ing.unit || '').trim()
      }))
      .filter((ing) => ing.name.length > 0)

    if (cleanedIngredients.length === 0) {
      setFormError('Add at least one ingredient with a name')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const payload = {
      title,
      instructions: form.instructions,
      ingredients: cleanedIngredients
    }

    try {
      const res =
        isNew || !selectedId
          ? await window.api.recipes.add(payload)
          : await window.api.recipes.update(selectedId, payload)

      if (!res.ok) {
        setFormError(res.error || 'Failed to save recipe')
        setSubmitting(false)
        return
      }

      const savedRecipe = res.data
      if (isNew) {
        setRecipes((prev) => [...prev, savedRecipe])
      } else {
        setRecipes((prev) => prev.map((r) => (r.id === savedRecipe.id ? savedRecipe : r)))
      }
      setSelectedId(savedRecipe.id)
      setIsEditing(false)
      setIsNew(false)
    } catch (err) {
      setFormError(err.message || 'Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    try {
      const res = await window.api.recipes.delete(id)
      if (!res.ok) {
        setError(res.error || 'Failed to delete recipe')
        return
      }
      setDeletingId(null)
      setRecipes((prev) => prev.filter((r) => r.id !== id))
      if (selectedId === id) {
        setSelectedId(null)
        setIsEditing(false)
        setIsNew(false)
      }
    } catch (err) {
      setError(err.message || 'Unexpected error deleting recipe')
    }
  }

  return (
    <div className={styles.view}>
      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>My Recipes</h1>
            <span className={styles.countBadge}>
              {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
            </span>
          </div>
          <span className={styles.subtitle}>Your cookbook, in your own words.</span>
        </div>
        <button type="button" className={styles.addButton} onClick={openAdd}>
          <PlusIcon className={styles.plusIcon} />
          <span>Add Recipe</span>
        </button>
      </header>

      {error && <div className={styles.viewError}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading your recipes…</div>
      ) : (
        <div className={styles.container}>
          <aside className={styles.sidebar} aria-label="Recipe list">
            {recipes.length === 0 ? (
              <div className={styles.sidebarEmpty}>
                <div className={styles.sidebarEmptyTitle}>No recipes yet</div>
                <div className={styles.sidebarEmptySubtitle}>
                  Add your first one to get started.
                </div>
              </div>
            ) : (
              <ul className={styles.list}>
                {recipes.map((r) => {
                  const isActive = r.id === selectedId
                  const count = r.ingredients ? r.ingredients.length : 0
                  const confirming = deletingId === r.id
                  return (
                    <li key={r.id} className={styles.listItemWrap}>
                      <button
                        type="button"
                        className={`${styles.listItem} ${isActive ? styles.listItemActive : ''}`}
                        onClick={() => selectRecipe(r.id)}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <span className={styles.listItemTitle}>{r.title}</span>
                        <span className={styles.listItemMeta}>
                          <span>
                            {count} {count === 1 ? 'ingredient' : 'ingredients'}
                          </span>
                          <span className={styles.dot} aria-hidden="true">
                            ·
                          </span>
                          <span>{formatDate(r.created_at)}</span>
                        </span>
                      </button>
                      {confirming && (
                        <div className={styles.confirmRow}>
                          <span className={styles.confirmText}>Delete this recipe?</span>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => handleDelete(r.id)}
                            aria-label={`Confirm delete ${r.title}`}
                            title="Yes, delete"
                          >
                            <CheckIcon className={styles.iconSvg} />
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => setDeletingId(null)}
                            aria-label="Cancel delete"
                            title="Cancel"
                          >
                            <XIcon className={styles.iconSvg} />
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </aside>

          <section className={styles.detailPanel} aria-label="Recipe details">
            {isEditing ? (
              <RecipeForm
                form={form}
                isNew={isNew}
                submitting={submitting}
                formError={formError}
                onCancel={cancelEdit}
                onSubmit={handleSubmit}
                onFieldChange={updateField}
                onAddIngredient={addIngredientRow}
                onRemoveIngredient={removeIngredientRow}
                onUpdateIngredient={updateIngredientRow}
              />
            ) : selectedRecipe ? (
              <RecipeDetail
                recipe={selectedRecipe}
                onEdit={() => openEdit(selectedRecipe)}
                onRequestDelete={() => setDeletingId(selectedRecipe.id)}
                confirmingDelete={deletingId === selectedRecipe.id}
              />
            ) : (
              <div className={styles.detailEmpty}>
                <div className={styles.detailEmptyTitle}>
                  {recipes.length === 0 ? 'Start your cookbook' : 'Select a recipe'}
                </div>
                <div className={styles.detailEmptySubtitle}>
                  {recipes.length === 0
                    ? 'Add a recipe to see it here.'
                    : 'Pick one from the list to view its ingredients and steps.'}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function RecipeDetail({ recipe, onEdit, onRequestDelete, confirmingDelete }) {
  return (
    <article className={styles.detail}>
      <header className={styles.detailHeader}>
        <h2 className={styles.detailTitle}>{recipe.title}</h2>
        <div className={styles.detailActions}>
          <button type="button" className={styles.btnOutline} onClick={onEdit}>
            <PencilIcon className={styles.btnIcon} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className={`${styles.btnOutline} ${styles.btnOutlineDanger}`}
            onClick={onRequestDelete}
            disabled={confirmingDelete}
          >
            <TrashIcon className={styles.btnIcon} />
            <span>{confirmingDelete ? 'Confirm in list…' : 'Delete'}</span>
          </button>
        </div>
      </header>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Ingredients</h3>
        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          <ul className={styles.ingredientList}>
            {recipe.ingredients.map((ing, idx) => (
              <li key={ing.id ?? `${ing.name}-${idx}`} className={styles.ingredientItem}>
                <span className={styles.ingredientQty}>
                  {formatQuantity(ing.quantity, ing.unit)}
                </span>
                <span className={styles.ingredientName}>{ing.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.sectionEmpty}>No ingredients listed.</div>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Instructions</h3>
        {recipe.instructions && recipe.instructions.trim() ? (
          <div className={styles.instructions}>{recipe.instructions}</div>
        ) : (
          <div className={styles.sectionEmpty}>No instructions written yet.</div>
        )}
      </section>
    </article>
  )
}

function RecipeForm({
  form,
  isNew,
  submitting,
  formError,
  onCancel,
  onSubmit,
  onFieldChange,
  onAddIngredient,
  onRemoveIngredient,
  onUpdateIngredient
}) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <header className={styles.formHeader}>
        <h2 className={styles.detailTitle}>{isNew ? 'New recipe' : 'Edit recipe'}</h2>
        <span className={styles.formSubtitle}>
          {isNew ? 'Capture a dish from your kitchen.' : 'Refine the details.'}
        </span>
      </header>

      <div className={styles.formRow}>
        <label className={styles.label} htmlFor="recipe-title">
          Title
        </label>
        <input
          id="recipe-title"
          className={styles.input}
          type="text"
          value={form.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
          placeholder="e.g. Weeknight tomato pasta"
          autoFocus
          required
        />
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeadRow}>
          <h3 className={styles.sectionTitle}>Ingredients</h3>
          <button type="button" className={styles.addRowBtn} onClick={onAddIngredient}>
            <PlusIcon className={styles.plusIconSmall} />
            <span>Add ingredient</span>
          </button>
        </div>

        <div className={styles.ingredientRows}>
          {form.ingredients.map((ing, idx) => {
            const nameId = `ing-name-${idx}`
            const qtyId = `ing-qty-${idx}`
            const unitId = `ing-unit-${idx}`
            return (
              <div key={idx} className={styles.ingredientRow}>
                <div className={styles.ingredientCell}>
                  <label className={styles.srOnly} htmlFor={nameId}>
                    Ingredient name
                  </label>
                  <input
                    id={nameId}
                    className={styles.input}
                    type="text"
                    value={ing.name}
                    onChange={(e) => onUpdateIngredient(idx, 'name', e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <div className={styles.ingredientCellQty}>
                  <label className={styles.srOnly} htmlFor={qtyId}>
                    Quantity
                  </label>
                  <input
                    id={qtyId}
                    className={`${styles.input} ${styles.inputMono}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={ing.quantity}
                    onChange={(e) => onUpdateIngredient(idx, 'quantity', e.target.value)}
                    placeholder="Qty"
                  />
                </div>
                <div className={styles.ingredientCellUnit}>
                  <label className={styles.srOnly} htmlFor={unitId}>
                    Unit
                  </label>
                  <input
                    id={unitId}
                    className={styles.input}
                    type="text"
                    value={ing.unit}
                    onChange={(e) => onUpdateIngredient(idx, 'unit', e.target.value)}
                    placeholder="Unit"
                  />
                </div>
                <button
                  type="button"
                  className={styles.removeRowBtn}
                  onClick={() => onRemoveIngredient(idx)}
                  disabled={form.ingredients.length === 1}
                  aria-label={`Remove ingredient ${idx + 1}`}
                  title="Remove"
                >
                  <XIcon className={styles.iconSvg} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Instructions</h3>
        <label className={styles.srOnly} htmlFor="recipe-instructions">
          Instructions
        </label>
        <textarea
          id="recipe-instructions"
          className={styles.textarea}
          value={form.instructions}
          onChange={(e) => onFieldChange('instructions', e.target.value)}
          placeholder="Write your recipe steps here..."
          rows={8}
        />
      </section>

      {formError && <div className={styles.error}>{formError}</div>}

      <div className={styles.formActions}>
        <button type="button" className={styles.btnSecondary} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save recipe'}
        </button>
      </div>
    </form>
  )
}

/* Helpers */

function formatQuantity(quantity, unit) {
  if (quantity === null || quantity === undefined || quantity === '') {
    return unit ? unit : ''
  }
  const num = Number(quantity)
  if (Number.isNaN(num)) return unit ? unit : ''
  const display = Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '')
  return unit ? `${display} ${unit}` : display
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/* Icons */

function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function PencilIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 4l6 6-10 10H4v-6L14 4z" />
      <path d="M13 5l6 6" />
    </svg>
  )
}

function TrashIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}
