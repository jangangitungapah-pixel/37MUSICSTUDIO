import { motion } from 'framer-motion';
import { cardPreset, cardHover, cardTap } from '../../animations';
import { useAppMotion } from '../../hooks/useAppMotion';

/**
 * Reusable card with entrance and optional interactive hover/tap states.
 */
const MotionCard = ({ 
  children, 
  className = '', 
  interactive = false,
  delay = 0,
  ...props 
}) => {
  const { isReduced, getMotionProps } = useAppMotion();

  if (isReduced) {
    return (
      <div className={`motion-card ${className}`} {...props}>
        {children}
      </div>
    );
  }

  const baseProps = {
    ...cardPreset,
    transition: { ...cardPreset.transition, delay },
    whileHover: interactive ? cardHover : undefined,
    whileTap: interactive ? cardTap : undefined,
  };

  const motionProps = getMotionProps(baseProps);

  return (
    <motion.div
      className={`motion-card ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default MotionCard;
