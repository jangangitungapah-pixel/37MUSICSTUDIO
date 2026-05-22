import { motion } from 'framer-motion';
import { listPreset } from '../../animations';
import { useAppMotion } from '../../hooks/useAppMotion';

/**
 * Container for staggered list animations.
 * Children must be MotionListItem or use listItemVariants.
 */
export const MotionList = ({ 
  children, 
  className = '', 
  delay = 0,
  as = 'ul',
  ...props 
}) => {
  const { getMotionProps } = useAppMotion();

  const baseProps = {
    ...listPreset,
    transition: { ...listPreset.transition, delayChildren: delay }
  };

  const motionProps = getMotionProps(baseProps);
  const Component = motion[as] || motion.ul;

  return (
    <Component
      className={`motion-list ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};
