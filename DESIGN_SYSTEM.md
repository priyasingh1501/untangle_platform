# Untangle Design System

This document outlines the comprehensive design system for the Untangle application, ensuring visual consistency across all components and pages.

## 🎨 **Design Tokens**

### **Colors**

#### Primary Colors
- **Primary Blue**: `#0EA5E9` - Main brand color for primary actions
- **Primary Blue Shades**: 50-900 scale for various use cases

#### Accent Colors
- **Yellow**: `#FFD200` - Primary accent for highlights and CTAs
- **Green**: `#3CCB7F` - Success states and positive actions
- **Teal**: `#4ECDC4` - Secondary accent for variety
- **Blue**: `#0EA5E9` - Information and links
- **Purple**: `#8B5CF6` - Premium features
- **Pink**: `#EC4899` - Special actions
- **Orange**: `#F97316` - Warnings and alerts
- **Red**: `#EF4444` - Errors and destructive actions

#### Background Colors
- **Primary**: `#0A0C0F` - Main app background
- **Secondary**: `#11151A` - Sidebar and card backgrounds
- **Tertiary**: `#1A1F2E` - Elevated surfaces
- **Card**: `#1E2330` - Card backgrounds
- **Overlay**: `rgba(0, 0, 0, 0.5)` - Modal overlays

#### Text Colors
- **Primary**: `#E8EEF2` - Main text
- **Secondary**: `#C9D1D9` - Secondary text
- **Tertiary**: `#94A3B8` - Muted text
- **Muted**: `#64748B` - Disabled text
- **Inverse**: `#0A0C0F` - Text on light backgrounds

#### Border Colors
- **Primary**: `#2A313A` - Main borders
- **Secondary**: `#3A414A` - Hover borders
- **Accent**: `#3CCB7F` - Focus borders
- **Status Colors**: Error, success, warning variants

### **Typography**

#### Font Families
- **Primary**: `Inter` - Main body text and UI elements
- **Display**: `Oswald` - Headings and titles
- **Mono**: `JetBrains Mono` - Code and technical content

#### Font Sizes
- **xs**: `0.75rem` (12px) - Small labels and captions
- **sm**: `0.875rem` (14px) - Body text
- **base**: `1rem` (16px) - Default text size
- **lg**: `1.125rem` (18px) - Large body text
- **xl**: `1.25rem` (20px) - Small headings
- **2xl**: `1.5rem` (24px) - Section headings
- **3xl**: `1.875rem` (30px) - Page headings
- **4xl**: `2.25rem` (36px) - Large page headings
- **5xl**: `3rem` (48px) - Hero headings
- **6xl**: `3.75rem` (60px) - Display headings

#### Font Weights
- **Light**: 300 - Subtle emphasis
- **Normal**: 400 - Default text
- **Medium**: 500 - Semi-bold emphasis
- **Semibold**: 600 - Strong emphasis
- **Bold**: 700 - Heavy emphasis
- **Extrabold**: 800 - Extra heavy emphasis
- **Black**: 900 - Maximum emphasis

### **Spacing**

#### Base Scale (4px Grid)
- **0**: `0` - No spacing
- **1**: `0.25rem` (4px) - Minimal spacing
- **2**: `0.5rem` (8px) - Small spacing
- **3**: `0.75rem` (12px) - Medium spacing
- **4**: `1rem` (16px) - Base spacing
- **5**: `1.25rem` (20px) - Large spacing
- **6**: `1.5rem` (24px) - Extra large spacing
- **8**: `2rem` (32px) - Section spacing
- **12**: `3rem` (48px) - Page spacing
- **16**: `4rem` (64px) - Large page spacing

### **Border Radius**

- **none**: `0` - Sharp corners
- **sm**: `0.125rem` (2px) - Subtle rounding
- **base**: `0.25rem` (4px) - Default rounding
- **md**: `0.375rem` (6px) - Medium rounding
- **lg**: `0.5rem` (8px) - Large rounding
- **xl**: `0.75rem` (12px) - Extra large rounding
- **2xl**: `1rem` (16px) - Card rounding
- **3xl**: `1.5rem` (24px) - Large card rounding
- **full**: `9999px` - Fully rounded

