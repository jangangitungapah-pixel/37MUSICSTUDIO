import { motion } from 'framer-motion';
import { sectionPreset, defaultTransition, fadeUp, fadeDown, fadeLeft, fadeRight, fadeIn } from '../../animations';
import { useAppMotion } from '../../hooks/useAppMotion';

/**
 * Wrapper for sections that reveal on scroll.
 */
const MotionSection = ({ 
  children, 
  className = '', 
  direction = 'up', // up, down, left, right, fade
  delay = 0,
  once = true,
  amount = 0.2,
  ...props 
}) => {
  const { getMotionProps } = useAppMotion();

  let variants;
  switch (direction) {
    case 'down': variants = fadeDown; break;
    case 'left': variants = fadeLeft; break;
    case 'right': variants = fadeRight; break;
    case 'fade': variants = fadeIn; break;
    case 'up':
    default:
      variants = fadeUp; break;
  }

  const baseProps = {
    ...sectionPreset,
    variants,
    viewport: { once, amount },
    transition: { ...defaultTransition, delay }
  };

  const motionProps = getMotionProps(baseProps);

  return (
    <motion.section
      className={`motion-section ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.section>
  );
};

export default MotionSection;
