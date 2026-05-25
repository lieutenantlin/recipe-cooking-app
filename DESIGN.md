# Glean — Design Specification

## Concept

**"Warm Kitchen"** — a premium kitchen organizer that feels like a well-lit, well-organized pantry. The default dark theme draws from cast iron, aged wood, warm spice, and the editorial quality of a good food magazine. The light theme keeps the same warmth with cream paper surfaces and grounded brown text.

---

## Color Palette

All colors are defined as CSS custom properties in `src/renderer/src/styles/globals.css`. `:root` contains the dark defaults, and `:root[data-theme='light']` overrides the same tokens for light mode. Components must consume tokens rather than hard-coded theme colors.

### Surfaces

| Token | Hex | Use |
|---|---|---|
| `--bg-base` | `#0d0c09` | App background, the deepest layer |
| `--bg-surface` | `#1a1917` | Cards, sidebar, panels |
| `--bg-elevated` | `#242220` | Inputs (focused), tooltips, hover states |

The three surface levels create depth without harsh contrast. In light mode, these same tokens map to warm cream and parchment surfaces.

### Text

| Token | Hex | Use |
|---|---|---|
| `--text-primary` | `#f0ece0` | Headings, body copy, all readable text |
| `--text-secondary` | `#a09880` | Metadata, labels, supporting text |
| `--text-tertiary` | `#6b6355` | Placeholders, timestamps, version string |

Dark-mode text is warm cream rather than pure white; light-mode text is warm brown rather than black. Both prevent harsh contrast while preserving readability.

### Accent

| Token | Hex | Use |
|---|---|---|
| `--accent` | `#c97c2a` | Primary buttons, active nav, focus rings, highlights |
| `--accent-hover` | `#e08d35` | Hover state for accent elements |
| `--text-on-accent` | `#1a1208` | Text/icons on filled accent controls |
| `--accent-muted` | `rgba(201, 124, 42, 0.14)` | Active nav background |
| `--accent-muted-hover` | `rgba(201, 124, 42, 0.18)` | Active nav hover background |
| `--accent-wash` | `rgba(201, 124, 42, 0.06)` | Subtle accent hover washes |

The amber/spice accent is the single dominant color in the UI. Use it sparingly — reserved for the one thing the user should look at or act on.

### Semantic / Status

| Token | Hex | Meaning |
|---|---|---|
| `--fresh` | `#7ab87a` | Ingredient is fresh (expires > 7 days) |
| `--warning` | `#e8651a` | Expires within 7 days / partial match |
| `--danger` | `#c94040` | Expired / missing ingredient / error |
| `--danger-muted` | `rgba(201, 64, 64, 0.12)` | Error banner background |
| `--danger-border` | `rgba(201, 64, 64, 0.4)` | Error banner border |
| `--warning-muted` | `rgba(232, 101, 26, 0.18)` | Warning chip background |

These colors must only appear in their defined semantic context. Never use `--fresh` for decorative purposes.

### Borders

| Token | Hex | Use |
|---|---|---|
| `--border` | `#2e2c28` | Default dividers, card outlines |
| `--border-strong` | `#3d3a34` | Hovered cards, modal outlines, emphasis |

Additional utility tokens include `--neutral-muted`, `--overlay-backdrop`, `--dialog-shadow`, and `--selection-bg`. They exist so overlays, chips, shadows, and selection styling stay theme-aware.

### Theme Behavior

The renderer stores the selected theme in localStorage under `glean:theme`, with valid values `light` and `dark`. If no saved value exists, the app initializes from `prefers-color-scheme` and follows OS theme changes. Once the sidebar toggle is used, the manual choice is saved and takes precedence until localStorage is cleared.

The active theme is applied by setting `data-theme` on the document root. Both themes also set `color-scheme` so native controls render with matching browser defaults.

---

## Typography

Three typefaces form the type system. Each has a distinct role and must not be used outside it.

### Display — Fraunces

```
--font-display: 'Fraunces', Georgia, serif
```

An optical-size variable serif with a distinctive personality. Used for:
- All headings (h1–h4)
- The app logo ("Glean")
- Empty state messages
- Modal titles and subtitles (italic variant)

Fraunces carries warmth and editorial quality. Its optical size axis means it looks refined at both large and small sizes.

### Body — Source Sans 3

```
--font-body: 'Source Sans 3', system-ui, -apple-system, sans-serif
```

