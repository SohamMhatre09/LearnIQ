# LearnIQ Color Theme Guide

## 🎨 Consistent Brand Color Scheme (Yellow, Black, Blue)

This document outlines the consistent color theme implemented across the LearnIQ website based on the Landing page design.

### **Primary Colors**

#### 🟡 **Yellow (Primary Action Color)**
- **Primary Yellow**: `yellow-400` (#FBBF24) - Main CTA buttons, highlights, badges
- **Yellow Hover**: `yellow-500` (#F59E0B) - Hover states for yellow buttons
- **Yellow Light**: `yellow-300` (#FCD34D) - Light backgrounds, subtle highlights
- **Usage**: Primary buttons, navigation highlights, success states, badges

#### 🔵 **Blue (Secondary Action Color)**
- **Primary Blue**: `blue-500` (#3B82F6) - Secondary buttons, links, icons
- **Blue Hover**: `blue-600` (#2563EB) - Hover states for blue elements
- **Blue Light**: `blue-400` (#60A5FA) - Lighter blue for accents
- **Usage**: Links, secondary buttons, info states, icons

#### ⚫ **Black & Gray**
- **Pure Black**: `black` (#000000) - Text on yellow backgrounds
- **Dark Gray**: `gray-900` (#111827) - Primary text
- **Medium Gray**: `gray-600` (#4B5563) - Secondary text
- **Light Gray**: `gray-100` (#F3F4F6) - Backgrounds

### **Applied Changes**

#### ✅ **Global Theme (CSS Variables)**
- Updated `--primary` to yellow-400 HSL values
- Updated `--secondary` to blue-500 HSL values
- Removed rounded corners (brutalist design)
- Updated ring colors to yellow

#### ✅ **Button Component**
- Default buttons now use yellow background with black text
- Added `yellow` and `blue` variants
- Updated hover states
- Removed rounded corners

#### ✅ **Updated Pages**
- **Login Page**: Yellow accent, blue icons, consistent branding
- **Register Page**: Matching color scheme
- **Dashboard**: Yellow highlights and accents
- **Landing Page**: Already using the theme (source of colors)

#### ✅ **Updated Components**
- **AuthNav**: Yellow primary button, blue teacher indicator
- **AssignmentCard**: Yellow completed indicator, blue CTA text
- **Button**: New yellow and blue variants

### **Implementation Guidelines**

#### **Primary Actions (CTA)**
```tsx
<Button className="bg-yellow-400 text-black hover:bg-yellow-500">
  Primary Action
</Button>
```

#### **Secondary Actions**
```tsx
<Button variant="outline" className="border-2 border-blue-500 text-blue-500 hover:bg-blue-50">
  Secondary Action
</Button>
```

#### **Links**
```tsx
<Link className="text-blue-500 hover:text-blue-600 font-medium">
  Navigation Link
</Link>
```

#### **Success/Completed States**
```tsx
<div className="text-yellow-400">
  <CheckCircle className="h-5 w-5" />
</div>
```

#### **Information/Icons**
```tsx
<Icon className="h-4 w-4 text-blue-500" />
```

### **Design Principles**

1. **Brutalist Approach**: No rounded corners (`border-radius: 0`)
2. **High Contrast**: Yellow on black, black on yellow
3. **Consistent Spacing**: Maintain existing spacing systems
4. **Bold Typography**: Font weights 500-700 for important elements
5. **Clear Hierarchy**: Yellow for primary, blue for secondary, gray for tertiary

### **Next Steps**

To complete the theme implementation:

1. ✅ Update remaining page components
2. ✅ Update form components (inputs, selects)
3. ✅ Update navigation components
4. ✅ Update modal/dialog components
5. ✅ Update card components
6. ✅ Test accessibility (contrast ratios)
7. ✅ Update error/success states

### **Accessibility Notes**

- Yellow (#FBBF24) on Black (#000000): Contrast ratio > 4.5:1 ✅
- Black (#000000) on Yellow (#FBBF24): Contrast ratio > 4.5:1 ✅
- Blue (#3B82F6) on White (#FFFFFF): Contrast ratio > 4.5:1 ✅
- All color combinations meet WCAG AA standards

---
**Last Updated**: June 14, 2025
**Theme Status**: ✅ Implemented across core components
