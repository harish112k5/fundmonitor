import React from 'react';
import { motion } from 'framer-motion';

const HeroBackground = ({ className = '' }) => {
  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: '120px', position: 'absolute', bottom: 0, right: 0, overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 800 120" preserveAspectRatio="xMaxYMax meet" style={{ display: 'block', position: 'absolute', bottom: 0, right: 0 }}>
        
        {/* Ground Line */}
        <line x1="0" y1="119" x2="800" y2="119" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.3" />

        {/* Building 1 - Back */}
        <motion.g initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.1 }}>
          <rect x="200" y="40" width="80" height="80" fill="#1A1A26" stroke="rgba(245,158,11,0.2)" strokeWidth="1" />
          <rect x="215" y="55" width="10" height="15" fill="rgba(245,158,11,0.1)" />
          <rect x="235" y="55" width="10" height="15" fill="rgba(245,158,11,0.1)" />
          <rect x="255" y="55" width="10" height="15" fill="rgba(245,158,11,0.15)" />
          <rect x="215" y="80" width="10" height="15" fill="rgba(245,158,11,0.1)" />
          <rect x="255" y="80" width="10" height="15" fill="rgba(245,158,11,0.05)" />
        </motion.g>

        {/* Building 2 - Middle (with scaffolding) */}
        <motion.g initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <rect x="300" y="20" width="120" height="100" fill="#1A1A26" stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
          {/* Scaffolding lines */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }}>
            <line x1="295" y1="40" x2="425" y2="40" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.2" />
            <line x1="295" y1="60" x2="425" y2="60" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.2" />
            <line x1="295" y1="80" x2="425" y2="80" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.2" />
            <line x1="320" y1="20" x2="320" y2="120" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.2" />
            <line x1="360" y1="20" x2="360" y2="120" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.2" />
            <line x1="400" y1="20" x2="400" y2="120" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.2" />
          </motion.g>
        </motion.g>

        {/* Building 3 - Front Right */}
        <motion.g initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}>
          <rect x="440" y="50" width="90" height="70" fill="#1A1A26" stroke="rgba(245,158,11,0.25)" strokeWidth="1" />
          <rect x="455" y="65" width="15" height="10" fill="rgba(245,158,11,0.15)" />
          <rect x="480" y="65" width="15" height="10" fill="rgba(245,158,11,0.1)" />
          <rect x="505" y="65" width="15" height="10" fill="rgba(245,158,11,0.1)" />
        </motion.g>

        {/* Main Crane */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}>
          {/* Mast */}
          <rect x="580" y="10" width="6" height="110" fill="#1A1A26" stroke="#F59E0B" strokeWidth="0.5" strokeOpacity="0.5" />
          {/* Mast details */}
          <path d="M580 20 L586 30 M586 20 L580 30 M580 40 L586 50 M586 40 L580 50 M580 60 L586 70 M586 60 L580 70 M580 80 L586 90 M586 80 L580 90 M580 100 L586 110 M586 100 L580 110" stroke="#F59E0B" strokeWidth="0.5" strokeOpacity="0.3" fill="none" />
          
          {/* Animated Jib (Horizontal arm) */}
          <motion.g
            animate={{ x: [-8, 8, -8] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Jib arm */}
            <rect x="460" y="10" width="180" height="4" fill="#F59E0B" />
            {/* Counter jib */}
            <rect x="586" y="10" width="50" height="4" fill="#F59E0B" opacity="0.8" />
            {/* Top apex */}
            <polygon points="583,0 580,10 586,10" fill="#F59E0B" />
            {/* Cables */}
            <line x1="583" y1="0" x2="480" y2="10" stroke="#F59E0B" strokeWidth="0.5" />
            <line x1="583" y1="0" x2="620" y2="10" stroke="#F59E0B" strokeWidth="0.5" />
            
            {/* Hook cable dropping down */}
            <line x1="490" y1="14" x2="490" y2="50" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.6" />
            {/* Hook block */}
            <rect x="488" y="50" width="4" height="6" fill="#F59E0B" />

            {/* Blinking light at tip of crane */}
            <circle cx="460" cy="12" r="2" fill="#F59E0B" className="animate-live-blink" />
          </motion.g>
        </motion.g>

      </svg>
    </div>
  );
};

export default HeroBackground;
