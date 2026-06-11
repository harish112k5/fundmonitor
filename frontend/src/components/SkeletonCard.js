import React from 'react';

// Skeleton loading for KPI cards
export function SkeletonKPI() {
  return (
    <div style={{
      background: '#1E1E1E',
      border: '1px solid #2D2D2D',
      borderRadius: '8px',
      padding: '18px 20px',
      minHeight: '100px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top accent line skeleton */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#2D2D2D' }} />
      <div style={{ width: '50%', height: '10px', background: '#2D2D2D', borderRadius: '2px', marginBottom: '12px', animation: 'sitePulse 1.5s ease-in-out infinite' }} />
      <div style={{ width: '35%', height: '24px', background: '#2D2D2D', borderRadius: '2px', marginBottom: '8px', animation: 'sitePulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }} />
      <div style={{ width: '60%', height: '10px', background: '#2D2D2D', borderRadius: '2px', animation: 'sitePulse 1.5s ease-in-out infinite', animationDelay: '0.4s' }} />
    </div>
  );
}

// Skeleton loading for table rows
export function SkeletonTable({ rows = 3 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          padding: '12px 14px',
          background: '#262626',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <div style={{ width: '40%', height: '14px', background: '#2D2D2D', borderRadius: '2px', animation: 'sitePulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: '20%', height: '14px', background: '#2D2D2D', borderRadius: '2px', animation: 'sitePulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }} />
        </div>
      ))}
    </>
  );
}
