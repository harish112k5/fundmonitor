import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PageWrapper = ({ children, className = '' }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className={`blueprint-bg ${className}`}
        style={{
          backgroundColor: 'var(--bg-page)',
          minHeight: '100vh',
          padding: '24px',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export const AnimatedItem = ({ children, delayIndex = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay: Math.min(delayIndex * 0.05, 0.4) }}
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
