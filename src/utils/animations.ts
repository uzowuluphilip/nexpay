/**
 * Animation Utilities and Framer Motion Variants
 * Provides consistent animation patterns across the app
 */

import { Variants } from 'framer-motion';
import { DURATIONS } from './design-constants';

// Page transitions
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.base / 1000,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: DURATIONS.fast / 1000,
    },
  },
};

// Card fade-in with slight slide
export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.base / 1000,
    },
  },
};

// Stagger container for multiple cards
export const containerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Button press feedback
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

// Number counter animation
export const numberVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: DURATIONS.slow / 1000,
    },
  },
};

// Skeleton loading pulse
export const skeletonVariants: Variants = {
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
    },
  },
};

// Glow effect animation
export const glowVariants: Variants = {
  animate: {
    boxShadow: [
      '0 0 20px -10px rgba(139, 92, 246, 0.3)',
      '0 0 40px -10px rgba(139, 92, 246, 0.5)',
      '0 0 20px -10px rgba(139, 92, 246, 0.3)',
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
    },
  },
};

// Slide in from left
export const slideInLeftVariants: Variants = {
  initial: {
    opacity: 0,
    x: -32,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATIONS.base / 1000,
    },
  },
};

// Slide in from right
export const slideInRightVariants: Variants = {
  initial: {
    opacity: 0,
    x: 32,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATIONS.base / 1000,
    },
  },
};

// Chart line draw animation
export const chartLineVariants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: DURATIONS.slow / 1000,
    },
  },
};

// Bounce animation
export const bounceVariants: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
    },
  },
};
