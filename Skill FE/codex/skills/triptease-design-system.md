# Triptease Design System Skill

**When to use this skill:** When building customer-facing web applications for Triptease. These guidelines ensure consistent UI/UX across all user-facing products.

**Not necessary for:** Internal tools,

**Do NOT use for:** Backend services, CLI applications, or non-Triptease projects.

The Triptease design system provides CSS-based styling through design tokens, semantic HTML, and web components.

## Quick Start

**Always include the stylesheet:**
```html
<link rel="stylesheet" href="https://cdn.design-system.triptease.io/triptease.css">
```

**Or via npm:** `yarn add @triptease/stylesheet`

## Core Principles

1. **ALWAYS research before implementing** - Check docs/source for current API
2. **Use web components** for complex interactive elements (comboboxes, date pickers, charts)
3. **Use semantic HTML + CSS** for simple elements (buttons, forms, typography)
4. **Use design tokens** via CSS custom properties (`--color-primary-400`)
5. **Use `data-theme` attributes** for variants (e.g., `<button data-theme="primary">`)

## ⚠️ IMPORTANT: Research First

**Before implementing ANY component or web component, you MUST research it using the published documentation.**

### Primary Resource:

**📚 Official Documentation:** https://docs.design-system.triptease.io/

### Research Workflow:

**Option 1: Use Browser Tools (RECOMMENDED)**
Use Playwright browser tools to actually view the rendered documentation:
1. Navigate to the component's documentation URL
2. Take screenshots to see visual examples
3. Read the rendered documentation content
4. Check the "Controls" tab for available props/attributes

Example:
```
1. Navigate to: https://docs.design-system.triptease.io/?path=/docs/ui-button--docs
2. Take screenshot of the Docs tab
3. Take screenshot of the Canvas tab (shows live examples)
4. Take screenshot of the Controls tab (shows available props)
```

**Option 2: Read Repository Files (if available)**
1. **Read the story file** in `stories/ui/<component>/`
2. **Check component README** in `packages/<component-name>/README.md`
3. **Review source code** in `packages/<component-name>/src/`
4. **Check CHANGELOG** for recent API changes

**Option 3: Ask User (fallback)**
If browser tools fail and you don't have repo access:
1. Provide the documentation URL to the user
2. Ask specific questions about the component API
3. State assumptions clearly when making educated guesses

### What to Look For in Documentation:

- **Props/Attributes** - Required and optional parameters
- **Events** - Custom events the component emits (e.g., `change`, `select`)
- **Slots** - Where child content should go (for web components)
- **Data themes** - Available theme variants (`data-theme="primary"`)
- **Dependencies** - Other components that must be included (e.g., charts need tt-dataset)
- **Usage examples** - Copy-paste ready code snippets
- **Accessibility** - ARIA attributes, keyboard navigation requirements
- **Version information** - Current stable version numbers

### Actual Documentation URLs (Verified):

**Base URL:** https://docs.design-system.triptease.io/

**UI Components:**
- Button: `?path=/docs/ui-button--docs`
- Badge: `?path=/docs/ui-badge--docs`
- Card: `?path=/docs/ui-card--docs`
- Dialog (Web Component): `?path=/docs/ui-dialog-webcomponent--docs`
- Icons: `?path=/docs/ui-icons--docs`
- Table: `?path=/docs/ui-table--docs`
- Typography: `?path=/docs/ui-typography--docs`

**Form Components (HTML + CSS):**
- Text Input: `?path=/docs/ui-forms-text-input--docs`
- Number Input: `?path=/docs/ui-forms-number-input--docs`
- Textarea: `?path=/docs/ui-forms-textarea--docs`
- Select Input: `?path=/docs/ui-forms-select-input--docs`
- Checkbox: `?path=/docs/ui-forms-checkbox--docs`
- Radio: `?path=/docs/ui-forms-radio--docs`
- Toggle: `?path=/docs/ui-forms-toggle--docs`

**Form Components (Web Components):**
- Combobox - Web Component: `?path=/docs/ui-forms-combobox-combobox-webcomponent--docs`
- Combobox - React: `?path=/docs/ui-forms-combobox-combobox-react--docs`
- Date Picker - Web Component: `?path=/docs/ui-forms-date-picker-date-picker-webcomponent--docs`
- Date Picker - React: `?path=/docs/ui-forms-date-picker-date-picker-react--docs`
- Date Range Picker - Web Component: `?path=/docs/ui-forms-date-range-picker-date-range-picker-webcomponent--docs`
- Date Range Picker - React: `?path=/docs/ui-forms-date-range-picker-date-range-picker-react--docs`

