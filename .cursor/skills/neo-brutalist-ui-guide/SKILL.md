---
name: neo-brutalist-ui-guide
description: >-
  End-to-end neo-brutalist UI/UX system: tokens, typography, spacing, motion,
  components (buttons, forms, nav, dialogs, tables, loading, empty states),
  interaction states, accessibility, and adoption into any stack or repo.
  Use when designing or implementing interfaces, design systems, component libraries,
  Figma-to-code, refactoring UI, or when the user wants brutalist / high-contrast
  / poster-style / terminal-inspired product UI.
---

# Neo-brutalist UI & UX guide (portable)

## Scope and portability

This document is **stack-agnostic**: it describes a **product UI language** you can implement in React, Vue, Angular, plain CSS, Tailwind (via tokens), SwiftUI, etc. **No dependency** on a specific repository.

**Using this skill in Cursor**

- **Project-local**: keep this folder under your repo at `.cursor/skills/neo-brutalist-ui-guide/`.
- **Global (all projects)**: copy the folder to `~/.cursor/skills/neo-brutalist-ui-guide/` so the same rules follow you everywhere.

**For AI agents**: Treat the **token tables** below as canonical unless the user’s repo explicitly overrides them. Prefer **mapping** implementation to these names (`--color-brutal-black`, etc.) even when variable syntax differs.

---

## 1. Experience principles (UX)

| Principle | What it means in practice |
|-----------|---------------------------|
| **Clarity over decoration** | Every border and shadow signals structure. Avoid ornamental blur, gradients, and ambiguous affordances. |
| **Predictable weight** | Primary actions look **heavier** (filled accent or strong border), secondary actions **lighter** (outline or white fill). |
| **Immediate feedback** | Hover and active states use **short motion** (≤150ms) and **visible** border/shadow change. Never rely on color-only state. |
| **Honest density** | Prefer readable line length and **consistent vertical rhythm**; brutal ≠ cramped. Use the spacing scale, not arbitrary pixels. |
| **System voice** | Tooling and utilities feel **technical**: mono labels, uppercase section titles, “status” subtitles in accent color. |
| **Forgiving errors** | Errors are **high-contrast**, specific, and placed **near the field** or **top of form**; destructive actions require confirmation. |
| **Resilient loading** | Show **explicit loading** (spinner, text) for operations >300ms; avoid silent buttons. |
| **Empty usefulness** | Empty states include **one sentence + one primary action**, not a dead end. |

---

## 2. Visual identity (what “neo-brutalist” means here)

- **High contrast**: black and white dominate; neon accents are **sparing**.
- **Hard geometry**: default **square or near-square** corners; border-radius **0** or **minimal** (≤4px) unless a platform component forces otherwise.
- **Offset shadows**: `3px 3px 0` style **solid-color** shadows (no large diffuse blur).
- **Strong frames**: **2px** black borders on controls, cards, and panels.
- **Flat fills**: avoid glassmorphism, heavy gradients, and soft “elevated” Material cards as the default.
- **Typography contrast**: **Mono + bold + uppercase** for chrome; **Sans** for reading body text.

---

## 3. Color system (canonical tokens)

Semantic roles **first**; implement with any naming convention (`$brutal-black`, `--color-ink`, etc.).

| Token name (suggested) | Hex | Role |
|------------------------|-----|------|
| `brutal-black` | `#000000` | Primary ink, default borders, primary button text on light fills |
| `brutal-white` | `#ffffff` | Page surface, cards, default button fill |
| `brutal-gray-dark` | `#1a1a1a` | Dark overlays, inverted hover surfaces |
| `brutal-gray-medium` | `#333333` | Secondary ink, dividers in dense UI |
| `brutal-gray-light` | `#666666` | Muted labels, table row separators (light) |
| `brutal-gray-lightest` | `#e1e1e1` | Table header bg, subtle panels, disabled backgrounds |
| `brutal-neon-green` | `#00ff00` | Primary digital accent, success, active nav hint, primary CTA variant |
| `brutal-dark-green` | `#00cc00` | Darker green for hover on green fills |
| `brutal-neon-red` | `#ff0044` | Danger, errors, destructive emphasis, link accent (underline) |
| `brutal-cyan` | `#00ffff` | Selection highlight, info accent |
| `brutal-magenta` | `#ff00ff` | Optional accent (charts, tags) |
| `brutal-rose` | `#fd4499` | Optional accent |
| `brutal-lime-yellow` | `#ffe62d` | **Hover** fill for default (white) brutal buttons |
| `brutal-red-soft` | `#f89b92` | Carets, soft warnings (not body text) |

