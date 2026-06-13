import React from 'react';

export const SkeletonKPI = () => (
  <div style={{
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    height: '110px'
  }}>
    <div className="animate-shimmer" style={{ height: '10px', width: '50%', marginBottom: '14px', borderRadius: '4px' }}></div>
    <div className="animate-shimmer" style={{ height: '24px', width: '70%', marginBottom: '8px', borderRadius: '4px' }}></div>
    <div className="animate-shimmer" style={{ height: '10px', width: '40%', borderRadius: '4px' }}></div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div style={{
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '20px'
  }}>
    {/* Header line */}
    <div className="animate-shimmer" style={{ height: '16px', width: '100%', marginBottom: '24px', borderRadius: '4px' }}></div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="animate-shimmer" style={{ height: '12px', width: '25%', borderRadius: '4px' }}></div>
        <div className="animate-shimmer" style={{ height: '12px', width: '25%', borderRadius: '4px' }}></div>
        <div className="animate-shimmer" style={{ height: '12px', width: '25%', borderRadius: '4px' }}></div>
        <div className="animate-shimmer" style={{ height: '12px', width: '25%', borderRadius: '4px' }}></div>
      </div>
    ))}
  </div>
);

export const SkeletonChart = ({ height = 240 }) => (
  <div style={{
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '20px'
  }}>
    <div className="animate-shimmer" style={{ height: '14px', width: '30%', marginBottom: '24px', borderRadius: '4px' }}></div>
    <div className="animate-shimmer" style={{ height: `${height}px`, width: '100%', borderRadius: '4px' }}></div>
  </div>
);

// Keep default export for backwards compatibility if needed
export default function SkeletonCard() {
  return <SkeletonKPI />;
}
