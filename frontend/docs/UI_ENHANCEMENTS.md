# UI Enhancement Features Documentation

This document describes the new UI features implemented for the Santé medical application.

## 🌓 Dark Mode Support

### Overview
The application now features a fully functional dark mode with system preference detection and manual controls.

### Implementation Details

#### ThemeContext (`src/contexts/ThemeContext.tsx`)
- Provides centralized theme management
- Supports three theme modes:
  - **Light**: Traditional light theme
  - **Dark**: Custom dark theme optimized for medical UI
  - **System**: Automatically follows system preferences
- Persists user preference in localStorage
- Listens to system theme changes

#### Color Scheme
The dark mode uses WCAG AAA compliant colors:
- Background: `#1A1D23` (dark primary), `#23272F` (dark secondary)
- Text: `#E9ECEF` (primary), `#ADB5BD` (secondary)
- Primary: `#48C9B0` (lighter for better contrast)
- Accent colors adjusted for proper contrast ratios

#### Usage
```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  // Get current theme
  console.log(theme); // 'light' | 'dark' | 'system'
  
  // Get actual theme being applied
  console.log(resolvedTheme); // 'light' | 'dark'
  
  // Change theme
  setTheme('dark');
}
```

### Theme Toggle Component (`src/components/ui/ThemeToggle.tsx`)

Two variants are provided:

1. **ThemeToggle**: Compact button that cycles through themes
2. **ThemeToggleExpanded**: Full radio group with all three options visible

```tsx
import { ThemeToggle, ThemeToggleExpanded } from '@/components/ui/ThemeToggle';

// Compact version
<ThemeToggle />

// Expanded version
<ThemeToggleExpanded />
```

## 🎯 Micro-Interactions

### Overview
Enhanced user feedback through smooth animations and visual cues.

### Features

#### 1. Hover Effects
- **hover-lift**: Lifts elements slightly on hover
- **scale-on-hover**: Scales elements smoothly
- **button-press**: Provides tactile feedback on click

```tsx
<div className="hover-lift scale-on-hover">
  Interactive Element
</div>
```

#### 2. Ripple Effect
All buttons now include a ripple effect animation on click:
```css
.ripple-effect
```

#### 3. Animation Classes
- **fade-in**: Smooth entrance animation
- **slide-in-right**: Slides in from the right (used for toasts)
- **pulse**: Pulsing animation for notifications

#### 4. Enhanced Button States
Buttons now feature:
- Smooth gradient transitions
- Scale animation on press
- Loading states with spinner
- Proper focus indicators

#### 5. Card Hover Effects
Cards (`Card` component) can be made interactive with the `hover` prop:
```tsx
<Card hover shadow="md">
  Interactive Card Content
</Card>
```

## 🔔 Toast Notifications

### Overview
Accessible toast notification system for user feedback.

### Usage

```tsx
import { useToast } from '@/components/ui/Toast';

function MyComponent() {
  const { showToast } = useToast();
  
  // Show success message
  showToast('Operation completed successfully!', 'success');
  
  // Show error
  showToast('An error occurred', 'error');
  
  // Show info (default)
  showToast('Information message', 'info');
  
  // Show warning
  showToast('Warning message', 'warning');
  
  // Custom duration (in milliseconds)
  showToast('Quick message', 'info', 3000);
}
```

### Features
- 4 types: success, error, info, warning
- Auto-dismiss with configurable duration
- Manual dismiss button
- Proper ARIA labels for screen readers
- Slide-in animation
- Stacks multiple toasts vertically

## ♿ Accessibility Improvements (WCAG 2.1 AAA)

### Overview
Comprehensive accessibility enhancements to meet WCAG 2.1 AAA standards.

### Implemented Features

#### 1. Color Contrast
- All color combinations meet AAA contrast ratio requirements (7:1 for normal text, 4.5:1 for large text)
- Dark mode colors carefully chosen for optimal contrast

#### 2. Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper focus indicators with 3px outline
- Focus visible on all interactive elements
- Tab order follows logical structure

#### 3. ARIA Support
All form components include:
- `aria-label` and `aria-labelledby` for proper labeling
- `aria-invalid` for error states
- `aria-describedby` for help text and errors
- `aria-required` for required fields

Example:
```tsx
<Input
  label="Email"
  required
  error="Invalid email"
  helperText="Enter your email address"
/>
// Automatically includes:
// - aria-invalid="true" (when error present)
// - aria-describedby="email-error email-helper"
// - aria-required="true"
```

#### 4. Skip Navigation
A "Skip to main content" link is now present at the top of each page:
```html
<a href="#main-content" className="skip-to-content">
  Aller au contenu principal
</a>
```

#### 5. Screen Reader Support
- Proper semantic HTML (`<main>`, `<nav>`, `<article>`, `<section>`)
- `role` attributes where appropriate
- Hidden icons with `aria-hidden="true"`
- Descriptive labels with `sr-only` class for screen readers

