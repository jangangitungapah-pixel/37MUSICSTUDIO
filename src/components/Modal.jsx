import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="modal-overlay"
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </Dialog.Overlay>
            
            <div className="modal-wrapper" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 1001 }}>
              <Dialog.Content asChild>
                <motion.div
                  className={`modal-content glass-panel ${className}`}
                  style={{ pointerEvents: 'auto' }}
                  initial={{ opacity: 0, scale: window.innerWidth <= 768 ? 1 : 0.95, y: window.innerWidth <= 768 ? "100%" : 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: window.innerWidth <= 768 ? 1 : 0.95, y: window.innerWidth <= 768 ? "100%" : 10 }}
                  transition={{ duration: 0.35, type: 'spring', bounce: 0.2 }}
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