**Usage rules**

- **Text on white**: prefer `brutal-black` or `gray-medium`; avoid long paragraphs in **neon** on white.
- **Borders**: default `brutal-black` at **2px**.
- **Success**: `brutal-neon-green` for icons, badges, or **short** labels—not full paragraphs.
- **Danger**: `brutal-neon-red` for errors, destructive buttons, and **required** attention.

---

## 4. Typography

### Font stacks

| Role | Stack (suggested) |
|------|---------------------|
| **UI / labels / titles** | `"JetBrains Mono", "SF Mono", "Consolas", monospace` |
| **Body / marketing** | `"Inter", "Arial Black", system-ui, sans-serif` |
| **Headings (poster scale)** | `"Inter", "Arial Black", sans-serif` at weight **900**, **uppercase**, fluid size via `clamp()` |

### Scale (rem — adjust root if needed)

| Step | rem | Typical use |
|------|-----|-------------|
| xs | 0.75 | Captions, meta |
| sm | 0.875 | Buttons, compact UI |
| md | 1 | Body default |
| lg | 1.25 | Subhead |
| xl | 1.5 | Section title |
| xxl | 2 | Page title |
| xxxl | 2.5 | Hero |

### Rules

- **Section titles** in mono: **uppercase**, **bold (700+)**, `letter-spacing: 0.05em–0.1em`.
- **Body**: Inter (or main sans) **400–600**, line-height **1.4–1.5**.
- **Code / data**: mono, normal weight unless emphasizing.

---

## 5. Spacing, borders, elevation, motion

### Spacing scale (px)

`4, 8, 12, 16, 20, 24, 32` — map to names `xs` through `xxxl`. **Do not** invent one-off `13px` unless aligning to legacy.

### Borders

- Default frame: **2px solid** `brutal-black`.
- Hairline dividers inside dense components: **1px** `gray-light` or `gray-lightest` edge.

### Shadows (offset “stamp”)

- **Rest**: `3px 3px 0 0` + shadow color (usually black).
- **Hover / lift**: `4px 4px 0 0` + same or accent + optional `translate(-1px,-1px)`.
- **Active / pressed**: reduce shadow and `translate(1px,1px)` toward “pressed into page.”

### Border radius

- Default **0**. Chips/tags **may** use **2–4px** if needed for scanability — never pill-by-default for primary actions.

### Motion

- **Interaction**: **0.15s ease** for hover/focus visibility.
- **Avoid**: bouncy springs on structural UI; long fades that hide feedback.

---

## 6. Iconography and assets

- Prefer **one icon family per surface** (e.g. Bootstrap Icons, Phosphor, or Tabler) at a **consistent stroke weight**.
- Icons sit on **grid-aligned** buttons; pair with **text label** for non-obvious actions.
- **Favicon / logo**: simple monochrome marks work best with this system.

---

## 7. Layout and responsive

### Breakpoints (max-width, mobile-first overrides)

`480, 768, 1024, 1280, 1440` px — use as **max-width** media queries when collapsing brutal grids.

### Page shell pattern

1. **Optional global nav** (white bar, **bottom border** 2px black, comfortable padding).
2. **Main column**: `max-width` 1200–1600px, **horizontal padding** from scale, **vertical padding** symmetric.
3. **Tool pages**: black **title band** (title + mono subtitle in accent) + **white content** area with **2px** frame.

### Flex and scroll

- Scrollable regions inside flex layouts need **`min-height: 0`** on the flex child chain to avoid overflow bugs.

### Z-index scale (suggested)

Use named layers instead of ad-hoc numbers:

