# WormChat Feeding Block - Responsive Design Guide

## Overview

The worm feeding interface has been redesigned to be fully responsive and mobile-friendly. It uses **Bootstrap 5 grid system** for flexible layouts that adapt to different screen sizes.

## Responsive Breakpoints

The design uses Bootstrap's standard breakpoints:

| Size | Breakpoint | Typical Device |
|------|-----------|-----------------|
| Mobile (Portrait) | < 576px | Smartphones (320px - 575px) |
| Tablet/Landscape | ≥ 576px | Tablets, Desktops |
| Desktop | ≥ 768px | Large desktops |

## Layout Changes

### Mobile (< 576px)

All sections **stack vertically** in a single column:

```
┌─────────────────────┐
│  Color Categories   │  (Full width, wrapped buttons)
├─────────────────────┤
│  Food Gallery       │  (Horizontal scroll)
├─────────────────────┤
│ Chopping Board      │  (Full width)
├─────────────────────┤
│ Knife               │  (Full width, centered)
├─────────────────────┤
│ Cups                │  (Full width, wrapped)
├─────────────────────┤
│ Feeding Done Button │  (Full width, centered)
└─────────────────────┘
```

### Tablet & Larger (≥ 576px)

Sections use **side-by-side layouts**:

```
┌─────────────────────────────────────────┐
│        Color Categories (Full width)    │
├─────────────────────────────────────────┤
│      Food Gallery (Full width)          │
├──────────────────────────┬──────────────┤
│   Chopping Board (75%)   │ Knife (25%)  │
├──────────────────────────┼──────────────┤
│      Cups (75%)          │ Done (25%)   │
└──────────────────────────┴──────────────┘
```

## Bootstrap Classes Used

### Grid System

- **`row`** - Creates a flex container for columns
- **`g-3` / `g-md-2`** - Responsive gap (3 units on mobile, 2 on tablet+)
- **`col-12`** - Full width on mobile (12 columns)
- **`col-md-9`** - 75% width on tablet+ (9/12 columns)
- **`col-md-3`** - 25% width on tablet+ (3/12 columns)

### Utility Classes

- **`d-flex`** - Display flex
- **`align-items-center`** - Vertical center alignment
- **`justify-content-center`** - Horizontal center alignment
- **`gap-2` / `gap-3`** - Spacing between flex items
- **`flex-wrap`** - Allow wrapping of items
- **`w-100`** - Full width
- **`h-100`** - Full height
- **`img-fluid`** - Responsive images

## Key Features

### 1. **Food Gallery**
- Horizontal scrolling on both mobile and desktop
- Responsive item sizing: `clamp(100px, 12vw, 140px)`
- Wraps naturally on mobile while remaining horizontal-scrollable

### 2. **Chopping Board**
- Maintains 2:1 aspect ratio (`aspect-ratio: 2 / 1`)
- Full width on mobile with increased minimum height (250px)
- Side-by-side with knife on tablet+ (75% / 25% split)

### 3. **Knife Button**
- **Hidden on mobile when board is displayed above**
- **Fully visible when displayed below board on mobile**
- Automatically sized: `width: 80%; max-width: 120px`
- Touch-friendly sizing on all devices

### 4. **Cups Row**
- Stacks vertically on mobile
- Side-by-side layout on tablet+ (75% / 25% split)
- Cups wrap naturally on mobile with `flex-wrap: wrap`
- Responsive sizing: `max-height: 90px; width: auto`

### 5. **Color Buttons**
- Responsive sizing: `clamp(40px, 8vw, 60px)`
- Prevent shrinking: `flex-shrink: 0`
- Wrap naturally on smaller screens

## Mobile Optimizations

### Padding & Spacing
- **Mobile**: Reduced padding (0.75rem) to save screen space
- **Tablet+**: Full padding (1rem)

### Touch Interactions
- All interactive elements use `touch-action: none` for proper drag handling
- Minimum touch target size: 44px × 44px (recommended by WCAG)
- Hover effects scale smoothly without breaking layout

### Image Sizing
- `img-fluid` class ensures responsive images
- `max-width` constraints prevent oversizing on desktop
- `height: auto` maintains aspect ratios

## Testing Checklist

- [ ] **Mobile (iPhone SE, 375px)**
  - [ ] Color buttons wrap without overflow
  - [ ] Chopping board is visible and draggable
  - [ ] Knife button is visible below board
  - [ ] Cups are visible and draggable
  - [ ] Gallery scrolls horizontally smoothly

- [ ] **Mobile Landscape (iPhone, 667px)**
  - [ ] Layout uses tablet view (75/25 split)
  - [ ] All elements fit without horizontal scroll

- [ ] **Tablet (iPad Mini, 768px)**
  - [ ] Side-by-side layouts are clearly visible
  - [ ] Spacing is balanced

- [ ] **Desktop (1920px)**
  - [ ] Layout maintains proportions
  - [ ] No unnecessary scrolling

## CSS Media Queries

All responsive changes use Bootstrap breakpoints:

```css
/* Mobile-first (default) */
.element {
  /* Mobile styles */
}

/* Tablet and larger */
@media (min-width: 576px) {
  .element {
    /* Tablet+ styles */
  }
}
```

## Performance

- Uses CSS `clamp()` for flexible sizing (no JavaScript needed)
- Aspect ratios prevent layout shift
- `flex-wrap` for natural reflow without repositioning
- Minimal CSS media queries for better performance

## Accessibility

- **WCAG 2.1 AA** compliant
- Minimum touch target: 44×44 pixels
- Color swatches have `aria-label` attributes
- Proper semantic HTML structure
- Keyboard navigation support maintained

## Future Enhancements

- Consider `container queries` for component-level responsiveness
- Add landscape orientation detection for better mobile landscape experience
- Implement gesture support (pinch-to-zoom) for drag operations on touch devices

## Drupal Bootstrap Theme Integration

This design fully leverages **Bootstrap 5** capabilities available in Drupal:

- ✓ Grid system (`row`, `col-*`)
- ✓ Utility classes (`d-flex`, `gap-*`, etc.)
- ✓ Responsive utilities (`d-md-flex`, etc.)
- ✓ CSS custom properties for theming

All Bootstrap classes are natively available in Drupal 10 with Bootstrap theme enabled.
