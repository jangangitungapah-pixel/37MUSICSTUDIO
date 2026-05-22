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

/**
 * Pre-packaged combinations of variants, transitions, and hover states.
 * Ready to drop into `motion` components.
 */

export const pagePreset = {
  variants: pageVariants,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: pageTransition,
};

export const sectionPreset = {
  variants: fadeUp,
  initial: 'hidden',
  whileInView: 'visible',
  viewport: onceViewport,
  transition: defaultTransition,
};

export const cardPreset = {
  variants: fadeUp,
  transition: cardTransition,
  whileHover: cardHover,
  whileTap: cardTap,
};

export const buttonPreset = {
  whileHover: buttonHover,
  whileTap: buttonTap,
  transition: springTransition,
};

export const modalPreset = {
  variants: modalVariants,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: modalTransition,
};

export const dropdownPreset = {
  variants: dropdownVariants,
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit',
  transition: modalTransition,
};

export const listPreset = {
  variants: listContainerVariants,
  initial: 'hidden',
  whileInView: 'visible',
  viewport: onceViewport,
};

export const heroPreset = {
  variants: blurUp,
  initial: 'hidden',
  animate: 'visible',
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

export const dashboardWidgetPreset = {
  variants: scaleIn,
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, amount: 0.1 },
  transition: springTransition,
};

export const formFieldPreset = {
  variants: fadeUp,
  transition: defaultTransition,
};

export const tableRowPreset = {
  variants: fadeUp,
  transition: defaultTransition,
};
