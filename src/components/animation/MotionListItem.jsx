import { motion } from 'framer-motion';
import { listItemVariants } from '../../animations';
import { useAppMotion } from '../../hooks/useAppMotion';

/**
 * Individual item inside a MotionList.
 */
export const MotionListItem = ({ 
  children, 
  className = '', 
  as = 'li',
  ...props 
}) => {
  const { isReduced, getMotionProps } = useAppMotion();

  if (isReduced) {
    const Component = as;
    return (
      <Component className={`motion-list-item ${className}`} {...props}>
        {children}
      </Component>
    );
  }

  const motionProps = getMotionProps({ variants: listItemVariants });
  const Component = motion[as] || motion.li;

  return (
    <Component
      className={`motion-list-item ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};
