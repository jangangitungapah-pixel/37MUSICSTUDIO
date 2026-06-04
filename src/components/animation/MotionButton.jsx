import { motion } from 'framer-motion';
import { buttonPreset } from '../../animations';
import { useAppMotion } from '../../hooks/useAppMotion';

/**
 * Reusable animated button.
 */
const MotionButton = ({ 
  children, 
  className = '', 
  onClick,
  disabled = false,
  type = 'button',
  ...props 
}) => {
  const { isReduced, getMotionProps } = useAppMotion();

  if (isReduced) {
    return (
      <button type={type} className={`motion-button ${className}`} onClick={onClick} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }

  const baseProps = {
    ...buttonPreset,
    // Add focus ring animation integration if desired,
    // though native outline is often better for a11y.
  };

  const motionProps = getMotionProps(baseProps);

  return (
    <motion.button
      type={type}
      className={`motion-button ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default MotionButton;
