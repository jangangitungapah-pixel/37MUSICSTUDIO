import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { modalPreset, overlayVariants } from '../animations';
import { useAppMotion } from '../hooks/useAppMotion';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, className = '', preset = modalPreset }) => {
  const { getMotionProps } = useAppMotion();
  const overlayProps = getMotionProps({ variants: overlayVariants, initial: 'hidden', animate: 'visible', exit: 'exit' });
  const contentProps = getMotionProps(preset);
  const wrapperClassName = className
    ? className
      .split(/\s+/)
      .filter(Boolean)
      .map((name) => `${name}-wrapper`)
      .join(' ')
    : '';

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="modal-overlay"
                {...overlayProps}
              />
            </Dialog.Overlay>
            
            <div className={`modal-wrapper ${wrapperClassName}`.trim()} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 1001 }}>
              <Dialog.Content asChild>
                <motion.div
                  className={`modal-content glass-panel ${className}`}
                  style={{ pointerEvents: 'auto' }}
                  {...contentProps}
                >
                  {title ? (
                    <div className="modal-header">
                      <Dialog.Title className="modal-title">{title}</Dialog.Title>
                      <Dialog.Close asChild>
                        <button className="icon-btn close-btn">
                          <X size={20} />
                        </button>
                      </Dialog.Close>
                    </div>
                  ) : (
                    <Dialog.Close asChild>
                      <button className="icon-btn close-btn modal-close-floating" title="Tutup">
                        <X size={20} />
                      </button>
                    </Dialog.Close>
                  )}
                  
                  <div className="modal-body">
                    {children}
                  </div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default Modal;