### **Shadows**

- **sm**: Subtle elevation
- **base**: Default elevation
- **md**: Medium elevation
- **lg**: Large elevation
- **xl**: Extra large elevation
- **2xl**: Maximum elevation
- **inner**: Inset shadows
- **none**: No shadow

### **Transitions**

#### Duration
- **Fast**: `150ms` - Quick interactions
- **Normal**: `200ms` - Standard interactions
- **Slow**: `300ms` - Smooth animations
- **Slower**: `500ms` - Long animations

#### Easing
- **Linear**: No easing
- **In**: Ease in
- **Out**: Ease out
- **InOut**: Ease in and out

## 🧩 **Component Library**

### **Card Component**
```jsx
import { Card } from '../components/ui';

// Base card
<Card>Content</Card>

// Elevated card
<Card variant="elevated">Content</Card>

// Interactive card
<Card variant="interactive" onClick={handleClick}>Content</Card>
```

**Variants:**
- `base` - Standard card with subtle hover effects
- `elevated` - Higher elevation with stronger shadows
- `interactive` - Clickable card with scale animations

### **Button Component**
```jsx
import { Button } from '../components/ui';

// Primary button
<Button variant="primary">Click me</Button>

// Secondary button
<Button variant="secondary">Click me</Button>

// Ghost button
<Button variant="ghost">Click me</Button>
```

**Variants:**
- `primary` - Gradient background with strong emphasis
- `secondary` - Outlined style for secondary actions
- `ghost` - Minimal styling for subtle actions

**Sizes:**
- `sm` - Small buttons
- `md` - Default size
- `lg` - Large buttons
- `xl` - Extra large buttons

### **Input Component**
```jsx
import { Input } from '../components/ui';

<Input
  label="Email"
  placeholder="Enter your email"
  error="Invalid email"
  success="Email is valid"
/>
```

**Features:**
- Built-in label support
- Error and success states
- Consistent styling with design tokens
- Focus animations

### **Badge Component**
```jsx
import { Badge } from '../components/ui';

<Badge variant="success">Completed</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="info">Info</Badge>
```

**Variants:**
- `success` - Green styling for positive states
- `error` - Red styling for error states
- `warning` - Yellow styling for warnings
- `info` - Blue styling for information

### **Header Component**
```jsx
import { Header } from '../components/ui';

<Header level={1}>Main Title</Header>
<Header level={2}>Section Title</Header>
<Header level={3}>Subsection Title</Header>
```

**Levels:**
- `1` - Main page title (H1)
- `2` - Section title (H2)
- `3` - Subsection title (H3)
- `4` - Small heading (H4)

### **Section Component**
```jsx
import { Section } from '../components/ui';

<Section>
  <Header level={1}>Page Title</Header>
  <Card>Content</Card>
</Section>
```

**Features:**
- Consistent page layout
- Built-in container constraints
- Proper spacing and padding
- Background styling

### **Banner Component**
```jsx
import { Banner } from '../components/ui';

<Banner variant="success" title="Success!">
  Your action was completed successfully.
</Banner>

<Banner variant="error" title="Error" onClose={handleClose}>
  Something went wrong. Please try again.
</Banner>
```

**Variants:**
- `info` - Blue styling for information
- `success` - Green styling for success messages
- `warning` - Yellow styling for warnings
- `error` - Red styling for error messages

## 🎭 **Animations**

### **Framer Motion Variants**

#### Fade Animations
```jsx
import { animations } from '../styles/designTokens';

<motion.div
  initial={animations.fade.initial}
  animate={animations.fade.animate}
  exit={animations.fade.exit}
  transition={animations.fade.transition}
>
  Content
</motion.div>
```

#### Slide Animations
```jsx
// Slide up
<motion.div {...animations.slideUp}>Content</motion.div>

// Slide down
<motion.div {...animations.slideDown}>Content</motion.div>

// Slide left
<motion.div {...animations.slideLeft}>Content</motion.div>

// Slide right
<motion.div {...animations.slideRight}>Content</motion.div>
```

