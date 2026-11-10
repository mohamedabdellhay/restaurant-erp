# Restaurant Settings Page

This document describes the functionality and implementation of the restaurant settings page.

## Overview

The settings page allows restaurant administrators to update all aspects of their restaurant information, including basic details, financial settings, theme customization, opening hours, and social media links.

## Features

### 1. Basic Information

- **Restaurant Name**: Primary business name
- **Address**: Physical location
- **Phone**: Contact phone number
- **Email**: Business email address
- **Website**: Company website URL
- **Currency**: Default currency for transactions

### 2. Business Details

- **VAT Number**: Tax identification number
- **Commercial Registration**: Business registration number

### 3. Financial Settings

- **Tax Percentage**: Applied tax rate (0-100%)
- **Service Charge**: Service fee percentage (0-100%)

### 4. Theme Settings

- **Primary Color**: Main brand color for buttons, links, highlights
- **Secondary Color**: Supporting elements and backgrounds
- **Accent Color**: Special highlights and notifications
- **Live Preview**: Real-time color preview
- **Color Picker**: Visual color selection with hex input

### 5. Opening Hours

- **Daily Hours**: Set operating hours for each day of the week
- **Flexible Format**: Free text input (e.g., "9:00 AM - 10:00 PM")

### 6. Social Media

- **Facebook**: Business Facebook page URL
- **Instagram**: Instagram profile URL
- **Twitter**: Twitter profile URL

## API Integration

### Endpoint

```
PUT /restaurant/{id}
```

### Request Body Structure

```json
{
  "_id": "restaurant-id",
  "name": "Restaurant Name",
  "address": "Full Address",
  "phone": "+1234567890",
  "email": "contact@restaurant.com",
  "website": "https://restaurant.com",
  "currency": "USD",
  "vatNumber": "123-456-789",
  "crNumber": "987654",
  "settings": {
    "taxPercent": 14,
    "serviceChargePercent": 12,
    "theme": {
      "primaryColor": "#3498db",
      "secondaryColor": "#2ecc71",
      "accentColor": "#e74c3c",
      "logo": "https://example.com/logo.png",
      "mode": "light"
    }
  },
  "openingHours": {
    "monday": "9:00 AM - 10:00 PM",
    "tuesday": "9:00 AM - 10:00 PM"
    // ... other days
  },
  "socialMedia": {
    "facebook": "https://facebook.com/restaurant",
    "instagram": "https://instagram.com/restaurant",
    "twitter": "https://twitter.com/restaurant"
  }
}
```

## Implementation Details

### Components Used

- **Settings.jsx**: Main settings page component
- **useRestaurant Hook**: Provides restaurant data and helper functions
- **restaurantService**: API service for restaurant operations
- **Theme Context**: Handles dynamic theme updates

### State Management

- **formData**: Local state for form inputs
- **saving**: Loading state for save operation
- **message**: Success/error message display

### Key Functions

#### handleInputChange(section, field, value)

Updates nested form data structure:

```javascript
// For nested objects (settings, openingHours, socialMedia)
handleInputChange("settings", "taxPercent", 14);

// For top-level fields
handleInputChange(null, "name", "New Restaurant Name");
```

#### handleThemeColorChange(colorType, value)

Specialized handler for theme color updates:

```javascript
handleThemeColorChange("primaryColor", "#3498db");
```

#### handleSubmit(e)

Processes form submission:

1. Validates restaurant ID
2. Calls API service
3. Updates local storage for theme
4. Triggers theme context update
5. Shows success/error message

### Theme Integration

When theme colors are updated:

1. New settings saved to localStorage
2. Storage event dispatched
3. ThemeContext updates CSS variables
4. UI updates in real-time

## User Experience

### Form Validation

- Required fields marked with HTML5 validation
- Phone number format validation
- Email format validation
- URL format validation for website and social media

### Feedback System

- **Success Messages**: Green notification with checkmark
- **Error Messages**: Red notification with X icon
- **Loading States**: Spinner during save operation
- **Auto-dismiss**: Messages disappear after 3 seconds

### Responsive Design

- Mobile-friendly layout
- Grid system adapts to screen size
- Touch-friendly controls
- Collapsible sections on small screens

## Security Considerations

### Input Sanitization

- All inputs sanitized before API submission
- URL validation prevents malicious links
- Color hex format validation

### Permission Check

- Only authenticated users can access settings
- Restaurant ID validation prevents cross-tenant access

## Future Enhancements

### Planned Features

- **Logo Upload**: File upload for restaurant logo
- **Theme Templates**: Pre-defined color schemes
- **Advanced Hours**: Multiple time slots per day
- **Multi-language**: Support for restaurant names in different languages
- **Location Settings**: GPS coordinates and delivery zones

### API Improvements

- **Partial Updates**: Update only changed fields
- **Validation**: Server-side validation with detailed error messages
- **Batch Operations**: Update multiple settings in one call
- **Audit Trail**: Track changes to restaurant settings

## Testing

### Test Cases

1. **Form Submission**: Valid data saves successfully
2. **Theme Updates**: Colors apply immediately
3. **Validation**: Invalid inputs show appropriate errors
4. **API Errors**: Network errors handled gracefully
5. **Responsive**: Layout works on all screen sizes

### Mock Data

Use the demo theme utility for testing:

```javascript
import { simulateRestaurantLogin } from "./utils/demoTheme";
simulateRestaurantLogin(); // Loads test restaurant data
```

## Troubleshooting

### Common Issues

#### Theme Not Updating

- Check localStorage for `restaurantSettings`
- Verify ThemeContext is properly initialized
- Ensure storage event listener is active

#### Save Fails

- Verify restaurant ID is available
- Check API endpoint accessibility
- Review network requests in browser dev tools

#### Form Validation Errors

- Check HTML5 validation attributes
- Verify input formats match requirements
- Review browser console for errors

### Debug Tools

- Browser DevTools: Network tab for API calls
- Console: Check for JavaScript errors
- localStorage: Verify data persistence
- React DevTools: Inspect component state
