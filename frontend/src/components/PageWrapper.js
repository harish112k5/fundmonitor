import React from 'react';

// Simple CSS-only page wrapper with page-enter animation
export function PageWrapper({ children, style }) {
  return (
    <div className="page-enter" style={style}>
      {children}
    </div>
  );
}

// Simple animated item — just a div with optional delay
export function AnimatedItem({ children, delay = 0, style }) {
  return (
    <div style={{ 
      animation: `pageEnter 0.35s ease ${delay}s both`,
      ...style 
    }}>
      {children}
    </div>
  );
}