**Charts (Web Components):**
- Bar Chart - Web Component: `?path=/docs/ui-charts-bar-chart-webcomponent--docs`
- Line Chart - Web Component: `?path=/docs/ui-charts-line-chart-webcomponent--docs`

**Design Tokens:**
- Color: `?path=/docs/tokens-color--docs`
- Spacing: `?path=/docs/tokens-spacing--docs`
- Font/Typography: `?path=/docs/tokens-font--docs`
- Border: `?path=/docs/tokens-border--docs`
- Box Shadow: `?path=/docs/tokens-boxshadow--docs`

**Full URL Examples:**
```
# Web Component
https://docs.design-system.triptease.io/?path=/docs/ui-forms-combobox-combobox-webcomponent--docs

# HTML/CSS Component
https://docs.design-system.triptease.io/?path=/docs/ui-button--docs

# Token
https://docs.design-system.triptease.io/?path=/docs/tokens-color--docs
```

**Note:** Story titles like "Combobox - Webcomponent" convert to `combobox-webcomponent` (single dash separating words).

### Example Research Process:

```
User asks: "Add a combobox for selecting countries"

❌ DON'T immediately write code based on assumptions:
<tt-combobox>
  <option>USA</option>
</tt-combobox>

✅ DO research first using browser tools:
1. Navigate to documentation:
   https://docs.design-system.triptease.io/?path=/docs/ui-forms-combobox-combobox-webcomponent--docs

2. Take screenshots of Docs, Canvas, and Controls tabs

3. Extract from documentation:
   - Correct element names (tt-combobox, tt-option)
   - Required attributes (value)
   - Available props and events
   - Usage examples

4. Then implement correctly:
   <script type="module" src="https://cdn.design-system.triptease.io/tt-combobox/5.x.x/tt-combobox.js"></script>

   <tt-combobox>
     <tt-option value="us">United States</tt-option>
     <tt-option value="uk">United Kingdom</tt-option>
     <tt-option value="ca">Canada</tt-option>
   </tt-combobox>

✅ OR use repository files:
1. Read: stories/ui/forms/combobox/combobox-webcomponent.stories.tsx
2. Read: packages/tt-combobox/README.md
3. Review source if needed: packages/tt-combobox/src/tt-combobox.ts
```

**Why this matters:** Components evolve, APIs change, and assumptions may be wrong. Always verify current implementation details from the published documentation before writing code.

## When to Use What

This decision guide helps you choose the right approach for your UI needs.

### Use Web Components When:

- **Complex interactions** - Multi-select dropdowns, date range pickers, interactive charts
- **Component has specialized behavior** - Calendar navigation, chart interactions, modal focus trapping
- **Need encapsulated state** - Component manages its own internal state
- **Examples:**
  - ✅ Use `<tt-combobox>` for searchable multi-select dropdowns
  - ✅ Use `<tt-date-range-picker>` for date range selection with calendar
  - ✅ Use `<tt-bar-chart>` for interactive data visualization
  - ✅ Use `<tt-dialog>` for modals with focus management

### Use Semantic HTML + CSS When:

- **Simple form inputs** - Text fields, textareas, basic selects, checkboxes, radio buttons
- **Static content** - Buttons, badges, cards, typography, tables
- **No complex state** - Component doesn't need to manage behavior internally
- **Examples:**
  - ✅ Use `<input type="text">` for simple text fields
  - ✅ Use `<button data-theme="primary">` for buttons
  - ✅ Use `<select>` for simple dropdowns with 5-10 options
  - ✅ Use `<span class="badge">` for status indicators
  - ✅ Use `<h1>`, `<p>` for typography

### Use Design Tokens in Styled Components When:

- **Custom layouts** - Unique page layouts, custom containers
- **Component composition** - Building compound components
- **Need CSS-in-JS** - Using styled-components or emotion
- **Examples:**
  - ✅ Custom grid layouts with `var(--space-scale-3)`
  - ✅ Custom cards with `var(--color-surface-100)` background
  - ✅ Custom animations with `var(--color-primary-400)` transitions

### Use Utility Classes When:

- **Typography variants** - `.heading-1`, `.body`, `.small`
- **Pre-built patterns** - `.card`, `.badge`
- **Quick prototyping** - Fast UI iterations
- **Examples:**
  - ✅ Use `.card` class for standard card styling
  - ✅ Use `.badge` with `data-theme` for status badges
  - ✅ Use typography classes for text hierarchy

### Decision Tree

