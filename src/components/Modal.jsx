import React from 'react';
import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content glass-panel ${className}`} onClick={e => e.stopPropagation()}>
        {/* Only show header when title is non-empty */}
        {title ? (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button className="icon-btn close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        ) : (
          <button className="icon-btn close-btn modal-close-floating" onClick={onClose} title="Tutup">
            <X size={20} />
          </button>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
