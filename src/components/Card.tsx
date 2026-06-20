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
      className={`bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 text-white rounded-3xl overflow-hidden relative backdrop-blur-xl border border-purple-400/20 ${className}`}
      style={{
        boxShadow: '0 0 60px -15px rgba(168, 85, 247, 0.8), 0 20px 40px -10px rgba(0, 0, 0, 0.2)',
        padding: `${SPACING.lg}px`,
      }}
      {...componentProps}
    >
      {/* Enhanced Background decoration */}
      <div
        className="absolute top-0 right-0 w-48 h-48 bg-purple-300/10 rounded-full blur-3xl -mr-24 -mt-24"
        style={{ backdropFilter: 'blur(40px)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-300/10 rounded-full blur-3xl -ml-20 -mb-20"
        style={{ backdropFilter: 'blur(40px)' }}
      />
      <div
        className="absolute top-1/2 right-1/4 w-32 h-32 bg-purple-200/5 rounded-full blur-2xl"
        style={{ backdropFilter: 'blur(30px)' }}
      />

      {/* Content */}
      <div className="relative z-10 space-y-6">
        <div>
          <p
            className="text-white/60 mb-2 uppercase tracking-wider"
            style={{ fontSize: '0.75rem', fontWeight: 600 }}
          >
            {title}
          </p>
          <div className="text-6xl font-bold text-white drop-shadow-lg">{amount}</div>
          {subtitle && (
            <p
              className="text-emerald-200 mt-2 font-semibold"
              style={{ fontSize: '0.875rem' }}
            >
              ↗ {subtitle}
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
    <Card animated={animated} variant="default" className={`bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-purple-300/50 dark:hover:border-purple-500/30 transition-all duration-300 ${className}`}>
      <div className="space-y-4">
        {icon && <div className="text-purple-600 dark:text-purple-400 opacity-80">{icon}</div>}
        <div>
          <p
            className="text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide"
            style={{ fontSize: '0.75rem', fontWeight: 600 }}
          >
            {label}
          </p>
          <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{value}</p>
        </div>
        {change && (
          <p
            className="text-emerald-600 dark:text-emerald-400 font-medium"
            style={{ fontSize: '0.875rem' }}
          >
            {change}
          </p>
        )}
      </div>
    </Card>
  );
}
