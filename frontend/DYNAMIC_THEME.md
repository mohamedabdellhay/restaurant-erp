# Dynamic Restaurant Theming System

This document explains how the restaurant ERP frontend dynamically adapts its UI colors based on the restaurant's theme settings from the login response.

## Overview

When a user logs in, the API response includes restaurant-specific theme settings that are automatically applied to the entire UI, creating a customized experience for each restaurant.

## API Response Structure

The login response contains theme settings in the following structure:

```json
{
  "success": true,
  "data": {
    "staff": { ... },
    "restaurantSettings": {
      "theme": {
        "primaryColor": "#000000",
        "secondaryColor": "#ffffff",
        "accentColor": "#ff0000",
        "mode": "light"
      },
      "taxPercent": 14,
      "serviceChargePercent": 12
    }
  }
}
```

## How It Works

### 1. Authentication Context (`src/context/AuthContext.jsx`)

- Stores restaurant settings from login response
- Persists settings in localStorage
- Makes settings available throughout the app

### 2. Theme Context (`src/context/ThemeContext.jsx`)

- Listens for restaurant settings changes
- Applies custom colors as CSS variables
- Updates the UI in real-time when settings change

### 3. CSS Variables (`src/index.css`)

The theme system uses CSS custom properties that dynamically reference restaurant colors:

```css
:root {
  --primary: var(--restaurant-primary, #f59e0b);
  --secondary: var(--restaurant-secondary, #6366f1);
  --accent: var(--restaurant-accent, #10b981);
}
```

### 4. Restaurant Hook (`src/hooks/useRestaurant.js`)

Provides easy access to restaurant data and theme colors:

```javascript
const { getRestaurantName, getThemeColors } = useRestaurant();
```

## Usage Examples

### Component Implementation

```jsx
import { useRestaurant } from "../hooks/useRestaurant";

const MyComponent = () => {
  const { getRestaurantName, getThemeColors } = useRestaurant();
  const colors = getThemeColors();

  return (
    <div style={{ borderColor: colors.primary }}>
      <h1>{getRestaurantName()}</h1>
    </div>
  );
};
```

### CSS Integration

```css
.my-component {
  background: var(--primary);
  color: var(--primary-content);
  border: 2px solid var(--secondary);
}
```

## Testing & Demo

The dashboard includes a theme testing section that allows you to:

1. **Simulate Login**: Tests the complete login flow with mock restaurant data
2. **Test Themes**: Apply different pre-defined restaurant themes instantly

### Available Test Themes

- **Gourmet Garden**: Black, white, red color scheme
- **Ocean Blue**: Various shades of blue
- **Forest Green**: Natural green tones
- **Sunset Orange**: Warm orange palette

## Features

### Automatic Color Adaptation

- **Primary Color**: Used for buttons, links, highlights
- **Secondary Color**: Supporting elements and backgrounds
- **Accent Color**: Special highlights and notifications
- **Dynamic Focus States**: Focus rings match the primary color
- **Smart Contrast**: Text colors automatically adjust for readability

### Real-time Updates

- Theme changes apply immediately without page reload
- All components update simultaneously
- Smooth transitions between theme changes

### Persistent Storage

- Restaurant settings saved in localStorage
- Themes persist across browser sessions
- Automatic restoration on page load

## Integration Points

### Header Component

- Displays restaurant name using primary color
- User avatar background uses primary color
- Notification badges use accent color

### Sidebar Component

- Restaurant branding in header
- Active navigation items use primary color

### Dashboard Components

- Statistics cards use primary color for numbers
- Buttons use theme-appropriate colors
- All interactive elements respect the theme

## Adding New Theme Properties

To extend the theming system:

1. **Update CSS Variables** in `src/index.css`
2. **Apply in Theme Context** in `src/context/ThemeContext.jsx`
3. **Add to Restaurant Hook** in `src/hooks/useRestaurant.js`
4. **Update Mock Data** in `src/utils/demoTheme.js`

## Best Practices

1. **Always Use CSS Variables**: Reference theme colors through CSS custom properties
2. **Provide Fallbacks**: Ensure default colors when restaurant settings aren't available
3. **Test Contrast**: Verify text remains readable with all color combinations
4. **Smooth Transitions**: Add CSS transitions for theme changes
5. **Responsive Design**: Ensure themes work across all device sizes

## Troubleshooting

### Theme Not Applying

- Check localStorage for `restaurantSettings`
- Verify theme context is properly initialized
- Ensure CSS variables are correctly referenced

### Color Contrast Issues

- Test with different restaurant themes
- Use `color-mix()` for dynamic color variations
- Provide fallback colors for accessibility

### Performance Issues

- Theme changes are optimized to minimize re-renders
- CSS variables are updated efficiently
- Storage events are debounced automatically
