/**
 * PageWrapper Component
 * Provides consistent page transitions and animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { pageVariants, containerVariants } from '@/utils/animations';
import { SPACING } from '@/utils/design-constants';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animated?: boolean;
}

/**
 * Wraps page content with fade/slide animations
 */
export function PageWrapper({
  children,
  className = '',
  containerClassName = '',
  animated = true,
}: PageWrapperProps) {
  const Component = animated ? motion.div : 'div';
  const componentProps = animated
    ? {
        variants: pageVariants,
        initial: 'initial',
        animate: 'animate',
        exit: 'exit',
      }
    : {};

  return (
    <Component
      className={`w-full ${className}`}
      {...componentProps}
    >
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${containerClassName}`}
        style={{ paddingTop: `${SPACING.lg}px`, paddingBottom: `${SPACING.lg}px` }}
      >
        {children}
      </div>
    </Component>
  );
}

/**
 * Container for staggered card animations
 */
export function AnimatedContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default PageWrapper;