A clean humanist sans-serif for all running text. Used for:
- Body copy and descriptions
- Nav labels
- Button labels
- Form inputs and labels
- Recipe instructions

### Monospace — JetBrains Mono

```
--font-mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace
```

Used exclusively for quantitative and data-like content:
- Ingredient quantities and units (`2.5 kg`, `1 L`)
- Count badges (`12 items`)
- Version string in sidebar footer
- Date fields (where the fixed-width glyph spacing aids scanning)

### Type Scale

| Element | Size | Weight | Font | Notes |
|---|---|---|---|---|
| `h1` | 36px | 300 | Fraunces | −0.02em tracking |
| `h2` | 26px | 400 | Fraunces | −0.01em tracking |
| `h3` | 20px | 600 | Fraunces | |
| `h4` | 16px | 600 | Fraunces | |
| View title | 40px | 300 | Fraunces | Oversized h1 used in view headers |
| Body | 15px | 400 | Source Sans 3 | Base `font-size` on `body` |
| Small / meta | 13–14px | 400 | Source Sans 3 | |
| Label | 12px | 600 | Source Sans 3 | Uppercase, 0.08em tracking |
| Mono data | 14px | 400 | JetBrains Mono | 0.02em tracking |
| Caption / footer | 12px | 400 | JetBrains Mono | 0.04em tracking |

Line height defaults: `1.5` body, `1.15` headings, `1.7` recipe instructions.

---

## Spacing

An 8-point base grid. Tokens map to multiples of 4px.

| Token | Value | Common use |
|---|---|---|
| `--space-1` | 4px | Tight gaps within a component |
| `--space-2` | 8px | Icon-to-label gap, small padding |
| `--space-3` | 12px | Internal card padding |
| `--space-4` | 16px | Standard gap between items |
| `--space-5` | 20px | Card padding, input padding |
| `--space-6` | 24px | Section gaps, sidebar padding |
| `--space-8` | 32px | View header bottom margin |
| `--space-10` | 40px | Main content horizontal padding |
| `--space-12` | 48px | Main content bottom padding |

---

## Border Radius

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6px | Inputs, small buttons, error banners |
| `--radius-md` | 10px | Buttons, nav items |
| `--radius-lg` | 12px | Cards, modals |
| `--radius-pill` | 999px | Badges, count chips, toggle buttons |

---

## Motion

Two transition speeds. Both use `ease` (ease-out feel).

| Token | Duration | Use |
|---|---|---|
| `--t-fast` | 0.12s | Hover states, opacity changes, micro-interactions |
| `--t-base` | 0.18s | Background changes, border color transitions |

Modal entrance uses a `scaleIn` keyframe: `scale(0.96) translateY(8px)` → `scale(1) translateY(0)` over 0.18s. The backdrop fades in simultaneously over 0.15s.

Score bars in the Suggestions view use `transition: width 0.3s ease` — slightly longer to feel data-driven rather than decorative.

---

## Layout

### App Shell

Two-column fixed layout: 220px sidebar + flex-1 main content. Both panels are full viewport height (`100vh`), overflow hidden at the root, scroll independently.

```
┌────────────────────────────────────────────────┐
│ Sidebar (220px) │ Main content (flex-1)         │
│                 │ padding: 32px 40px 48px       │
│ bg-surface      │ bg-base                       │
│ border-right    │ overflow-y: auto              │
└────────────────────────────────────────────────┘
```

### Sidebar

- Width: 220px, `flex-shrink: 0`
- Background: `--bg-surface`
- Right border: `1px solid var(--border)`
- Logo area: 22px Fraunces, 28px bottom padding
- Nav items: 10px/14px padding, `--radius-md`, 2px gap between items
- Active item: `--accent-muted` background, `--accent` text, 600 weight
- Footer: `--font-mono`, 12px, `--text-tertiary`, with a 32px icon button for the light/dark toggle

### View Headers

Each view uses a consistent header pattern:
- Title (40px Fraunces 300) + count badge (mono pill) on the left
- Primary action button on the right
- `border-bottom: 1px solid var(--border)` separating header from content
- 32px bottom margin before the content grid/list

### Cards

Cards are the primary content unit across Pantry, Suggestions, and Calendar views.

