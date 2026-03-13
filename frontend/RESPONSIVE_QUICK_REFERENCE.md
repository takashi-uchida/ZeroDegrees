# Mobile Responsive Design - Quick Reference

## Viewport Breakpoints

```
Mobile (xs)     Small (sm)      Medium (md)     Large (lg)      XL (xl)
< 640px         ≥ 640px         ≥ 768px         ≥ 1024px        ≥ 1280px
│               │               │               │               │
│ Single col    │ 2 cols        │ 3 cols        │ Grid layout   │ Wide layout
│ Stacked       │ Some grid     │ Full grid     │ Sidebar       │ Max width
│ Touch btns    │ Touch btns    │ No touch btns │ No touch btns │ No touch btns
│ Large nodes   │ Normal nodes  │ Normal nodes  │ Normal nodes  │ Normal nodes
└───────────────┴───────────────┴───────────────┴───────────────┴──────────────>
```

## Component Responsive Patterns

### Main Page
```tsx
// Mobile-first padding
className="px-4 py-6 sm:px-6 sm:py-10"

// Responsive header
className="text-3xl sm:text-5xl"

// Stacked → Grid
className="space-y-6 lg:grid lg:grid-cols-[1.45fr_0.88fr] lg:gap-8"
```

### DistanceMap
```tsx
// Responsive container
className="rounded-2xl p-4 sm:rounded-[32px] sm:p-6 md:p-8"

// Mobile timeline → Desktop connection lines
className="hidden lg:flex" // Connection lines
className="lg:hidden" // Mobile timeline dot
```

### GraphCanvas
```tsx
// Mobile controls (only on mobile)
{isMobile && (
  <div className="absolute right-3 top-3">
    <button>Zoom In</button>
    <button>Zoom Out</button>
    <button>Reset</button>
  </div>
)}

// Touch-friendly nodes
const baseRadius = isMobile ? NODE_RADIUS * 1.4 : NODE_RADIUS
```

### QueryForm
```tsx
// Responsive textarea
className="h-32 sm:h-36"

// Full-width button on mobile
className="w-full sm:w-auto"
```

## Touch Gestures Supported

| Gesture | Action | Implementation |
|---------|--------|----------------|
| Pinch | Zoom in/out | D3 zoom behavior |
| Pan | Move graph | D3 zoom behavior |
| Tap | Select node | Click handler |
| Tap button | Zoom/Reset | Button handlers |

## Mobile Optimizations

### Layout
- ✅ Single column on mobile
- ✅ Reduced padding (4 → 6 → 8)
- ✅ Smaller text (xs → sm → base)
- ✅ Tighter spacing (2 → 3 → 4)

### Touch
- ✅ 40px+ touch targets
- ✅ Larger node radius (14px vs 10px)
- ✅ Zoom controls visible
- ✅ Pinch-to-zoom enabled

### Performance
- ✅ Same canvas threshold (100 nodes)
- ✅ Efficient resize listeners
- ✅ Cleanup on unmount

## Testing Responsive Design

### Browser DevTools
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device or set custom dimensions
4. Test breakpoints: 375px, 640px, 768px, 1024px

### Common Test Devices
- iPhone SE: 375 × 667
- iPhone 12/13: 390 × 844
- iPad: 768 × 1024
- Desktop: 1280 × 720+

## Common Responsive Utilities

```tsx
// Spacing
mt-4 sm:mt-6 md:mt-8

// Padding
p-4 sm:p-6 md:p-8

// Text size
text-sm sm:text-base md:text-lg

// Border radius
rounded-xl sm:rounded-2xl md:rounded-3xl

// Grid
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

// Display
hidden sm:block
block sm:hidden

// Flex direction
flex-col sm:flex-row
```

## Viewport Meta Tag

Ensure this is in your HTML head (Next.js adds automatically):
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
```

## Accessibility Notes

- Touch targets: Minimum 44×44px (iOS) or 48×48px (Android)
- Text: Minimum 16px to prevent zoom on iOS
- Contrast: Maintain WCAG AA standards at all sizes
- Focus indicators: Visible on all interactive elements
