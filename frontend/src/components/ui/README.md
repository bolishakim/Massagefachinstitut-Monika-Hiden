# UI Components Design System

A comprehensive, accessible, and customizable UI component library built with React, TypeScript, Tailwind CSS, and Framer Motion.

## Overview

This design system provides a complete set of reusable UI components that follow modern design principles, accessibility standards, and performance best practices.

## Features

- 🎨 **Consistent Design** - Unified visual language across all components
- ♿ **Accessibility First** - WCAG 2.1 AA compliant components
- 🎭 **Smooth Animations** - Powered by Framer Motion
- 📱 **Responsive** - Mobile-first design approach
- 🎯 **Type Safe** - Full TypeScript support
- 🎨 **Customizable** - Easy theming with CSS custom properties
- ⚡ **Performance** - Optimized for minimal bundle size

## Components

### Typography

Comprehensive text styling components with semantic hierarchy:

```tsx
import { H1, H2, TextMD, Lead, Code } from '@/components/ui/Typography';

// Headings
<H1>Page Title</H1>
<H2>Section Title</H2>

// Body Text
<TextMD>Regular paragraph text</TextMD>
<Lead>Lead paragraph with emphasis</Lead>

// Code
<Code>inline code</Code>
```

**Available Components:**
- Display: `DisplayXL`, `DisplayLG`, `DisplayMD`, `DisplaySM`
- Headings: `H1`, `H2`, `H3`, `H4`, `H5`, `H6`
- Text: `TextLG`, `TextMD`, `TextSM`, `TextXS`
- Special: `Lead`, `Subtitle`, `Caption`, `Overline`
- Code: `Code`, `CodeBlock`
- Lists: `UnorderedList`, `OrderedList`, `ListItem`
- Links: `Link` with variants
- Quotes: `Blockquote`

### Layout Components

Flexible layout system for responsive designs:

```tsx
import { Grid, GridItem, Flex, Container } from '@/components/ui/Grid';
import { Section, Stack, Inline, Center } from '@/components/ui/Layout';

// Grid System
<Grid cols={3} gap={4} responsive={{ md: 2, lg: 3 }}>
  <GridItem span={2}>Content</GridItem>
  <GridItem>Sidebar</GridItem>
</Grid>

// Flexbox
<Flex direction="row" align="center" justify="between">
  <div>Left</div>
  <div>Right</div>
</Flex>

// Stack (Vertical spacing)
<Stack space="lg">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>
```

**Layout Components:**
- `Grid` - CSS Grid with responsive breakpoints
- `GridItem` - Grid item with span control
- `Flex` - Flexbox container with full control
- `Container` - Max-width container with responsive padding
- `Section` - Semantic section with consistent spacing
- `Stack` - Vertical spacing between children
- `Inline` - Horizontal spacing with wrapping
- `SidebarLayout` - Two-column layout with sidebar
- `Center` - Center content with max-width
- `Divider` - Visual separator with optional text

### Form Components

Accessible form controls with validation:

```tsx
import { Input, Button, Checkbox, Select } from '@/components/ui';

<form>
  <Input 
    label="Email" 
    type="email" 
    placeholder="Enter email"
    error="Invalid email format"
  />
  
  <Checkbox 
    label="Subscribe to newsletter"
    description="Get updates about new features"
  />
  
  <Select
    label="Country"
    options={[
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' }
    ]}
    placeholder="Select country"
  />
  
  <Button type="submit" variant="primary">
    Submit
  </Button>
</form>
```

### Interactive Components

Rich interactive components with animations:

```tsx
import { Modal, Card, Badge, Avatar, Alert } from '@/components/ui';

// Modal
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <ModalHeader>
    <ModalTitle>Confirmation</ModalTitle>
  </ModalHeader>
  <ModalContent>
    Are you sure you want to delete this item?
  </ModalContent>
  <ModalFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="destructive">Delete</Button>
  </ModalFooter>
</Modal>
```

## Design Tokens

### Colors

Our color system uses semantic naming for consistency:

```css
/* Primary Colors */
--primary: 222 84% 5%;
--primary-foreground: 210 40% 98%;

/* Secondary Colors */
--secondary: 210 40% 96%;
--secondary-foreground: 222 84% 5%;

/* Status Colors */
--destructive: 0 84% 60%;
--success: 142 76% 36%;
--warning: 38 92% 50%;
```

### Typography Scale

Consistent typography with optimal line heights:

```css
/* Display Sizes */
--text-display-2xl: 4.5rem;    /* 72px */
--text-display-lg: 3.75rem;    /* 60px */
--text-display-md: 3rem;       /* 48px */
--text-display-sm: 2.25rem;    /* 36px */

/* Headings */
--text-4xl: 2.25rem;           /* 36px */
--text-3xl: 1.875rem;          /* 30px */
--text-2xl: 1.5rem;            /* 24px */
--text-xl: 1.25rem;            /* 20px */
--text-lg: 1.125rem;           /* 18px */
--text-base: 1rem;             /* 16px */
--text-sm: 0.875rem;           /* 14px */
--text-xs: 0.75rem;            /* 12px */
```

### Spacing System

Consistent spacing using a 4px base unit:

```css
0: 0px
1: 4px     2: 8px     3: 12px    4: 16px
5: 20px    6: 24px    7: 28px    8: 32px
9: 36px    10: 40px   11: 44px   12: 48px
```

### Border Radius

```css
--radius-sm: 0.125rem;    /* 2px */
--radius: 0.375rem;       /* 6px */
--radius-md: 0.5rem;      /* 8px */
--radius-lg: 0.75rem;     /* 12px */
--radius-xl: 1rem;        /* 16px */
```

### Shadows

Layered shadow system for depth:

```css
--shadow-elegant: 0 4px 6px -1px rgb(0 0 0 / 0.1), 
                  0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 
             0 4px 6px -4px rgb(0 0 0 / 0.1);
```

## Animation Guidelines

### Duration

- **Fast**: 150ms - Micro-interactions (hover states)
- **Medium**: 200-300ms - Component transitions
- **Slow**: 400-500ms - Page transitions

### Easing

- **ease-out**: Default for entrances
- **ease-in**: For exits
- **spring**: For interactive elements

```tsx
// Example with custom spring animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  Content
</motion.div>
```

## Responsive Breakpoints

Mobile-first approach with consistent breakpoints:

```css
sm: 640px   /* Small tablets */
md: 768px   /* Large tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Focus management
- ✅ Color contrast compliance
- ✅ Semantic HTML structure
- ✅ ARIA attributes where needed

## Theming

### CSS Custom Properties

Easily customize the design system by overriding CSS custom properties:

```css
:root {
  --primary: 221 83% 53%;        /* Blue theme */
  --radius: 0.5rem;              /* More rounded */
}

[data-theme="dark"] {
  --background: 222 84% 5%;
  --foreground: 210 40% 98%;
}
```

### Component Variants

Many components support variant props for different styles:

```tsx
<Button variant="primary" size="lg">Primary</Button>
<Button variant="outline" size="sm">Outline</Button>
<Button variant="ghost">Ghost</Button>

<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="destructive">Error</Badge>
```

## Best Practices

### Component Composition

Favor composition over large monolithic components:

```tsx
// Good ✅
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>

// Avoid ❌
<Card 
  title="Title" 
  description="Description" 
  content="Content here"
  showHeader={true}
/>
```

### Consistent Spacing

Use the Stack and Inline components for consistent spacing:

```tsx
// Good ✅
<Stack space="lg">
  <H2>Section Title</H2>
  <TextMD>Section content</TextMD>
</Stack>

// Avoid ❌
<div className="space-y-8">
  <h2 className="text-2xl">Section Title</h2>
  <p className="text-base">Section content</p>
</div>
```

### Performance

- Use React.memo() for expensive components
- Implement code splitting for large component libraries
- Optimize animations with `will-change` CSS property
- Use Tailwind's JIT mode for optimal bundle size

## Contributing

When adding new components:

1. Follow existing naming conventions
2. Include TypeScript interfaces
3. Add accessibility features
4. Include responsive behavior
5. Document with examples
6. Test across devices and browsers

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

---

This design system is continuously evolving. For questions or contributions, please refer to the project documentation or create an issue in the repository.