```
Need a UI component?
│
├─ Is it a complex, interactive element?
│  ├─ YES → Use Web Component (tt-combobox, tt-date-picker, etc.)
│  └─ NO → Continue...
│
├─ Is it a standard form element or button?
│  ├─ YES → Use semantic HTML with data-theme (<input>, <button data-theme="primary">)
│  └─ NO → Continue...
│
├─ Is it typography or a simple badge/card?
│  ├─ YES → Use semantic HTML with utility classes (<div>, <span class="badge">)
│  └─ NO → Continue...
│
└─ Need custom styling?
   └─ YES → Use styled-components with design tokens (var(--color-primary-400))
```

### Quick Reference

| Use Case | Solution | Example |
|----------|----------|---------|
| Multi-select dropdown | `<tt-combobox>` | Filtering, tags |
| Simple dropdown (5-10 items) | `<select>` | Country picker |
| Date range selection | `<tt-date-range-picker>` | Booking dates |
| Single date | `<tt-date-picker>`| Birthday |
| Text input | `<input>` or `<textarea>` | Name, email, description |
| Primary action button | `<button data-theme="primary">` | Submit, Save |
| Modal/Dialog | `<tt-dialog>` | Confirmations, forms |
| Data visualization | `<tt-bar-chart>` or `<tt-line-chart>` | Analytics, metrics |
| Status indicator | `<span class="badge">` | Active, Pending |
| Card container | `<div class="card">` | Content blocks |

## Design Tokens

All design tokens are available as CSS custom properties. Use them in your CSS/styled-components:

**Common tokens:**
- Colors: `--color-primary-400`, `--color-text-400`, `--color-surface-100`
- Spacing: `--space-scale-1` through `--space-scale-10`
- Typography: `--font-size-200`, `--font-weight-medium`
- Border/Shadow: `--border-radius-100`, `--box-shadow-lg`

**Full token reference:** https://docs.design-system.triptease.io/?path=/docs/tokens-color--docs

## HTML Components (Buttons, Forms, Typography)

Use semantic HTML with `data-theme` attributes. The stylesheet provides automatic styling.

**Example:**
```html
<button data-theme="primary">Save</button>
<input type="text" aria-invalid="false">
<span class="badge" data-theme="success">Active</span>
```

**Themes:** primary, secondary, tertiary, destructive-primary, suggestion
**States:** Use `disabled`, `aria-invalid`, or `data-loading` attributes

**Full docs:** https://docs.design-system.triptease.io/?path=/docs/ui-button--docs


## Web Components

**Available Components:**
- Forms: `@triptease/tt-combobox`, `@triptease/tt-date-picker`, `@triptease/tt-date-range-picker`
- UI: `@triptease/tt-dialog`, `@triptease/tt-icon`, `@triptease/tt-navbar`
- Charts: `@triptease/tt-bar-chart`, `@triptease/tt-line-chart`

**Basic usage:**
```html
<script type="module" src="https://cdn.design-system.triptease.io/tt-combobox/5.x.x/tt-combobox.js"></script>
<tt-combobox>
  <tt-option value="1">Option 1</tt-option>
</tt-combobox>
```

**Research first:** Always check component README in `packages/<component-name>/README.md` or docs before using.

## Best Practices

### DO ✅

```tsx
// Use semantic HTML with data-theme
<button data-theme="primary">Submit</button>
<input type="text" aria-invalid="false" />

// Use design tokens in styled components
const Container = styled.div`
  padding: var(--space-scale-3);
  background: var(--color-surface-100);
`;

// Use web components for complex elements
<script type="module" src="https://cdn.design-system.triptease.io/tt-combobox/5.x.x/tt-combobox.js"></script>
<tt-combobox><tt-option value="1">Option</tt-option></tt-combobox>
```

### DON'T ❌

```tsx
// Don't hardcode values
const Bad = styled.div`
  padding: 24px;
  background: #5e43c2;
`;

// Don't use inline styles
<div style={{ padding: '20px', color: '#5e43c2' }}>...</div>
```

## Reference

- **Documentation**: https://docs.design-system.triptease.io/
- **CDN Base URL**: https://cdn.design-system.triptease.io/
- **Stylesheet Version**: 1.4.0
- **NPM Packages**: Published under `@triptease` scope

### CDN URL Patterns

**Stylesheet:**
- Latest: `https://cdn.design-system.triptease.io/triptease.css`
- Specific: `https://cdn.design-system.triptease.io/{version}/triptease.css`
- Nightly: `https://cdn.design-system.triptease.io/nightly/triptease.css`

**Web Components:**
- Latest: `https://cdn.design-system.triptease.io/{component}/latest/{component}.js`
- Major: `https://cdn.design-system.triptease.io/{component}/{major}.x.x/{component}.js`
- Specific: `https://cdn.design-system.triptease.io/{component}/{version}/{component}.js`
