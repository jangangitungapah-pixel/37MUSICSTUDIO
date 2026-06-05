import { 
  pageVariants, fadeUp, blurUp, scaleIn, 
  modalVariants, dropdownVariants, listContainerVariants 
} from './variants';
import { 
  pageTransition, defaultTransition, modalTransition, 
  cardTransition, springTransition 
} from './transitions';
import { onceViewport } from './viewport';
import { buttonHover, buttonTap, cardHover, cardTap } from './hover';

// Check if device is mobile/tablet to reduce motion globally
const isMobileDevice = typeof window !== 'undefined' && (
  window.innerWidth <= 1024 || 
  'ontouchstart' in window || 
  navigator.maxTouchPoints > 0
);

/**
 * Pre-packaged combinations of variants, transitions, and hover states.
 * Ready to drop into `motion` components.
 * Globally optimized on mobile to reduce CPU/GPU overhead to the absolute minimum.
 */

export const pagePreset = isMobileDevice ? {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
  transition: { duration: 0.01 }
} : {
  variants: pageVariants,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: pageTransition,
};

export const sectionPreset = isMobileDevice ? {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  transition: { duration: 0.01 }
} : {
  variants: fadeUp,
  initial: 'hidden',
  whileInView: 'visible',
  viewport: onceViewport,
  transition: defaultTransition,
};

export const cardPreset = isMobileDevice ? {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  whileHover: {},
  whileTap: {},
  transition: { duration: 0.01 }
} : {
  variants: fadeUp,
  transition: cardTransition,
  whileHover: cardHover,
  whileTap: cardTap,
};

export const buttonPreset = isMobileDevice ? {
  whileHover: {},
  whileTap: { scale: 0.98 },
  transition: { duration: 0.05 }
} : {
  whileHover: buttonHover,
  whileTap: buttonTap,
  transition: springTransition,
};

export const modalPreset = isMobileDevice ? {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 30 },
  transition: { duration: 0.15, ease: 'easeOut' }
} : {
  variants: modalVariants,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: modalTransition,
};

export const dropdownPreset = isMobileDevice ? {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.12 }
} : {
  variants: dropdownVariants,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: modalTransition,
};

export const listPreset = isMobileDevice ? {
  initial: { opacity: 1 },
  animate: { opacity: 1 }
} : {
  variants: listContainerVariants,
  initial: 'hidden',
  whileInView: 'visible',
  viewport: onceViewport,
};

export const heroPreset = isMobileDevice ? {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  transition: { duration: 0.01 }
} : {
  variants: blurUp,
  initial: 'hidden',
  animate: 'visible',
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

export const dashboardWidgetPreset = isMobileDevice ? {
  initial: { opacity: 1 },
  animate: { opacity: 1 }
} : {
  variants: scaleIn,
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, amount: 0.1 },
  transition: springTransition,
};

export const formFieldPreset = isMobileDevice ? {
  initial: { opacity: 1 },
  animate: { opacity: 1 }
} : {
  variants: fadeUp,
  transition: defaultTransition,
};

export const tableRowPreset = isMobileDevice ? {
  initial: { opacity: 1 },
  animate: { opacity: 1 }
} : {
  variants: fadeUp,
  transition: defaultTransition,
};
