import React from 'react';
import CountUp from 'react-countup';

export default function AnimatedKPICard({ 
  label, 
  value, 
  subtitle, 
  icon, 
  color = '#F59E0B', 
  onClick, 
  isMoney = false,
  prefix = '',
  index = 0
}) {
  const isNumeric = typeof value === 'number' || !isNaN(Number(value));
  const numericValue = isNumeric ? Number(value) : 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '18px 20px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        minHeight: '100px',
        transition: 'all 0.25s ease',
        animation: `pageEnter 0.35s ease ${index * 0.05}s both`,
        /* Blueprint grid */
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.02) 19px, rgba(255,255,255,0.02) 20px),
          repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.02) 19px, rgba(255,255,255,0.02) 20px)
        `,
        backgroundColor: 'var(--bg-card)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: color
      }} />

      {/* Icon in top-right */}
      {icon && (
        <div style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          fontSize: '24px',
          color: `${color}4D`, // ~30% opacity
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
      )}

      {/* Label */}
      <div style={{
        fontSize: '10px',
        fontFamily: "'Inter', sans-serif",
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        color: 'var(--text-muted)',
        marginBottom: '10px'
      }}>
        {label}
      </div>

      {/* Value */}
      <div style={{
        fontFamily: "'Oswald', sans-serif",
        fontSize: '28px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        lineHeight: '1'
      }}>
        {isNumeric && isMoney ? (
          <>
            {prefix}{prefix === '-' ? '' : ''}₹<CountUp end={numericValue} duration={1.5} separator="," />
          </>
        ) : isNumeric ? (
          <>
            {prefix}<CountUp end={numericValue} duration={1.5} separator="," />
          </>
        ) : (
          <>{prefix}{value}</>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{
          fontSize: '11px',
          fontFamily: "'Inter', sans-serif",
          color: 'var(--text-muted)',
          marginTop: '6px'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
