import React from 'react';
import { motion } from 'framer-motion';

const AnimatedTableRow = ({ children, index = 0, onClick, className = '' }) => {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ backgroundColor: 'rgba(245,158,11,0.04)' }}
      onClick={onClick}
      className={className}
      style={{
        borderBottom: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {children}
    </motion.tr>
  );
};

export default AnimatedTableRow;
