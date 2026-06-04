import { motion } from 'framer-motion';
import { fadeUp, fadeDown, fadeLeft, fadeRight, scaleIn, blurUp, defaultTransition } from '../../animations';
import { useAppMotion } from '../../hooks/useAppMotion';

/**
 * General purpose reveal wrapper for any content.
 */
const MotionReveal = ({ 
  children, 
  className = '', 
  type = 'fadeUp', // fadeUp, fadeDown, fadeLeft, fadeRight, scale, blur
  delay = 0,
  duration,
  once = true,
  amount = 0.2,
  as = 'div',
  ...props 
}) => {
  const { isReduced, getMotionProps } = useAppMotion();

  if (isReduced) {
    const Component = as;
    return (
      <Component className={`motion-reveal ${className}`} {...props}>
        {children}
      </Component>
    );
  }

  let variants;
  switch (type) {
    case 'fadeDown': variants = fadeDown; break;
    case 'fadeLeft': variants = fadeLeft; break;
    case 'fadeRight': variants = fadeRight; break;
    case 'scale': variants = scaleIn; break;
    case 'blur': variants = blurUp; break;
    case 'fadeUp':
    default:
      variants = fadeUp; break;
  }

  const customTransition = { ...defaultTransition, delay };
  if (duration !== undefined) {
    customTransition.duration = duration;
  }

  const baseProps = {
    variants,
    initial: 'hidden',
    whileInView: 'visible',
    viewport: { once, amount },
    transition: customTransition
  };

  const motionProps = getMotionProps(baseProps);
  const Component = motion[as] || motion.div;

  return (
    <Component
      className={`motion-reveal ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default MotionReveal;
