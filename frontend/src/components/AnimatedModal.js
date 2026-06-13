import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedModal = ({
  show,
  onClose,
  title,
  children,
  width = '520px',
  accentColor = 'var(--accent)'
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-modal)',
              border: '1px solid var(--border-accent)',
              borderTop: `3px solid ${accentColor}`,
              borderRadius: 'var(--radius-xl)',
              padding: '28px',
              width: width,
              maxWidth: '92vw',
              maxHeight: '88vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg), var(--glow-amber)',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border)'
            }}>
              <h2 className="text-gradient" style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '20px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '3px',
                  height: '20px',
                  backgroundColor: accentColor,
                  borderRadius: '2px'
                }}></span>
                {title}
              </h2>

              {/* Close button */}
              <motion.button
                whileHover={{ rotate: 90 }}
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: 0
                }}
              >
                &times;
              </motion.button>
            </div>

            {/* Body */}
            <div>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedModal;
