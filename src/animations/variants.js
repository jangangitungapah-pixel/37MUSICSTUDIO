/**
 * Pre-defined complex animation variants.
 * Include hidden, visible, and exit states.
 */

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

export const fadeOut = {
  hidden: { opacity: 1 },
  visible: { opacity: 0 },
  exit: { opacity: 0 }
};

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
};

export const fadeLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

export const fadeRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

export const scaleOut = {
  hidden: { opacity: 1, scale: 1 },
  visible: { opacity: 0, scale: 1.05 },
  exit: { opacity: 0, scale: 1.05 }
};

// Use blur sparingly for performance
export const blurIn = {
  hidden: { opacity: 0, filter: 'blur(10px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(10px)' }
};

export const blurUp = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(4px)' }
};

export const zoomIn = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

export const rotateIn = {
  hidden: { opacity: 0, rotate: -10, scale: 0.95 },
  visible: { opacity: 1, rotate: 0, scale: 1 },
  exit: { opacity: 0, rotate: 10, scale: 0.95 }
};

export const slideInLeft = {
  hidden: { x: '-100%' },
  visible: { x: 0 },
  exit: { x: '-100%' }
};

export const slideInRight = {
  hidden: { x: '100%' },
  visible: { x: 0 },
  exit: { x: '100%' }
};

export const slideInTop = {
  hidden: { y: '-100%' },
  visible: { y: 0 },
  exit: { y: '-100%' }
};

export const slideInBottom = {
  hidden: { y: '100%' },
  visible: { y: 0 },
  exit: { y: '100%' }
};

// Page and Layout Variants
export const pageVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 20 }
};

export const drawerLeftVariants = slideInLeft;
export const drawerRightVariants = slideInRight;

export const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -5, transformOrigin: 'top' },
  visible: { opacity: 1, scale: 1, y: 0, transformOrigin: 'top' },
  exit: { opacity: 0, scale: 0.95, y: -5, transformOrigin: 'top' }
};

export const tooltipVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 5 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 5 }
};

export const toastVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

export const overlayVariants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: { opacity: 1, backdropFilter: 'blur(12px)' },
  exit: { opacity: 0, backdropFilter: 'blur(0px)' }
};

// Stagger Variants (for list containers and items)
export const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  exit: { opacity: 0 }
};

export const listItemVariants = fadeUp;

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Specific UI Component Variants
export const heroTitleVariants = blurUp;
export const heroSubtitleVariants = fadeUp;
export const heroImageVariants = scaleIn;
export const cardRevealVariants = fadeUp;
export const tableRowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 }
};
export const sidebarContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } }
};
export const sidebarItemVariants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } }
};
export const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 }
};
export const bottomSheetVariants = {
  hidden: { y: '100%' },
  visible: { y: 0 },
  exit: { y: '100%' }
};
