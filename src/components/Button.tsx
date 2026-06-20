/**
 * Premium Button Component
 * Consistent styling, animations, and sizing
 */

import React from 'react';
import { motion } from 'framer-motion';
import { SPACING, RADIUS, ICON_SIZE } from '@/utils/design-constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  animated?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  loading = false,
  fullWidth = false,
  animated = true,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // Size styles
  const sizeClasses = {
    sm: `px-${SPACING.md} py-${SPACING.sm}`,
    md: `px-${SPACING.base} py-${SPACING.md}`,
    lg: `px-${SPACING.lg} py-${SPACING.base}`,
  };

  const sizeInline = {
    sm: `padding: ${SPACING.md}px ${SPACING.md}px`,
    md: `padding: ${SPACING.md}px ${SPACING.base}px`,
    lg: `padding: ${SPACING.base}px ${SPACING.lg}px`,
  };

  // Variant styles - Enhanced with gradients and better effects
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl',
    secondary:
      'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 text-gray-900 dark:text-white font-semibold',
    outline:
      'border-2 border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 font-semibold backdrop-blur-sm',
    ghost:
      'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium',
  };

  const Component = animated ? motion.button : 'button';

  const animationProps = animated
    ? {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.15 },
      }
    : {};

  return (
    <Component
      {...(animationProps as any)}
      style={{
        ...Object.fromEntries(
          Object.entries(sizeInline).map(([key, val]) => [key, val])
        ),
        borderRadius: `${RADIUS.md}px`,
        fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        width: fullWidth ? '100%' : 'auto',
        display: fullWidth ? 'flex' : 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${SPACING.sm}px`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
      className={`${variantClasses[variant]} ${className} transition-all duration-200`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: size === 'sm' ? '16px' : size === 'lg' ? '24px' : '20px',
              height: size === 'sm' ? '16px' : size === 'lg' ? '24px' : '20px',
              borderRadius: '50%',
              borderWidth: '2px',
              borderColor: 'currentColor',
              borderTopColor: 'transparent',
            }}
          />
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </span>
          )}
        </>
      )}
    </Component>
  );
}

export default Button;
