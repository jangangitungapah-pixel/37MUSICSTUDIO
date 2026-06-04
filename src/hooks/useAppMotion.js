import { useReducedMotion } from 'framer-motion';
import { useState, useEffect } from 'react';

/**
 * Hook to handle accessibility preferences and performance adjustments around animations.
 * If user prefers reduced motion, or if the device is a mobile/tablet screen,
 * this helps dial back or disable expensive animations.
 */
export const useAppMotion = () => {
  const prefersReducedMotion = useReducedMotion();

  const checkIsMobile = () => {
    if (typeof window === 'undefined') return false;
    // Screens <= 1024px (covers mobile phones and tablets in portrait/landscape)
    // or devices that support touch and are <= 1024px wide
    const matchesWidth = window.innerWidth <= 1024;
    const matchesTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return matchesWidth || (matchesTouch && matchesWidth);
  };

  const [isMobile, setIsMobile] = useState(checkIsMobile);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shouldReduce = prefersReducedMotion || isMobile;

  /**
   * Helper to merge/override motion props when reduced motion or mobile viewport is active.
   * Falls back to simple opacity transitions instead of heavy transforms or physics springs.
   * 
   * @param {Object} normalProps - The standard animation props (variants, transition, etc.)
   * @param {Object} reducedProps - Optional overrides when reduced motion is active
   */
  const getMotionProps = (normalProps, reducedProps = null) => {
    if (!shouldReduce) {
      return normalProps;
    }

    // Default simplified motion: just opacity fade
    const defaultReduced = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.15 },
      whileHover: {},
      whileTap: {},
    };

    const merged = { ...defaultReduced, ...reducedProps };

    // Remove viewport and scroll-triggered animations to completely bypass scroll event listeners
    delete merged.viewport;
    delete merged.whileInView;

    return merged;
  };

  return {
    isReduced: shouldReduce,
    getMotionProps,
  };
};

export default useAppMotion;
