import { motion, AnimatePresence } from 'framer-motion';
import { modalPreset, overlayVariants } from '../../animations';
import { useAppMotion } from '../../hooks/useAppMotion';
import { useEffect, useMemo } from 'react';

/**
 * Animated Modal Wrapper.
 * Note: If using Radix UI or existing modal system,
 * you can extract the animation internals from here.
 */
const MotionModal = ({
  isOpen,
  onClose,
  children,
  className = '',
  hideOverlay = false
}) => {
  const { getMotionProps } = useAppMotion();
  const modalMotionProps = getMotionProps(modalPreset);
  const overlayMotionProps = useMemo(
    () => getMotionProps({ variants: overlayVariants, initial: 'hidden', animate: 'visible', exit: 'exit' }),
    [getMotionProps]
  );

  // Optional: Escape key handling (usually handled by existing modal tools like Radix)
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="motion-modal-portal" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!hideOverlay && (
            <motion.div
              className="motion-modal-overlay"
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
              onClick={onClose}
              {...overlayMotionProps}
            />
          )}
          <motion.div
            className={`motion-modal-content ${className}`}
            style={{ position: 'relative', zIndex: 1001 }}
            {...modalMotionProps}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MotionModal;
