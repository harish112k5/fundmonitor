import React from 'react';

// Construction-themed badge — angular, no pill shape
export function AnimatedBadge({ status, color = '#F59E0B' }) {
  const bgColor = color + '26'; // ~15% opacity
  const borderColor = color + '4D'; // ~30% opacity

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontFamily: "'Inter', sans-serif",
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: color,
      background: bgColor,
      border: `1px solid ${borderColor}`,
      whiteSpace: 'nowrap'
    }}>
      {status}
    </span>
  );
}
