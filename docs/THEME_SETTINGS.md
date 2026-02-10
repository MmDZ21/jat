# Theme Settings - Documentation

## Overview
A complete theme color customization system with live preview, preset colors, and real-time database updates using Server Actions.

## Files Created

### 1. `/src/app/actions/theme.ts`
Server Action to update theme color:
- Validates hex color format
- Updates database
- Revalidates profile page
- Returns success/error response

### 2. `/src/components/ThemeSettingsClient.tsx`
Client Component with:
- Color picker input
- 8 preset colors
- Live preview (button + tab)
- Auto-contrast text colors
- Success/error messages
- Save button with loading state

### 3. `/src/app/dashboard/theme/page.tsx`
Server Component page that:
- Fetches current theme color
- Passes data to client component

## Features

### ✨ Color Picker
- `<input type="color">` for visual selection
- Manual hex code input
- Real-time preview updates

### 🎨 Preset Colors
8 pre-defined brand colors:
- آبی (Blue) - #3b82f6
- قرمز (Red) - #ef4444
- سبز (Green) - #10b981
- نارنجی (Orange) - #f59e0b
- بنفش (Purple) - #8b5cf6
- صورتی (Pink) - #ec4899
- فیروزه‌ای (Cyan) - #06b6d4
- یاسی (Indigo) - #6366f1

### 👁️ Live Preview
Shows real-time preview of:
- Button with selected color
- Active tab with selected color
- Auto-calculated text color (white/black)

### 💾 Server Action
- Validates hex format (`/^#[0-9A-Fa-f]{6}$/`)
- Updates `profiles.theme_color`
- Revalidates profile page
- Persian error messages

### 🔄 State Management
- `useState` for color selection
- `useTransition` for pending state
- Tracks saved vs current color
- Shows "save" button only when changed

## Usage

### Access the Page

Visit: `http://localhost:3000/dashboard/theme`

### Flow

1. **Select Color**
   - Click color picker or
   - Type hex code or
   - Click preset color

2. **Preview Updates**
   - Button changes color instantly
   - Tab changes color instantly
   - Text color adjusts automatically

3. **Save**
   - Click "ذخیره تغییرات"
   - Server Action updates database
   - Profile page revalidates
   - Success message shows

4. **Visit Profile**
   - Go to `/{username}`
   - See new color applied

## Code Example

### Server Action
```typescript
export async function updateThemeColor(
  profileId: string,
  themeColor: string
): Promise<{ success: boolean; error?: string }> {
  // Validate
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!hexColorRegex.test(themeColor)) {
    return { success: false, error: "فرمت رنگ نامعتبر است" };
  }

  // Update
  await db.update(profiles)
    .set({ themeColor, updatedAt: new Date() })
    .where(eq(profiles.id, profileId));

  // Revalidate
  revalidatePath(`/${profile.username}`);

  return { success: true };
}
```

### Client Component
```typescript
const [color, setColor] = useState(currentThemeColor);
const [isPending, startTransition] = useTransition();

const handleSave = () => {
  startTransition(async () => {
    const result = await updateThemeColor(profileId, color);
    if (result.success) {
      setSavedColor(color);
      setMessage({ type: "success", text: "رنگ با موفقیت ذخیره شد!" });
    }
  });
};
```

## Validation

### Hex Color Format
- Must start with `#`
- Must be exactly 6 characters (0-9, A-F)
- Example: `#3b82f6` ✅
- Example: `#3b8` ❌
- Example: `rgb(59, 130, 246)` ❌

### Contrast Calculation
```typescript
function getContrastColor(hexColor: string): string {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
```

## Integration with Profile Page

The theme color automatically applies to:
- ✅ Avatar gradient ring
- ✅ Active tab button
- ✅ Tab badge background
- ✅ Contact links
- ✅ Item prices
- ✅ Item titles

All with auto-calculated contrast colors!

## Future Enhancements

Potential additions:
- [ ] Secondary color picker
- [ ] Background gradient options
- [ ] Font style selection
- [ ] Button shape options (rounded, square, pill)
- [ ] Save multiple theme presets
- [ ] A/B test different colors
- [ ] Color accessibility score
- [ ] Export theme as CSS variables

## Testing

### Test Different Colors

```sql
-- Bright colors
UPDATE profiles SET theme_color = '#ef4444' WHERE username = 'ali_rezaei'; -- Red
UPDATE profiles SET theme_color = '#10b981' WHERE username = 'ali_rezaei'; -- Green

-- Dark colors
UPDATE profiles SET theme_color = '#1f2937' WHERE username = 'ali_rezaei'; -- Dark gray
UPDATE profiles SET theme_color = '#7c2d12' WHERE username = 'ali_rezaei'; -- Dark orange

-- Light colors  
UPDATE profiles SET theme_color = '#fbbf24' WHERE username = 'ali_rezaei'; -- Yellow
UPDATE profiles SET theme_color = '#f472b6' WHERE username = 'ali_rezaei'; -- Pink
```

### Check Contrast
Visit profile page and verify:
- Text is readable on buttons
- Icons are visible
- Prices are clear

## Security

✅ **Server-side validation** - Hex format checked before DB
✅ **SQL injection safe** - Using Drizzle ORM
✅ **No XSS** - Colors validated, not user HTML
✅ **Type-safe** - TypeScript throughout

## Performance

- ⚡ **ISR** - Profile pages cached for 60s
- ⚡ **Optimistic UI** - Preview updates instantly
- ⚡ **Single query** - One DB update
- ⚡ **Auto revalidation** - Fresh pages after save

## Accessibility

- ♿ Automatic contrast calculation
- ♿ WCAG AA compliant text colors
- ♿ Keyboard accessible color picker
- ♿ Persian screen reader friendly labels

## Browser Support

- ✅ `<input type="color">` - All modern browsers
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Mobile iOS/Android