| Layer | Typical value | Use |
|-------|---------------|-----|
| dropdown / popover | 1000–1060 | Menus, autocomplete |
| sticky header | 1020 | Pinned nav |
| modal backdrop | 1040 | Dim layer |
| modal | 1050 | Dialog content |
| toast | 1060–1080 | Non-blocking notices above modals if policy allows |

---

## 8. Global interaction states

Apply to **all** interactive components unless a variant doc says otherwise.

| State | Visual (typical) |
|-------|------------------|
| **Default** | 2px black border, white fill (buttons), clear label |
| **Hover** | Stronger shadow or **lime-yellow** fill (neutral buttons); **invert** (black bg + neon text) for primary variant |
| **Active / pressed** | Shadow reduced, slight translate down-right |
| **Focus (keyboard)** | **Visible** outline: 2px **neon-green** or black **outside** the border; never `outline: none` without replacement |
| **Disabled** | Reduced contrast, **no shadow transform**, `pointer-events: none` or `cursor: not-allowed` |
| **Busy** | Spinner + disabled repeat submit; preserve layout (no jump) |

---

## 9. Components — appearance and behavior

### 9.1 Buttons

**Variants**

- **Default**: white bg, black text, 2px black border, offset shadow; hover → **lime-yellow** bg (or invert per theme).
- **Primary / accent**: **neon-green** fill, black text, black border; hover → **black** fill, **neon-green** text, shadow in green or black.
- **Danger**: **neon-red** fill, **white** text, black border; hover invert similar to primary.

**Behavior**

- **Type** `button` in forms to avoid accidental submit.
- **Loading**: show inline spinner, `aria-busy="true"`, disable double submit.
- **Width**: full-width on mobile for primary; auto on desktop unless in a toolbar.

### 9.2 Links (inline text)

- Default: **black** text, **2px bottom border** in **accent red** (or single consistent accent).
- Hover: **invert** (accent bg, white text) or high-contrast background per token table.
- **Do not** rely on color alone; keep **underline or border**.

### 9.3 Text inputs and textareas

- Full width in forms; **2px** black border; **Inter** for value, **mono** for label above.
- **Focus**: border **neon-green** or clear ring; optional `box-shadow: 0 0 0 2px` tinted green.
- **Error**: border **neon-red** + error text below in **mono**, sentence case OK for message body.
- **Placeholder**: muted gray, not primary ink.

### 9.4 Selects

- Match input border; custom chevron aligned right; same focus/error rules.

### 9.5 Checkboxes and radios

- **Large hit target**; custom box **2px** black; checked fill **black** or **neon-green** with contrast check.
- Label **mono bold** to the right.

### 9.6 Cards / panels

- White fill, **2px** black border, **padding** `md–lg`, optional offset shadow.
- Hover (if clickable): shadow lift per §5.
- **No** floating gray Material card as default.

### 9.7 Navigation (app header)

- Horizontal list of links; **active** state: underline, **invert bar**, or **accent** text — pick **one** pattern app-wide.
- Mobile: hamburger → **full-width** vertical list with same brutal borders.

### 9.8 Modals / dialogs

- **Backdrop**: `rgba(0,0,0,0.5)` or **dark** solid; **modal** = white card, **2px** black, large shadow.
- **Focus trap**; **Escape** closes; primary action **right** (LTR); destructive **left** of primary with clear label.
- Title **mono uppercase**; body **sans**.

### 9.9 Alerts and inline validation

- **Error**: left border **4px** red or full **2px** red frame; icon + message.
- **Success**: green accent border or text; don’t use only green text for long content.
- **Banner** at top: one line + dismiss; don’t stack multiple competing banners.

### 9.10 Loading

- **Spinner** + short label (“LOADING…”) in **mono uppercase** for tool-style pages.
- For **content areas**, prefer skeleton **blocks** with **gray-lightest** and **black** rules — no pulse blur.

### 9.11 Empty states

- **Title** (mono) + **one sentence** + **primary button**; optional illustration **flat** line art.

### 9.12 Tables

- Header row **gray-lightest** bg, **mono uppercase** headers.
- **1px** row dividers; hover row **gray-lightest**.
- Numeric columns **right-aligned**; actions **icon + label** or kebab with menu.

### 9.13 Lists and feeds

