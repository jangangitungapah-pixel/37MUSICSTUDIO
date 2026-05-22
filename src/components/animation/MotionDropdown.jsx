import { motion, AnimatePresence } from 'framer-motion';
import { dropdownPreset } from '../../animations';
import { useAppMotion } from '../../hooks/useAppMotion';

/**
 * Animated Dropdown/Menu Container
 */
const MotionDropdown = ({ 
  isOpen, 
  children, 
  className = '',
  ...props 
}) => {
  const { getMotionProps } = useAppMotion();
  const motionProps = getMotionProps(dropdownPreset);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`motion-dropdown ${className}`}
          style={{ position: 'absolute', zIndex: 50 }}
          {...motionProps}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MotionDropdown;
