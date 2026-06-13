import React from 'react';
import ReactDOM from 'react-dom';
import AnimatedModal from './AnimatedModal';

export default function Modal({ isOpen, onClose, title, children, width = '520px', footer }) {
  // If we're rendering through portal, we just wrap AnimatedModal in a container.
  // Actually, AnimatePresence needs to be rendered, so we just return AnimatedModal,
  // but AnimatedModal expects `show` instead of `isOpen`. We can map it.
  
  const modalContent = (
    <AnimatedModal
      show={isOpen}
      onClose={onClose}
      title={title}
      width={width}
      accentColor="var(--accent)"
    >
      <div className="modal-body">
        {children}
      </div>
      {footer && (
        <div style={{ 
          marginTop: '24px', paddingTop: '20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: '12px', justifyContent: 'flex-end' 
        }}>
          {footer}
        </div>
      )}
    </AnimatedModal>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
