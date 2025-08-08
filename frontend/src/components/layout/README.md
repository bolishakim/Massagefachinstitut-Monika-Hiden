# Application Layout System

A comprehensive, responsive, and accessible application layout system built with React, TypeScript, Tailwind CSS, and Framer Motion.

## Overview

This layout system provides a complete application shell with navigation, header, breadcrumbs, and mobile-responsive design that adapts seamlessly across all screen sizes.

## Features

- 🎨 **Responsive Design** - Mobile-first with tablet and desktop breakpoints
- ♿ **Accessibility First** - WCAG 2.1 AA compliant with keyboard navigation
- 🎭 **Smooth Animations** - Powered by Framer Motion
- 🔐 **Role-based Navigation** - Hide/show menu items based on user permissions
- 🍔 **Mobile Navigation** - Collapsible sidebar + bottom navigation
- 🗂️ **Breadcrumb System** - Automatic breadcrumb generation from routes
- 🔍 **Search Ready** - Prepared search functionality in header
- 🎯 **Theme Support** - Dark/light mode with system preference detection

## Components

### AppLayout

Main layout component that orchestrates the entire application shell.

```tsx
import { AppLayout } from '@/components/layout';

<AppLayout
  user={{
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin'
  }}
  currentPath="/dashboard"
  breadcrumbs={[
    { label: 'Dashboard', href: '/dashboard' }
  ]}
>
  <YourPageContent />
</AppLayout>
```

**Props:**
- `user` - Current user object with role for navigation filtering
- `currentPath` - Current route path for active state management
- `breadcrumbs` - Array of breadcrumb items
- `children` - Page content to render

### Sidebar

Collapsible sidebar navigation with role-based filtering.

**Features:**
- Collapsible on desktop
- Search functionality
- Active route highlighting
- Role-based menu visibility
- Tooltip support when collapsed
- Hierarchical navigation support

### Header

Top application header with user menu, notifications, and theme toggle.

**Features:**
- User profile dropdown
- Notifications with badge count
- Theme toggle (light/dark/system)
- Search bar (desktop)
- Mobile hamburger menu
- Quick action buttons

### Breadcrumb

Automatic breadcrumb generation with customization options.

```tsx
import { useBreadcrumbs } from '@/components/layout';

const breadcrumbs = useBreadcrumbs('/users/123/edit');
// Returns: [
//   { label: 'Home', href: '/dashboard' },
//   { label: 'Users', href: '/users' },
//   { label: 'Edit' }
// ]
```

### MobileNav

Bottom navigation for mobile devices with overflow handling.

**Features:**
- Bottom tab navigation
- Badge support for notifications
- Overflow menu for additional items
- Floating action button
- Active state animations

## Responsive Behavior

### Desktop (1024px+)
- Fixed sidebar (280px width)
- Collapsible sidebar (72px when collapsed)
- Full header with search
- Breadcrumbs in main content

### Tablet (768px - 1023px)
- Collapsible sidebar overlay
- Full header functionality
- Touch-optimized interactions

### Mobile (< 768px)
- Hidden sidebar
- Mobile header with hamburger menu
- Bottom navigation
- Floating action button
- Drawer-style sidebar overlay

## Navigation Configuration

Configure navigation items in `Sidebar.tsx`:

```tsx
const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    href: '/users',
    requiredRoles: ['admin'], // Role-based visibility
    badge: 'New', // Optional badge
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    href: '/products',
    children: [ // Hierarchical navigation
      {
        id: 'products-list',
        label: 'All Products',
        icon: Package,
        href: '/products',
      },
    ],
  },
];
```

## Accessibility Features

### Keyboard Navigation
- **Tab/Shift+Tab** - Navigate between focusable elements
- **Enter/Space** - Activate buttons and links
- **Escape** - Close modals and dropdowns
- **Arrow Keys** - Navigate within menus

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and roles
- Skip links for keyboard users
- Live regions for dynamic content
- Focus management

### Focus Management
```tsx
import { trapFocus, announceToScreenReader } from '@/utils/accessibility';

// Trap focus within modal
const cleanup = trapFocus(modalElement);

// Announce to screen readers
announceToScreenReader('Navigation updated', 'polite');
```

## Theme Integration

The layout integrates with the application theme system:

```tsx
// Theme toggle in header
const toggleTheme = () => {
  setIsDark(!isDark);
  document.documentElement.classList.toggle('dark');
};

// Respects user preferences
const prefersReducedMotion = useReducedMotion();
const isHighContrast = useHighContrastMode();
```

## Usage Examples

### Basic Setup

```tsx
import { AppLayout } from '@/components/layout';
import { useBreadcrumbs } from '@/components/layout';

function App() {
  const location = useLocation();
  const breadcrumbs = useBreadcrumbs(location.pathname);
  
  return (
    <AppLayout
      user={currentUser}
      currentPath={location.pathname}
      breadcrumbs={breadcrumbs}
    >
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppLayout>
  );
}
```

### Custom Navigation

```tsx
// Add custom navigation items
const customNavItems = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    requiredRoles: ['admin', 'manager'],
  },
];
```

### Route Protection Integration

```tsx
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRoles={['admin']}>
      <AppLayout user={user}>
        <AdminPanel />
      </AppLayout>
    </ProtectedRoute>
  }
/>
```

## Customization

### Styling
All components use Tailwind CSS and can be customized through:
- CSS custom properties for colors and spacing
- Tailwind configuration for breakpoints
- Component prop overrides for specific styling

### Animation
Animations can be disabled for users who prefer reduced motion:

```tsx
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={prefersReducedMotion ? false : { x: 100 }}
>
```

## Performance Considerations

- **Code Splitting** - Components are tree-shakable
- **Lazy Loading** - Heavy components can be lazy loaded
- **Animation Optimization** - Respects user preferences
- **Bundle Size** - Minimal dependencies, optimized imports

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Testing

The layout system includes:
- Unit tests for individual components
- Integration tests for user interactions
- Accessibility testing with axe-core
- Visual regression testing
- Mobile device testing

---

For additional examples and advanced usage, see the individual component documentation and the main application examples.