#### 6. Reduced Motion Support
Respects user's motion preferences:
```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled or shortened */
}
```

#### 7. High Contrast Mode Support
```css
@media (prefers-contrast: high) {
  /* Enhanced borders and contrast */
}
```

#### 8. Form Accessibility
- All form fields properly labeled
- Error messages announced to screen readers
- Required fields clearly marked
- Help text associated with inputs

## 🏥 Custom Medical Icon Library

### Overview
A comprehensive library of medical-specific icons, all WCAG compliant.

### Available Icons

```tsx
import {
  StethoscopeIcon,
  PrescriptionIcon,
  VaccineIcon,
  HeartRateIcon,
  BloodTestIcon,
  MedicalRecordIcon,
  AppointmentIcon,
  PillIcon,
  DoctorIcon,
  EmergencyIcon,
  LabIcon,
  XRayIcon,
} from '@/components/ui/MedicalIcons';
```

### Usage

```tsx
// Basic usage
<StethoscopeIcon size={24} className="text-primary-500" />

// With custom size and color
<PrescriptionIcon 
  size={32} 
  className="text-blue-600 dark:text-blue-400" 
/>

// Accessible icon with label
<HeartRateIcon 
  size={20}
  aria-label="Fréquence cardiaque"
  role="img"
/>
```

### Icon List

| Icon | Component | Use Case |
|------|-----------|----------|
| 🩺 | `StethoscopeIcon` | General medical/examination |
| 📋 | `PrescriptionIcon` | Prescriptions and medical orders |
| 💉 | `VaccineIcon` | Vaccinations and injections |
| 💓 | `HeartRateIcon` | Vital signs and health monitoring |
| 🧪 | `BloodTestIcon` | Laboratory tests |
| 📁 | `MedicalRecordIcon` | Medical records and history |
| 📅 | `AppointmentIcon` | Appointments and scheduling |
| 💊 | `PillIcon` | Medications and pharmacy |
| 👨‍⚕️ | `DoctorIcon` | Healthcare providers |
| 🚨 | `EmergencyIcon` | Emergency and urgent care |
| 🔬 | `LabIcon` | Laboratory and research |
| 🦴 | `XRayIcon` | Imaging and radiology |

### Features
- SVG-based for crisp rendering at any size
- Accessible with proper `role` and `aria-label`
- Respects dark mode color schemes
- Consistent 24x24 default size
- Customizable via props

## 🎨 Updated Components

All UI components have been updated with:
- Dark mode support
- Enhanced accessibility
- Micro-interactions
- Better error handling
- Improved visual feedback

### Button Component
- Gradient backgrounds with dark mode variants
- Ripple effect on click
- Loading states with spinner
- Enhanced focus indicators
- All ARIA attributes

### Card Component
- Dark mode styling
- Optional hover effects
- Semantic HTML support (`as` prop)
- Proper heading levels

### Input Components
- Full dark mode support
- Error state announcements
- Proper ARIA associations
- Enhanced focus states
- Helper text support

## 🧪 Testing

All new features include proper ARIA attributes and are tested for:
- Keyboard navigation
- Screen reader compatibility
- Color contrast (AAA standard)
- Focus management
- Animation performance

## 📱 Responsive Design

All features work seamlessly across:
- Desktop (1920px+)
- Laptop (1366px - 1919px)
- Tablet (768px - 1365px)
- Mobile (320px - 767px)

## 🔧 Configuration

### Tailwind Configuration
Dark mode is enabled via class strategy in `tailwind.config.js`:
```js
module.exports = {
  darkMode: 'class',
  // ...
}
```

### CSS Variables
All colors are defined as CSS variables in `globals.css` for easy theming:
```css
:root {
  --primary-color: #1ABC9C;
  /* ... */
}

.dark {
  --primary-color: #48C9B0;
  /* ... */
}
```

## 🚀 Getting Started

1. The ThemeProvider and ToastProvider are already set up in `layout.tsx`
2. Import and use components as needed
3. All existing pages automatically support dark mode
4. Use the `useTheme()` and `useToast()` hooks in your components

## 📚 Examples

See the home page (`src/app/page.tsx`) for examples of:
- Theme integration
- Medical icons usage
- Interactive cards
- Accessible buttons
- Proper semantic structure

## 🔄 Migration Guide

For existing components:
1. Add dark mode class variants (e.g., `dark:bg-neutral-800`)
2. Update ARIA attributes for accessibility
3. Add micro-interaction classes where appropriate
4. Replace generic icons with medical icons from the library

## 🎯 Best Practices

1. **Always use semantic HTML**
2. **Include ARIA labels** for all interactive elements
3. **Test with keyboard navigation**
4. **Verify color contrast** in both light and dark modes
5. **Use medical icons** for medical-specific features
6. **Show toast notifications** for user actions
7. **Respect reduced motion** preferences
8. **Provide skip links** for navigation
