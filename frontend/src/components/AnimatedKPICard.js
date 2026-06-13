import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

const AnimatedKPICard = ({
  label,
  value,
  subtitle,
  icon: Icon,
  accentColor = '#F59E0B',
  isMoney = false,
  onClick = null,
  index = 0
}) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  // Helper to parse numeric value for CountUp if it's a string with symbols
  const parseNumericValue = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const stripped = String(val).replace(/[^0-9.-]+/g, '');
    const num = parseFloat(stripped);
    return isNaN(num) ? 0 : num;
  };

  const numericValue = parseNumericValue(value);
  const isPlainString = typeof value === 'string' && isNaN(parseFloat(value.toString().replace(/[^0-9.-]+/g, '')));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 0.96 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      whileHover={{
        y: -5,
        boxShadow: `0 12px 32px rgba(0,0,0,0.5), 0 0 32px ${accentColor}33`
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        minHeight: '110px'
      }}
    >
      {/* Background glow decoration */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10px',
          right: '-10px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: accentColor,
          opacity: 0.05,
          filter: 'blur(20px)',
          zIndex: 0
        }}
      />

      {/* Icon Area */}
      {Icon && (
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '8px',
          backgroundColor: `${accentColor}15`,
          color: accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
          zIndex: 1
        }}>
          <Icon />
        </div>
      )}

      {/* Content Area */}
      <div style={{ flex: 1, zIndex: 1, position: 'relative' }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          color: 'var(--text-muted)',
          fontWeight: 700,
          marginBottom: '4px'
        }}>
          {label}
        </div>

        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '28px',
          fontWeight: 700,
          color: accentColor,
          lineHeight: 1
        }}>
          {isPlainString ? (
            value
          ) : (
            <>
              {isMoney && '₹'}
              {inView ? (
                <CountUp
                  duration={1.8}
                  separator=","
                  start={0}
                  end={numericValue}
                  decimals={numericValue % 1 !== 0 ? 2 : 0}
                />
              ) : '0'}
            </>
          )}
        </div>

        {subtitle && (
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginTop: '6px'
          }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Hover animated bottom line */}
      <motion.div
        initial={{ width: '0%' }}
        whileHover={{ width: '100%' }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          backgroundColor: accentColor,
          opacity: 0.4
        }}
      />
    </motion.div>
  );
};

export default AnimatedKPICard;
