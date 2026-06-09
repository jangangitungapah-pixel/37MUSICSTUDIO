import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';

const checkIsMobileViewport = () => {
  if (typeof window === 'undefined') return false;
  const matchesWidth = window.innerWidth <= 1024;
  const matchesTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return matchesWidth || (matchesTouch && matchesWidth);
};

/**
 * Hook to handle accessibility preferences and performance adjustments around animations.
 * If user prefers reduced motion, or if the device is a mobile/tablet screen,
 * this helps dial back or disable expensive animations.
 */
export const useAppMotion = () => {
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(checkIsMobileViewport);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let frameId = null;
    const handleResize = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        setIsMobile((previous) => {
          const next = checkIsMobileViewport();
          return previous === next ? previous : next;
        });
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const shouldReduce = prefersReducedMotion || isMobile;

  /**
   * Helper to merge/override motion props when reduced motion or mobile viewport is active.
   * Falls back to simple opacity transitions instead of heavy transforms or physics springs.
   *
   * @param {Object} normalProps - The standard animation props (variants, transition, etc.)
   * @param {Object} reducedProps - Optional overrides when reduced motion is active
   */
  const getMotionProps = useCallback((normalProps, reducedProps = null) => {
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
  }, [shouldReduce]);

  return useMemo(() => ({
    isReduced: shouldReduce,
    getMotionProps,
  }), [getMotionProps, shouldReduce]);
};

export default useAppMotion;
