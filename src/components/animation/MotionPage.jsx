import { motion } from 'framer-motion';
import { pagePreset } from '../../animations';
import { useAppMotion } from '../../hooks/useAppMotion';

/**
 * Wrapper for page transitions.
 * Replaces existing PageTransition.jsx.
 */
const MotionPage = ({ children, className = '', ...props }) => {
  const { isReduced, getMotionProps } = useAppMotion();

  if (isReduced) {
    return (
      <main className={`motion-page ${className}`} style={{ flex: 1, minHeight: 0, width: '100%' }} {...props}>
        {children}
      </main>
    );
  }
  const motionProps = getMotionProps(pagePreset);

  return (
    <motion.main
      className={`motion-page ${className}`}
      style={{ flex: 1, minHeight: 0, width: '100%' }}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.main>
  );
};

export default MotionPage;