- Background: `--bg-surface`
- Border: `1px solid var(--border)`
- Radius: `--radius-lg` (12px)
- Left border: 3px, colored by semantic state (fresh/warning/danger/neutral)
- Hover: `border-color → --border-strong`, `translateY(-1px)`
- Action buttons (edit/delete): `opacity: 0`, revealed on `:hover` and `:focus-within`

### Modals

- Backdrop: `--overlay-backdrop` + `backdrop-filter: blur(4px)`
- Modal panel: `--bg-surface`, `--border-strong`, `--radius-lg`, max-width 460px
- Shadow: `--dialog-shadow`
- Entrance animation: `scaleIn` (see Motion section)
- Close on: Escape key, click outside backdrop

---

## Component Patterns

### Primary Button (CTA)

```css
background: var(--accent);
color: var(--text-on-accent);
font-weight: 600;
padding: 10px 18px;
border-radius: var(--radius-md);
```

On hover: `background → --accent-hover`. On active: `translateY(1px)`. On disabled: `opacity: 0.5`.

### Secondary / Ghost Button

```css
color: var(--text-secondary);
font-weight: 600;
padding: 9px 16px;
border-radius: var(--radius-md);
```

On hover: `color → --text-primary`, `background → --bg-elevated`.

### Icon Buttons

28×28px, `--bg-elevated` background, `--border` outline, `--radius-sm`. Danger variant turns `--danger` on hover with matching border.

### Form Inputs

```css
background: var(--bg-base);
border: 1px solid var(--border);
border-radius: var(--radius-sm);
padding: 10px 12px;
font-size: 14.5px;
```

On focus: `border-color → --accent`, `background → --bg-elevated`. No default browser outline — replaced by border color change.

### Form Labels

12px, 600 weight, uppercase, 0.08em letter-spacing, `--text-secondary`. Always paired with a visible `<label>` element linked to its input via `htmlFor`/`id`.

### Error Banners

```css
background: var(--danger-muted);
border: 1px solid var(--danger-border);
color: var(--danger);
border-radius: var(--radius-sm);  /* inline form errors */
border-radius: var(--radius-md);  /* view-level errors */
```

### Count / Status Badges

Pill shape (`--radius-pill`), `--bg-elevated` background, `--border` outline, `--font-mono`, 12px, `--text-secondary`. Used for item counts in view headers.

### Match Score Bar (Suggestions view)

```css
height: 6px;
background: var(--bg-elevated);
border-radius: 3px;
overflow: hidden;
```

Fill color by score: `--fresh` at 100%, `--warning` at 50–99%, `--danger` below 50%. Width transition: 0.3s ease.

### Ingredient Freshness Indicator

Left border on cards (3px):
- `--fresh` — expires > 7 days
- `--warning` — expires within 7 days
- `--danger` — already expired
- `--text-tertiary` — no expiry date set

Matching dot (6×6px circle) and text color used for the expiry label below the quantity.

---

## Scrollbars

Custom webkit scrollbar: 10px wide, pill-shaped thumb, transparent track. Thumb color `--border` at rest, `--border-strong` on hover, with a 2px `--bg-base` border to create a floating appearance.

---

## Focus & Accessibility

Global `:focus-visible` rule:
```css
outline: 2px solid var(--accent);
outline-offset: 2px;
border-radius: var(--radius-sm);
```

Applied to all interactive elements via keyboard navigation. Mouse clicks do not trigger the ring.

Text selection uses `--selection-bg` — a semi-transparent amber tint matching the accent in each theme.

---

## Do's and Don'ts

**Do:**
- Use CSS custom properties (`var(--...)`) for all colors, fonts, spacing, and radii — never hardcode values
- Use semantic color tokens by their meaning (`--warning` for things expiring, not for decoration)
- Use Fraunces only for display/heading roles, never for data or UI labels
- Use JetBrains Mono only for quantities, counts, and metadata — never for instructions or descriptions
- Keep the accent (`--accent`) rare — it should draw the eye to the primary action

**Don't:**
- Add new colors outside the defined palette without updating this document and `globals.css`
- Use `--fresh`, `--warning`, or `--danger` for anything other than their freshness/status meaning
- Add `window.confirm()` — use inline confirmation UI instead (see `PantryView` for the pattern)
- Use `cursor: pointer` on non-interactive elements
- Use animations longer than 0.3s for UI transitions (use longer durations only for data-driven visuals like score bars)
