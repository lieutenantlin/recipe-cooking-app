import { useCallback, useEffect, useState } from 'react'
import styles from './PantryView.module.css'

const EMPTY_FORM = { name: '', quantity: 1, unit: '', expiry_date: '' }

export default function PantryView() {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // editingId: null = modal closed, 0 = adding new, N (positive int) = editing that ingredient
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadIngredients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.api.ingredients.getAll()
      if (res.ok) {
        setIngredients(res.data)
      } else {
        setError(res.error || 'Failed to load ingredients')
      }
    } catch (err) {
      setError(err.message || 'Unexpected error loading ingredients')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIngredients()
  }, [loadIngredients])

  function openAdd() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setEditingId(0)
  }

  function openEdit(ingredient) {
    setForm({
      name: ingredient.name || '',
      quantity: ingredient.quantity ?? 1,
      unit: ingredient.unit || '',
      expiry_date: ingredient.expiry_date || ''
    })
    setFormError(null)
    setEditingId(ingredient.id)
  }

  function closeModal() {
    setEditingId(null)
    setFormError(null)
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) {
      setFormError('Name is required')
      return
    }
    setSubmitting(true)
    setFormError(null)

    const payload = {
      name: form.name.trim(),
      quantity: form.quantity === '' || form.quantity === null ? 1 : Number(form.quantity),
      unit: form.unit.trim(),
      expiry_date: form.expiry_date || null
    }

    try {
      const res =
        editingId && editingId > 0
          ? await window.api.ingredients.update(editingId, payload)
          : await window.api.ingredients.add(payload)
      if (!res.ok) {
        setFormError(res.error || 'Failed to save ingredient')
        setSubmitting(false)
        return
      }
      closeModal()
      await loadIngredients()
    } catch (err) {
      setFormError(err.message || 'Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    try {
      const res = await window.api.ingredients.delete(id)
      if (!res.ok) {
        setError(res.error || 'Failed to delete ingredient')
        return
      }
      setDeletingId(null)
      setIngredients((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      setError(err.message || 'Unexpected error deleting ingredient')
    }
  }

  const isEditing = editingId !== null
  const isEditingExisting = editingId !== null && editingId > 0

  return (
    <div className={styles.view}>
      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>My Pantry</h1>
            <span className={styles.countBadge}>
              {ingredients.length} {ingredients.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <span className={styles.subtitle}>What you have on hand, right now.</span>
        </div>
        <button type="button" className={styles.addButton} onClick={openAdd}>
          <PlusIcon className={styles.plusIcon} />
          <span>Add Ingredient</span>
        </button>
      </header>

      {error && <div className={styles.viewError}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading your pantry…</div>
      ) : ingredients.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Your pantry is empty</div>
          <div className={styles.emptySubtitle}>
            Add your first ingredient to start tracking freshness.
          </div>
          <button type="button" className={styles.addButton} onClick={openAdd}>
            <PlusIcon className={styles.plusIcon} />
            <span>Add Ingredient</span>
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {ingredients.map((ing) => (
            <IngredientCard
              key={ing.id}
              ingredient={ing}
              onEdit={() => openEdit(ing)}
              onRequestDelete={() => setDeletingId(ing.id)}
              onConfirmDelete={() => handleDelete(ing.id)}
              onCancelDelete={() => setDeletingId(null)}
              confirmingDelete={deletingId === ing.id}
            />
          ))}
        </div>
      )}

      {isEditing && (
        <Modal onClose={closeModal} titleId="modal-title">
          <h2 id="modal-title" className={styles.modalTitle}>
            {isEditingExisting ? 'Edit ingredient' : 'Add ingredient'}
          </h2>
          <div className={styles.modalSubtitle}>
            {isEditingExisting ? 'Update what you have' : 'Tell us what you have on hand'}
          </div>
          <form onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <label className={styles.label} htmlFor="ing-name">
                Name
              </label>
              <input
                id="ing-name"
                className={styles.input}
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Tomato"
                autoFocus
                required
              />
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formRow}>
                <label className={styles.label} htmlFor="ing-qty">
                  Quantity
                </label>
                <input
                  id="ing-qty"
                  className={`${styles.input} ${styles.inputMono}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) => updateField('quantity', e.target.value)}
                />
              </div>
              <div className={styles.formRow}>
                <label className={styles.label} htmlFor="ing-unit">
                  Unit
                </label>
                <input
                  id="ing-unit"
                  className={styles.input}
                  type="text"
                  value={form.unit}
                  onChange={(e) => updateField('unit', e.target.value)}
                  placeholder="kg, pcs, L"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label} htmlFor="ing-expiry">
                Expiry date
              </label>
              <input
                id="ing-expiry"
                className={styles.input}
                type="date"
                value={form.expiry_date}
                onChange={(e) => updateField('expiry_date', e.target.value)}
              />
            </div>

            {formError && <div className={styles.error}>{formError}</div>}

            <div className={styles.formActions}>
              <button type="button" className={styles.btnSecondary} onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                {submitting ? 'Saving…' : isEditingExisting ? 'Save changes' : 'Add to pantry'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function IngredientCard({
  ingredient,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  confirmingDelete
}) {
  const freshness = getFreshness(ingredient.expiry_date)
  const cardClass = [
    styles.card,
    freshness === 'fresh' && styles.cardFresh,
    freshness === 'warning' && styles.cardWarning,
    freshness === 'expired' && styles.cardDanger,
    freshness === 'unknown' && styles.cardUnknown
  ]
    .filter(Boolean)
    .join(' ')

  const expiryClass = [
    styles.expiry,
    freshness === 'fresh' && styles.expiryFresh,
    freshness === 'warning' && styles.expiryWarning,
    freshness === 'expired' && styles.expiryDanger
  ]
    .filter(Boolean)
    .join(' ')

  const quantityText = formatQuantity(ingredient.quantity, ingredient.unit)

  return (
    <article className={cardClass}>
      <div className={styles.cardTop}>
        <div className={styles.cardName}>{ingredient.name}</div>
      </div>

      {quantityText && <div className={styles.quantity}>{quantityText}</div>}

      <div className={expiryClass}>
        <span className={styles.dot} aria-hidden="true" />
        <span>{formatExpiryLabel(ingredient.expiry_date, freshness)}</span>
      </div>

      <div className={`${styles.actions} ${confirmingDelete ? styles.actionsVisible : ''}`}>
        {confirmingDelete ? (
          <>
            <button
              type="button"
              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
              onClick={onConfirmDelete}
              aria-label={`Confirm delete ${ingredient.name}`}
              title="Yes, delete"
            >
              <CheckIcon className={styles.iconSvg} />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onCancelDelete}
              aria-label="Cancel delete"
              title="Cancel"
            >
              <XIcon className={styles.iconSvg} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onEdit}
              aria-label={`Edit ${ingredient.name}`}
              title="Edit"
            >
              <PencilIcon className={styles.iconSvg} />
            </button>
            <button
              type="button"
              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
              onClick={onRequestDelete}
              aria-label={`Delete ${ingredient.name}`}
              title="Delete"
            >
              <TrashIcon className={styles.iconSvg} />
            </button>
          </>
        )}
      </div>
    </article>
  )
}

function Modal({ children, onClose, titleId }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {children}
      </div>
    </div>
  )
}

/* Helpers */

export function getFreshness(expiryDate) {
  if (!expiryDate) return 'unknown'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate + 'T00:00:00')
  if (Number.isNaN(expiry.getTime())) return 'unknown'
  const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= 7) return 'warning'
  return 'fresh'
}

function formatQuantity(quantity, unit) {
  if (quantity === null || quantity === undefined || quantity === '') {
    return unit ? unit : ''
  }
  const num = Number(quantity)
  const display = Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '')
  return unit ? `${display} ${unit}` : display
}

function formatExpiryLabel(expiryDate, freshness) {
  if (!expiryDate) return 'No expiry set'
  const expiry = new Date(expiryDate + 'T00:00:00')
  if (Number.isNaN(expiry.getTime())) return 'No expiry set'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

  const formatted = expiry.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  if (freshness === 'expired') {
    const daysAgo = Math.abs(daysLeft)
    return `Expired ${formatted}${daysAgo === 0 ? ' (today)' : ` (${daysAgo}d ago)`}`
  }
  if (freshness === 'warning') {
    if (daysLeft === 0) return `Expires today (${formatted})`
    if (daysLeft === 1) return `Expires tomorrow (${formatted})`
    return `Expires ${formatted} (${daysLeft}d)`
  }
  return `Expires ${formatted}`
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
