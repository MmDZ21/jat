# Font Configuration - IRANYekan

## Overview
The project now uses **IRANYekan Web** as the primary font family, optimized for Persian (Farsi) text rendering.

## Files Updated

### 1. `/src/app/fonts.ts` (NEW)
Central font configuration using Next.js `localFont`:
- Loads all 8 weights (100-950)
- Uses WOFF2 format for optimal performance
- Sets `--font-iran-yekan` CSS variable
- Implements font display swap strategy

### 2. `/src/app/layout.tsx`
- Removed Google Fonts (Geist)
- Applied `iranYekan.variable` to body
- Set `lang="fa"` and `dir="rtl"` on html element
- Updated metadata to Persian

### 3. `/src/app/globals.css`
- Updated `--font-sans` to use IRANYekan
- Applied font-family to body with fallbacks
- Added Persian text rendering optimizations
- Enabled font ligatures for better text flow

## Font Weights Available

| Weight | File | Usage |
|--------|------|-------|
| 100 | IRANYekanWebThin.woff2 | Thin text |
| 300 | IRANYekanWebLight.woff2 | Light text |
| 400 | IRANYekanWebRegular.woff2 | Regular (default) |
| 500 | IRANYekanWebMedium.woff2 | Medium weight |
| 700 | IRANYekanWebBold.woff2 | Bold text |
| 800 | IRANYekanWebExtraBold.woff2 | Extra bold |
| 900 | IRANYekanWebBlack.woff2 | Black weight |
| 950 | IRANYekanWebExtraBlack.woff2 | Extra black |

## Usage in Components

The font is automatically applied to all components through Tailwind's font-sans utility:

```tsx
// Automatically uses IRANYekan
<p className="font-sans">متن فارسی</p>

// Use specific weights
<h1 className="font-bold">عنوان اصلی</h1>
<p className="font-light">متن سبک</p>
<strong className="font-black">متن برجسته</strong>
```

## Tailwind Integration

The font is integrated into Tailwind's font stack via `globals.css`:

```css
--font-sans: var(--font-iran-yekan), ui-sans-serif, system-ui;
```

All `font-sans` classes will use IRANYekan by default.

## Performance Benefits

✅ **Local fonts** - No external requests
✅ **WOFF2 format** - Smaller file sizes
✅ **Font display swap** - Prevents invisible text
✅ **Automatic subsetting** - Next.js optimization
✅ **Preloading** - Faster initial render

## Browser Support

IRANYekan WOFF2 fonts are supported in:
- Chrome 36+
- Firefox 39+
- Safari 12+
- Edge 14+
- All modern mobile browsers

## RTL Support

The layout is configured for RTL (Right-to-Left) by default:
```html
<html lang="fa" dir="rtl">
```

All text will flow from right to left automatically.
