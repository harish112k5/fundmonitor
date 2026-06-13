import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBadge = ({ status, color = '#F59E0B' }) => {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.06 }}
      style={{
        backgroundColor: `${color}18`, // 18 hex = ~9.4% opacity
        color: color,
        border: `1px solid ${color}35`, // 35 hex = ~20% opacity
        borderRadius: 'var(--radius-sm)',
        padding: '3px 8px',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: 'var(--font-heading)',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap'
      }}
    >
      {status}
    </motion.span>
  );
};

export default AnimatedBadge;
