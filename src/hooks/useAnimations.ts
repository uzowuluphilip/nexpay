/**
 * Custom Hooks for Animations
 */

import React, { useEffect, useRef } from 'react';
import { DURATIONS } from '@/utils/design-constants';

/**
 * Hook to animate numbers counting from 0 to target value
 * Used for balance counters
 */
export function useCounterAnimation(
  targetValue: number,
  duration: number = DURATIONS.slow
): number {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentValue = startValue + (targetValue - startValue) * progress;
      setDisplayValue(Math.floor(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, duration]);

  return displayValue;
}

/**
 * Hook to detect if element is in viewport
 * Used for triggering animations on scroll
 */
export function useInViewAnimation(ref: React.RefObject<HTMLElement>, threshold = 0.1): boolean {
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref, threshold]);

  return isInView;
}

/**
 * Hook to manage loading state with delay
 * Prevents content flashing
 */
export function useLoadingState(isLoading: boolean, minDuration = 300): boolean {
  const [displayLoading, setDisplayLoading] = React.useState(isLoading);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    if (isLoading) {
      setDisplayLoading(true);
    } else {
      timerRef.current = setTimeout(() => {
        setDisplayLoading(false);
      }, minDuration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, minDuration]);

  return displayLoading;
}
