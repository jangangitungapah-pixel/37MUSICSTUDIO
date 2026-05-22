/**
 * Reusable hover and tap state animations.
 * Subtle, smooth, premium interactions.
 */

export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.2, ease: 'easeOut' }
};

export const buttonTap = {
  scale: 0.96,
  transition: { duration: 0.1 }
};

export const cardHover = {
  y: -4,
  boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const cardTap = {
  scale: 0.98,
  y: 0,
  transition: { duration: 0.1 }
};

export const iconHover = {
  scale: 1.1,
  rotate: 5,
  transition: { type: 'spring', stiffness: 400, damping: 10 }
};

export const navItemHover = {
  backgroundColor: 'rgba(255, 42, 95, 0.05)',
  x: 4,
  transition: { duration: 0.2 }
};

export const imageHover = {
  scale: 1.05,
  transition: { duration: 0.4, ease: 'easeOut' }
};

export const glassCardHover = {
  y: -2,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderColor: 'rgba(255, 42, 95, 0.2)',
  transition: { duration: 0.3 }
};

export const floatingHover = {
  y: -6,
  transition: { y: { duration: 1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } }
};

export const subtleLiftHover = {
  y: -2,
  transition: { duration: 0.2 }
};

export const magneticHover = {
  scale: 1.05,
  transition: { type: 'spring', stiffness: 300, damping: 15 }
};

export const glowHover = {
  boxShadow: '0 0 15px rgba(255, 42, 95, 0.4)',
  transition: { duration: 0.3 }
};

export const dangerHover = {
  backgroundColor: 'rgba(255, 50, 50, 0.1)',
  color: '#ff3232',
  transition: { duration: 0.2 }
};

export const successHover = {
  backgroundColor: 'rgba(50, 255, 100, 0.1)',
  color: '#32ff64',
  transition: { duration: 0.2 }
};

export const inputFocusMotion = {
  scale: 1.01,
  boxShadow: '0 0 0 3px rgba(255, 42, 95, 0.15)',
  transition: { duration: 0.2 }
};

export const clickableTap = {
  scale: 0.95,
  opacity: 0.8,
  transition: { duration: 0.1 }
};