- Each row: **2px** bottom border or card-in-list; **metadata** in smaller mono.

### 9.14 Code editors / embedded IDEs

- Light theme: **white** editor bg, **black** cursor line; **minimap** often off for performance.
- **Don’t** re-bind model props on every keystroke if the wrapper recreates the editor (framework-agnostic perf rule).

### 9.15 Tooltips

- **2px** black border, **white** fill, **mono** text, **small** size; appear **after** short delay (300–500ms), **never** blocking pointer to the control below.
- Prefer **native** `title` only for dev shortcuts; product tooltips should be styled.

### 9.16 Toggles (switches)

- Track: **2px** black outline; thumb: **square** or **slight** radius; on-state fill **neon-green** or **black** with green knob — maintain **AA** contrast for “on” label.

### 9.17 Search and command palette

- **Mono** prompt; results as **list** with **2px** dividers; **keyboard** navigation visible; **Escape** closes.

### 9.18 Optional audio / haptic feedback

- If the product uses **click sounds** or haptics, keep them **subtle**, **throttled**, and **user-toggleable** (persisted preference). Never required for core tasks.

---

## 10. Page patterns

| Pattern | UX notes |
|---------|----------|
| **Settings** | Group into **cards**; save bar **sticky** bottom or top; show **saved** toast |
| **Create / edit form** | Required fields marked; **inline** errors; primary **Save** right |
| **List + detail** | Master list fixed width; detail **flex**; preserve selection state |
| **Dashboard** | Few **large** tiles with mono titles; avoid chart junk without labels |

---

## 11. Accessibility

- **Contrast**: body text on white meets **WCAG AA**; verify **neon on white** for large text only.
- **Focus**: always visible; **tab order** matches reading order.
- **Touch targets**: minimum **44×44** px where platform allows.
- **Motion**: `prefers-reduced-motion: reduce` → remove translate play, keep instant color/border change.

---

## 12. Anti-patterns

- Soft **12px+** radius cards as the default “app container.”
- **Purple gradients**, glass blur, or **neon body paragraphs**.
- **Invisible** focus rings.
- **Different border weights** per screen without semantic meaning.
- **Icon-only** destructive actions without tooltip or confirm.

---

## 13. Adopting in a new project (checklist)

1. Copy **§3 color hex** into **CSS variables** or design tokens.
2. Load **Inter** + **JetBrains Mono** (or substitutes).
3. Set **base** `color` and `background` to black/white scheme.
4. Create **button**, **input**, **card** primitives matching **§9**.
5. Add **focus** and **disabled** styles globally.
6. Document **one** nav active state and **one** link style for the whole app.

### Starter `:root` (optional paste)

```css
:root {
  --color-ink: #000000;
  --color-surface: #ffffff;
  --color-accent: #00ff00;
  --color-danger: #ff0044;
  --color-warn-hover: #ffe62d;
  --color-gray-lightest: #e1e1e1;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --border-default: 2px solid var(--color-ink);
  --shadow-stamp: 3px 3px 0 0 var(--color-ink);
  --shadow-stamp-hover: 4px 4px 0 0 var(--color-ink);
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --font-sans: "Inter", system-ui, sans-serif;
  --transition-fast: 0.15s ease;
}
```

---

## 14. Third-party UI libraries (Material, Bootstrap, etc.)

- Use them for **layout or a11y primitives** if needed, then **re-skin**: **2px** black borders, token colors, mono labels on chrome.
- **Do not** ship default gray rounded Material buttons as the only primary action style.
- Data grids and date pickers: override panel **border** and **shadow** to match §5.

---

## 15. Wrong vs right (quick examples)

**Wrong:** `border-radius: 9999px; box-shadow: 0 10px 40px rgba(0,0,0,.15);`

**Right:** `border-radius: 0; box-shadow: var(--shadow-stamp); border: var(--border-default);`

**Wrong:** Primary button same weight as secondary.

**Right:** Primary uses **fill** or **stronger** shadow; secondary **outline** only.

---

This file is the **single** UI/UX style guide for this neo-brutalist system. Implement in any framework by mapping tokens and repeating the **component behaviors** in §8–§9.
