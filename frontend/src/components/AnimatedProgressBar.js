import React, { useEffect, useState } from 'react';

// Construction theme progress bar
export function AnimatedProgressBar({ progress, color = '#F59E0B', label, showValue = true }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Small delay to allow the animation to trigger after page load
    const timer = setTimeout(() => {
      setWidth(progress);
    }, 300);
    return () => clearTimeout(timer);
  }, [progress]);

  const p = Math.min(100, Math.max(0, progress));

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {(label || showValue) && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '11px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: '600',
          color: '#A8A29E',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <span>{label}</span>
          {showValue && <span style={{ color: 'var(--text-primary)' }}>{p}%</span>}
        </div>
      )}
      
      <div style={{ 
        width: '100%', 
        height: '6px', 
        backgroundColor: 'var(--border-subtle)', 
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${width}%`,
          backgroundColor: color,
          borderRadius: '3px',
          transition: 'width 1s ease-out'
        }} />
      </div>
    </div>
  );
}
