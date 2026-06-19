/**
 * Premium Card Components
 * Reusable card with consistent styling, depth, and animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cardVariants } from '@/utils/animations';
import { SPACING, RADIUS, SHADOWS } from '@/utils/design-constants';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'ghost';
  animated?: boolean;
  glowing?: boolean;
  onClick?: () => void;
  [key: string]: any;
}

/**
 * Standard Card Component
 */
export function Card({
  children,
  className = '',
  variant = 'default',
  animated = true,
  glowing = false,
  onClick,
  ...props
}: CardProps) {
  const baseClasses = 'rounded-2xl overflow-hidden';

  const variantClasses = {
    default:
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700 text-white',
    ghost: 'bg-transparent',
  };

  const glowClass = glowing
    ? 'shadow-xl'
    : 'shadow-lg';

  const Component = animated ? motion.div : 'div';
  const componentProps = animated
    ? {
        variants: cardVariants,
        initial: 'initial',
        animate: 'animate',
      }
    : {};

  return (
    <Component
      className={`${baseClasses} ${variantClasses[variant]} ${glowClass} ${className}`}
      onClick={onClick}
      style={glowing ? { boxShadow: SHADOWS.glow } : {}}
      {...componentProps}
      {...props}
    >
      <div
        style={{
          padding: `${SPACING.lg}px`,
        }}
      >
        {children}
      </div>
    </Component>
  );
}

/**
 * Premium Balance Card with Glow Effect
 */
export function BalanceCard({
  title,
  amount,
  subtitle,
  children,
  animated = true,
  className = '',
}: {
  title: string;
  amount: string | React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode;
  animated?: boolean;
  className?: string;
}) {
  const Component = animated ? motion.div : 'div';
  const componentProps = animated
    ? {
        variants: cardVariants,
        initial: 'initial',
        animate: 'animate',
      }
    : {};

  return (
    <Component
      className={`bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white rounded-3xl overflow-hidden relative ${className}`}
      style={{
        boxShadow: SHADOWS.glow,
        padding: `${SPACING.lg}px`,
      }}
      {...componentProps}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"
        style={{ backdropFilter: 'blur(40px)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"
        style={{ backdropFilter: 'blur(40px)' }}
      />

      {/* Content */}
      <div className="relative z-10 space-y-6">
        <div>
          <p
            className="text-white/70 mb-2"
            style={{ fontSize: '0.875rem', fontWeight: 500 }}
          >
            {title}
          </p>
          <div className="text-5xl font-bold text-white">{amount}</div>
          {subtitle && (
            <p
              className="text-white/60 mt-1"
              style={{ fontSize: '0.75rem' }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </Component>
  );
}

/**
 * Stat Card - for dashboard stats
 */
export function StatCard({
  label,
  value,
  change,
  icon,
  animated = true,
  className = '',
}: {
  label: string;
  value: string | React.ReactNode;
  change?: string | React.ReactNode;
  icon?: React.ReactNode;
  animated?: boolean;
  className?: string;
}) {
  return (
    <Card animated={animated} className={className}>
      <div className="space-y-3">
        {icon && <div className="text-purple-600 dark:text-purple-400">{icon}</div>}
        <div>
          <p
            className="text-gray-600 dark:text-gray-400 mb-1"
            style={{ fontSize: '0.875rem' }}
          >
            {label}
          </p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {change && (
          <p
            className="text-green-600 dark:text-green-400"
            style={{ fontSize: '0.875rem' }}
          >
            {change}
          </p>
        )}
      </div>
    </Card>
  );
}
