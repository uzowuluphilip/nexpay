/**
 * AnimatedNumber Component
 * Displays numbers with counting animation
 */

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { numberVariants } from '@/utils/animations';
import { useInViewAnimation } from '@/hooks/useAnimations';

interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  format = (v) => v.toFixed(2),
  duration = 1000,
  className = '',
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInViewAnimation(ref);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const startValue = 0;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use easing function for smoother animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (value - startValue) * easeOutCubic;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration, isInView]);

  return (
    <motion.div
      ref={ref}
      variants={numberVariants}
      initial="initial"
      animate={isInView ? 'animate' : 'initial'}
      className={className}
    >
      {prefix}
      {format(displayValue)}
      {suffix}
    </motion.div>
  );
}

export default AnimatedNumber;
