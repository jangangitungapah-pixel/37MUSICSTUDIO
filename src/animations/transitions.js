import { easings } from './easings';

/**
 * Reusable transition configurations.
 * Combining duration, easing, and spring physics.
 */

export const defaultTransition = {
  duration: 0.3,
  ease: easings.smooth,
};

export const fastTransition = {
  duration: 0.15,
  ease: easings.expoOut,
};

export const slowTransition = {
  duration: 0.6,
  ease: easings.elegant,
};

export const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 24,
  mass: 1,
};

export const softSpringTransition = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
  mass: 0.8,
};

// Page transitions usually need to be smooth and slightly longer
export const pageTransition = {
  duration: 0.4,
  ease: easings.smooth,
};

// Modals should feel poppy but not aggressive
export const modalTransition = {
  type: 'spring',
  stiffness: 260,
  damping: 25,
};

export const drawerTransition = {
  type: 'spring',
  stiffness: 200,
  damping: 24,
};

// Cards revealing can be a bit slower for effect
export const cardTransition = {
  duration: 0.5,
  ease: easings.smooth,
};

export const buttonTransition = {
  duration: 0.2,
  ease: easings.expoOut,
};

export const listTransition = {
  duration: 0.3,
  ease: easings.smooth,
};

export const microInteractionTransition = {
  duration: 0.15,
  ease: easings.smooth,
};
