import { useReducedMotion } from 'framer-motion';

/**
 * Hook to handle accessibility preferences around animations.
 * If user prefers reduced motion, this helps dial back or disable animations.
 */
export const useAppMotion = () => {
  const prefersReducedMotion = useReducedMotion();

  /**
   * Helper to merge/override motion props when reduced motion is enabled.
   * If reduced motion is true, it falls back to simple opacity transitions
   * instead of heavy transforms or physics springs.
   * 
   * @param {Object} normalProps - The standard animation props (variants, transition, etc.)
   * @param {Object} reducedProps - Optional overrides when reduced motion is active
   */
  const getMotionProps = (normalProps, reducedProps = null) => {
    if (!prefersReducedMotion) {
      return normalProps;
    }

    // Default simplified motion: just opacity fade
    const defaultReduced = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.1 },
      whileHover: {},
      whileTap: {},
    };

    return { ...defaultReduced, ...reducedProps };
  };

  return {
    isReduced: prefersReducedMotion,
    getMotionProps,
  };
};

export default useAppMotion;
