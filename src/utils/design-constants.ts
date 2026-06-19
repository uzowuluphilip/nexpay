/**
 * Consistent Design System Constants
 * Used throughout the app for unified visual language
 */

// Spacing Scale (in pixels)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border Radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

// Icon Sizing
export const ICON_SIZE = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
} as const;

// Shadow Depths
export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  premium: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  glow: '0 0 30px -10px rgba(139, 92, 246, 0.4)',
} as const;

// Color Palette for Consistency
export const COLORS = {
  primary: '#8B5CF6', // Violet
  secondary: '#7C3AED',
  accent: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

// Typography Hierarchy
export const TYPOGRAPHY = {
  h1: {
    size: '2.25rem', // 36px
    weight: 700,
    lineHeight: '2.5rem',
    letterSpacing: '-0.02em',
  },
  h2: {
    size: '1.875rem', // 30px
    weight: 700,
    lineHeight: '2.25rem',
    letterSpacing: '-0.01em',
  },
  h3: {
    size: '1.5rem', // 24px
    weight: 600,
    lineHeight: '1.875rem',
  },
  h4: {
    size: '1.25rem', // 20px
    weight: 600,
    lineHeight: '1.5rem',
  },
  body: {
    size: '1rem', // 16px
    weight: 400,
    lineHeight: '1.5rem',
  },
  bodyMedium: {
    size: '0.875rem', // 14px
    weight: 500,
    lineHeight: '1.25rem',
  },
  bodySmall: {
    size: '0.75rem', // 12px
    weight: 400,
    lineHeight: '1rem',
  },
  caption: {
    size: '0.625rem', // 10px
    weight: 600,
    lineHeight: '0.875rem',
    letterSpacing: '0.1em',
  },
} as const;

// Transition Durations (in milliseconds)
export const DURATIONS = {
  fast: 150,
  base: 250,
  slow: 350,
  slower: 500,
} as const;

// Easing Functions
export const EASING = {
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;
