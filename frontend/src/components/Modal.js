import React from 'react';
import ReactDOM from 'react-dom';

export default function Modal({ isOpen, onClose, title, children, width = '520px', footer }) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderTop: '3px solid #F59E0B',
          borderRadius: '8px',
          padding: '28px',
          width,
          maxWidth: '92vw',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          animation: 'slideUp 0.25s ease'
        }}
      >
        {/* Modal header */}
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          paddingBottom: '12px', marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontFamily: "'Oswald', sans-serif",
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {/* Amber accent bar */}
            <span style={{
              display: 'inline-block',
              width: '3px',
              height: '20px',
              background: '#F59E0B',
              borderRadius: '2px',
              flexShrink: 0
            }} />
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '6px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)', fontSize: '18px',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.borderColor = 'var(--border-medium)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div style={{ 
            marginTop: '20px', paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex', gap: '10px', justifyContent: 'flex-end' 
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
