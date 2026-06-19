/**
 * Skeleton Loading Components
 * Shows while data is being loaded
 */

import React from 'react';
import { motion } from 'framer-motion';
import { skeletonVariants } from '@/utils/animations';
import { SPACING, RADIUS } from '@/utils/design-constants';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
}

export function Skeleton({
  width = '100%',
  height = 20,
  className = '',
  variant = 'rect',
}: SkeletonProps) {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  const borderRadius =
    variant === 'circle' ? '9999px' : variant === 'text' ? '4px' : RADIUS.md;

  return (
    <motion.div
      variants={skeletonVariants}
      animate="animate"
      className={`bg-gray-200 dark:bg-gray-700 ${className}`}
      style={{
        width: widthStyle,
        height: heightStyle,
        borderRadius,
      }}
    />
  );
}

/**
 * Card Skeleton - mimics a data card
 */
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
      <Skeleton height={20} width="60%" />
      <Skeleton height={32} width="100%" />
      <Skeleton height={16} width="80%" />
    </div>
  );
}

/**
 * Balance Card Skeleton
 */
export function BalanceCardSkeleton() {
  return (
    <div
      className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl p-8"
      style={{
        boxShadow: '0 0 30px -10px rgba(139, 92, 246, 0.4)',
      }}
    >
      <div className="space-y-6">
        {/* Label */}
        <Skeleton height={14} width="40%" />
        
        {/* Main balance */}
        <div className="pt-2">
          <Skeleton height={48} width="60%" />
        </div>

        {/* Sub-balances grid */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="100%" />
        </div>
      </div>
    </div>
  );
}

/**
 * Chart Skeleton
 */
export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
      <div className="space-y-4">
        <Skeleton height={24} width="40%" />
        <div className="h-64 flex items-end gap-2">
          {Array(12)
            .fill(0)
            .map((_, i) => (
              <Skeleton
                key={i}
                width={`${Math.random() * 40 + 30}%`}
                height={`${Math.random() * 60 + 20}%`}
                variant="rect"
              />
            ))}
        </div>
      </div>
    </div>
  );
}

/**
 * List Skeleton - multiple items
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <CardSkeleton key={i} />
        ))}
    </div>
  );
}

/**
 * Dashboard Grid Skeleton - matches dashboard layout
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton height={32} width="40%" />
        <Skeleton height={16} width="20%" />
      </div>

      {/* Balance Card */}
      <BalanceCardSkeleton />

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Chart */}
      <ChartSkeleton />

      {/* Transactions */}
      <div>
        <Skeleton height={24} width="30%" className="mb-4" />
        <ListSkeleton count={4} />
      </div>
    </div>
  );
}