#### Scale Animations
```jsx
<motion.div {...animations.scale}>Content</motion.div>
```

#### Hover Animations
```jsx
<motion.div
  whileHover={animations.hover}
  whileTap={animations.tap}
>
  Interactive Content
</motion.div>
```

### **Stagger Animations**
```jsx
<motion.div
  variants={animations.stagger}
  initial="initial"
  animate="animate"
>
  {items.map((item, index) => (
    <motion.div key={index} variants={animations.fade}>
      {item}
    </motion.div>
  ))}
</motion.div>
```

## 📱 **Responsive Design**

### **Breakpoints**
- **sm**: `640px` - Small devices
- **md**: `768px` - Medium devices
- **lg**: `1024px` - Large devices
- **xl**: `1280px` - Extra large devices
- **2xl**: `1536px` - Maximum width

### **Responsive Utilities**
```jsx
// Responsive text sizes
className="text-2xl sm:text-3xl lg:text-4xl"

// Responsive spacing
className="p-4 sm:p-6 lg:p-8"

// Responsive layouts
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

## 🎯 **Usage Guidelines**

### **Color Usage**
1. **Primary Actions**: Use accent colors (yellow, green, teal)
2. **Secondary Actions**: Use neutral colors
3. **Status Indicators**: Use appropriate status colors
4. **Text**: Maintain proper contrast ratios
5. **Borders**: Use subtle borders for separation

### **Typography Hierarchy**
1. **H1**: Main page titles only
2. **H2**: Major section headings
3. **H3**: Subsection headings
4. **Body**: Regular content text
5. **Small**: Captions and metadata

### **Spacing Consistency**
1. **Use the 4px grid system**
2. **Maintain consistent spacing between related elements**
3. **Use larger spacing for section separation**
4. **Keep component spacing consistent**

### **Animation Principles**
1. **Subtle and purposeful animations**
2. **Consistent timing (200ms standard)**
3. **Smooth easing curves**
4. **Performance-conscious animations**
5. **Accessibility considerations**

### **Component Composition**
1. **Use existing components when possible**
2. **Extend components rather than creating new ones**
3. **Maintain consistent prop interfaces**
4. **Follow established patterns**

## 🔧 **Implementation**

### **Importing Components**
```jsx
import { 
  Card, 
  Button, 
  Input, 
  Badge, 
  Header, 
  Section, 
  Banner 
} from '../components/ui';
```

### **Importing Design Tokens**
```jsx
import { 
  colors, 
  typography, 
  spacing, 
  componentStyles, 
  animations 
} from '../styles/designTokens';
```

### **Custom Styling**
```jsx
// Using design tokens
className={`${componentStyles.card.base} ${customClasses}`}

// Using color tokens
style={{ backgroundColor: colors.accent.green }}

// Using spacing tokens
className={`p-${spacing[4]} m-${spacing[6]}`}
```

## 📋 **Accessibility**

### **Color Contrast**
- All text meets WCAG AA standards
- Interactive elements have sufficient contrast
- Status colors are distinguishable

### **Focus States**
- Clear focus indicators
- Keyboard navigation support
- Screen reader compatibility

### **Motion Preferences**
- Respect `prefers-reduced-motion`
- Provide alternative interactions
- Maintain functionality without animations

## 🚀 **Best Practices**

1. **Consistency First**: Always use design tokens
2. **Component Reuse**: Leverage existing components
3. **Responsive Design**: Design for all screen sizes
4. **Performance**: Optimize animations and interactions
5. **Accessibility**: Ensure inclusive design
6. **Documentation**: Keep this guide updated
7. **Testing**: Verify across different devices and browsers

## 📚 **Resources**

- **Figma Design Files**: [Link to design system]
- **Component Storybook**: [Link to component library]
- **Design Tokens**: `src/styles/designTokens.js`
- **UI Components**: `src/components/ui/`
- **Examples**: See existing pages for implementation patterns

---

*This design system ensures that every component in the Untangle application maintains visual consistency while providing flexibility for different use cases. Always refer to this guide when creating new components or modifying existing ones.*
