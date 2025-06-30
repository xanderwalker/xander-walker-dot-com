# Font Configuration System

## Quick Font Changes

To change fonts across the entire website, simply update these CSS variables in `client/src/index.css`:

```css
:root {
  /* Centralized font configuration - change these to update all fonts site-wide */
  --primary-font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --brand-font-family: 'XanmanWide', var(--primary-font-family);
}
```

## Font Usage

- **Primary Font** (`--primary-font-family`): Used for all body text, headings, and UI elements
- **Brand Font** (`--brand-font-family`): Used for the main "XANDER WALKER" title and bouncing navigation bubbles

## Available CSS Classes

```css
.font-primary   /* Uses --primary-font-family */
.font-brand     /* Uses --brand-font-family */
```

## Tailwind Classes

```css
font-sans       /* Uses --primary-font-family */
font-primary    /* Uses --primary-font-family */
font-brand      /* Uses --brand-font-family */
font-xanman-wide /* XanmanWide with fallback to primary */
```

## How to Change Fonts

### Option 1: Change All Fonts (Recommended)
Update `--primary-font-family` in `client/src/index.css`:

```css
--primary-font-family: "Inter", sans-serif;
```

### Option 2: Change Just Brand Font
Update `--brand-font-family` in `client/src/index.css`:

```css
--brand-font-family: "Custom Brand Font", var(--primary-font-family);
```

### Option 3: Add New Font Family
1. Add new CSS variable:
```css
--custom-font-family: "New Font", sans-serif;
```

2. Add Tailwind class in `tailwind.config.ts`:
```ts
fontFamily: {
  'custom': ['var(--custom-font-family)'],
}
```

3. Use with `font-custom` class

## Benefits

- **Single source of truth**: Change one variable to update entire site
- **Consistent fallbacks**: All fonts have proper fallback chains
- **Easy maintenance**: No need to search/replace across multiple files
- **Type safety**: Tailwind provides autocomplete for font classes