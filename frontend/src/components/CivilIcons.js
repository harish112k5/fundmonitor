import React from 'react';

// All icons use viewBox="0 0 16 16", stroke="currentColor", inherit color from parent

export const DashboardIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5" />
    <line x1="8" y1="2" x2="8" y2="3.5" />
    <line x1="8" y1="12.5" x2="8" y2="14" />
    <line x1="2" y1="8" x2="3.5" y2="8" />
    <line x1="12.5" y1="8" x2="14" y2="8" />
    <line x1="8" y1="8" x2="10.5" y2="5.5" />
    <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const ProjectIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="10" height="10" rx="1" />
    <line x1="6" y1="4" x2="6" y2="14" />
    <line x1="10" y1="4" x2="10" y2="14" />
    <line x1="3" y1="7" x2="13" y2="7" />
    <line x1="3" y1="10" x2="13" y2="10" />
    {/* Scaffolding poles */}
    <line x1="1.5" y1="3" x2="1.5" y2="14" />
    <line x1="14.5" y1="3" x2="14.5" y2="14" />
    <line x1="1.5" y1="6" x2="3" y2="6" />
    <line x1="13" y1="6" x2="14.5" y2="6" />
  </svg>
);

export const MaterialIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="12" height="3" rx="0.5" />
    <rect x="2" y="6.5" width="12" height="3" rx="0.5" />
    <rect x="2" y="10" width="12" height="3" rx="0.5" />
  </svg>
);

export const WorkerIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {/* Hard hat */}
    <path d="M4 7 A4 3 0 0 1 12 7" />
    <line x1="3" y1="7" x2="13" y2="7" />
    <rect x="3.5" y="7" width="9" height="1.5" rx="0.3" />
    {/* Face */}
    <circle cx="8" cy="11" r="1.5" />
    {/* Body */}
    <path d="M4.5 14.5 A3.5 3 0 0 1 11.5 14.5" />
  </svg>
);

export const MachineIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {/* Excavator body */}
    <rect x="1" y="10" width="8" height="4" rx="1" />
    {/* Cabin */}
    <rect x="6" y="7" width="3" height="3" rx="0.5" />
    {/* Boom arm */}
    <line x1="9" y1="8" x2="13" y2="4" />
    {/* Stick */}
    <line x1="13" y1="4" x2="14.5" y2="7" />
    {/* Bucket */}
    <path d="M14.5 7 L15 8 L13.5 8 L14.5 7" />
    {/* Tracks */}
    <circle cx="3" cy="14" r="1" />
    <circle cx="7" cy="14" r="1" />
  </svg>
);

export const FinanceIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {/* Hexagon */}
    <polygon points="8,1.5 13.5,4.75 13.5,11.25 8,14.5 2.5,11.25 2.5,4.75" />
    {/* Rupee symbol */}
    <line x1="5.5" y1="5.5" x2="10.5" y2="5.5" />
    <line x1="5.5" y1="7.5" x2="10.5" y2="7.5" />
    <path d="M6 5.5 C6 5.5 9 5.5 9 7.5 C9 9.5 6 9.5 6 9.5 L10.5 13" />
  </svg>
);

export const InvestorIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="5" r="2" />
    <circle cx="10.5" cy="5" r="2" />
    <path d="M2 13 A3.5 3.5 0 0 1 9 13" />
    <path d="M7 13 A3.5 3.5 0 0 1 14 13" />
  </svg>
);

export const LoanIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {/* Coin stack */}
    <ellipse cx="8" cy="12" rx="4" ry="1.5" />
    <ellipse cx="8" cy="10" rx="4" ry="1.5" />
    <ellipse cx="8" cy="8" rx="4" ry="1.5" />
    {/* Lock */}
    <rect x="6" y="3" width="4" height="3" rx="0.5" />
    <path d="M7 3 L7 1.5 A1 1 0 0 1 9 1.5 L9 3" />
    <circle cx="8" cy="4.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

export const ExpenseIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="2" width="10" height="12" rx="1" />
    <line x1="5.5" y1="5" x2="10.5" y2="5" />
    <line x1="5.5" y1="7" x2="10.5" y2="7" />
    <line x1="5.5" y1="9" x2="8" y2="9" />
    {/* Rupee symbol small */}
    <text x="8" y="12.5" fontSize="4" fill="currentColor" stroke="none" fontWeight="bold">₹</text>
  </svg>
);

export const BillingIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="2" width="10" height="12" rx="1" />
    <line x1="5.5" y1="5" x2="10.5" y2="5" />
    <line x1="5.5" y1="7" x2="10.5" y2="7" />
    <line x1="5.5" y1="9" x2="10.5" y2="9" />
    {/* Stamp */}
    <circle cx="10" cy="11.5" r="1.5" />
    <line x1="10" y1="10.5" x2="10" y2="12.5" />
  </svg>
);

export const ProgressIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="10" width="3" height="4" rx="0.3" />
    <rect x="6.5" y="6" width="3" height="8" rx="0.3" />
    <rect x="11" y="2" width="3" height="12" rx="0.3" />
  </svg>
);

export const TeamIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="4" r="2" />
    <circle cx="3" cy="6" r="1.5" />
    <circle cx="13" cy="6" r="1.5" />
    <path d="M5 12 A3 3 0 0 1 11 12" />
    <path d="M1 13.5 A2 2 0 0 1 5 13.5" />
    <path d="M11 13.5 A2 2 0 0 1 15 13.5" />
    {/* Connecting lines */}
    <line x1="4.5" y1="6" x2="6" y2="5" />
    <line x1="10" y1="5" x2="11.5" y2="6" />
  </svg>
);

export const ImportIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {/* Box */}
    <rect x="2" y="7" width="12" height="7" rx="1" />
    <line x1="2" y1="10" x2="5" y2="10" />
    <line x1="11" y1="10" x2="14" y2="10" />
    {/* Arrow down */}
    <line x1="8" y1="2" x2="8" y2="10" />
    <polyline points="5.5,7 8,10 10.5,7" />
  </svg>
);

export const AlertIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5 L14.5 13.5 L1.5 13.5 Z" />
    <line x1="8" y1="6" x2="8" y2="9.5" />
    <circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

export const AdminIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {/* Shield */}
    <path d="M8 1.5 L13 4 L13 9 C13 12 8 14.5 8 14.5 C8 14.5 3 12 3 9 L3 4 Z" />
    {/* Wrench */}
    <circle cx="7" cy="7" r="1.5" />
    <line x1="8.2" y1="8.2" x2="11" y2="11" />
  </svg>
);

export const AuditIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="1.5" width="10" height="13" rx="1" />
    {/* Clip */}
    <rect x="5.5" y="0.5" width="5" height="2" rx="0.5" />
    {/* Checkmarks */}
    <polyline points="5,6 6.5,7.5 8,5" />
    <polyline points="5,9 6.5,10.5 8,8" />
    <line x1="9" y1="6.5" x2="11.5" y2="6.5" />
    <line x1="9" y1="9.5" x2="11.5" y2="9.5" />
  </svg>
);

export const RecycleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    {/* Dumpster body */}
    <path d="M2 6 L3 14 L13 14 L14 6" />
    {/* Lid */}
    <rect x="1.5" y="4.5" width="13" height="1.5" rx="0.3" />
    {/* Handles */}
    <line x1="5.5" y1="4.5" x2="5.5" y2="3.5" />
    <line x1="10.5" y1="4.5" x2="10.5" y2="3.5" />
    {/* Lines on body */}
    <line x1="6" y1="8" x2="6" y2="12" />
    <line x1="8" y1="8" x2="8" y2="12" />
    <line x1="10" y1="8" x2="10" y2="12" />
  </svg>
);

export const UsersIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="5" r="2.5" />
    <path d="M2 14 A4 4 0 0 1 10 14" />
    <circle cx="11.5" cy="5.5" r="2" />
    <path d="M9 14 A3.5 3.5 0 0 1 14.5 14" />
  </svg>
);

export const HelmetIcon = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    {/* Hard hat dome */}
    <path d="M6 20 C6 12 12 6 18 6 C24 6 30 12 30 20" stroke="#F59E0B" strokeWidth="2" fill="none" />
    {/* Brim */}
    <rect x="4" y="20" width="28" height="4" rx="1.5" fill="#F59E0B" />
    {/* Hat detail line */}
    <line x1="18" y1="6" x2="18" y2="20" stroke="#D97706" strokeWidth="1" opacity="0.5" />
    <line x1="10" y1="14" x2="26" y2="14" stroke="#D97706" strokeWidth="1" opacity="0.3" />
    {/* Safety light */}
    <circle cx="18" cy="10" r="2" fill="#FCD34D" opacity="0.8" />
  </svg>
);

// Skyline illustration for dashboard hero
export const SkylineSVG = ({ width = '100%', height = 70 }) => (
  <svg width={width} height={height} viewBox="0 0 400 70" fill="none" preserveAspectRatio="xMaxYMax meet">
    {/* Buildings */}
    <rect x="20" y="30" width="30" height="40" fill="var(--border-medium)" />
    <rect x="55" y="20" width="25" height="50" fill="var(--border-medium)" />
    <rect x="85" y="35" width="35" height="35" fill="var(--border-medium)" />
    <rect x="125" y="15" width="20" height="55" fill="var(--border-medium)" />
    <rect x="150" y="25" width="40" height="45" fill="var(--border-medium)" />
    <rect x="195" y="10" width="25" height="60" fill="var(--border-medium)" />
    <rect x="225" y="30" width="30" height="40" fill="var(--border-medium)" />
    <rect x="260" y="20" width="20" height="50" fill="var(--border-medium)" />
    {/* Scaffolding on one building */}
    <line x1="150" y1="30" x2="190" y2="30" stroke="#4B5563" strokeWidth="0.5" />
    <line x1="150" y1="40" x2="190" y2="40" stroke="#4B5563" strokeWidth="0.5" />
    <line x1="150" y1="50" x2="190" y2="50" stroke="#4B5563" strokeWidth="0.5" />
    <line x1="155" y1="25" x2="155" y2="70" stroke="#4B5563" strokeWidth="0.5" />
    <line x1="165" y1="25" x2="165" y2="70" stroke="#4B5563" strokeWidth="0.5" />
    <line x1="175" y1="25" x2="175" y2="70" stroke="#4B5563" strokeWidth="0.5" />
    <line x1="185" y1="25" x2="185" y2="70" stroke="#4B5563" strokeWidth="0.5" />
    {/* Tower crane */}
    <line x1="310" y1="5" x2="310" y2="70" stroke="var(--border-medium)" strokeWidth="2" />
    <line x1="290" y1="5" x2="370" y2="5" stroke="var(--border-medium)" strokeWidth="2" />
    <line x1="310" y1="5" x2="290" y2="5" stroke="#F59E0B" strokeWidth="2" />
    {/* Crane cables */}
    <line x1="370" y1="5" x2="360" y2="40" stroke="#4B5563" strokeWidth="0.7" />
    <line x1="310" y1="5" x2="360" y2="40" stroke="#4B5563" strokeWidth="0.5" />
    {/* Safety lights */}
    <circle cx="310" cy="5" r="2" fill="#F59E0B" />
    <circle cx="370" cy="5" r="1.5" fill="#FCD34D" opacity="0.8" />
    {/* Counterweight */}
    <rect x="285" y="5" width="8" height="6" fill="var(--border-medium)" />
    {/* Small excavator at ground level */}
    <rect x="330" y="60" width="20" height="10" rx="2" fill="var(--border-medium)" />
    <rect x="342" y="54" width="8" height="6" rx="1" fill="var(--border-medium)" />
    <line x1="350" y1="56" x2="365" y2="48" stroke="var(--border-medium)" strokeWidth="1.5" />
    <line x1="365" y1="48" x2="370" y2="55" stroke="var(--border-medium)" strokeWidth="1.5" />
    {/* Ground line */}
    <line x1="0" y1="70" x2="400" y2="70" stroke="var(--border-subtle)" strokeWidth="1" />
  </svg>
);

// Construction illustration for login page right panel
export const ConstructionSVG = ({ width = '100%', height = '100%' }) => (
  <svg width={width} height={height} viewBox="0 0 400 600" fill="none" preserveAspectRatio="xMidYMid meet" style={{ maxWidth: '400px' }}>
    {/* Main building under construction */}
    <rect x="100" y="120" width="200" height="350" fill="var(--bg-card)" stroke="var(--border-medium)" strokeWidth="1" />
    {/* Floors */}
    {[0,1,2,3,4,5,6].map(i => (
      <line key={`floor-${i}`} x1="100" y1={170 + i * 50} x2="300" y2={170 + i * 50} stroke="var(--border-subtle)" strokeWidth="1" />
    ))}
    {/* Vertical columns */}
    {[0,1,2,3].map(i => (
      <line key={`col-${i}`} x1={130 + i * 50} y1="120" x2={130 + i * 50} y2="470" stroke="var(--border-subtle)" strokeWidth="1" />
    ))}
    {/* Scaffolding left */}
    <rect x="70" y="150" width="30" height="320" fill="none" stroke="var(--border-medium)" strokeWidth="0.5" />
    {[0,1,2,3,4,5,6].map(i => (
      <React.Fragment key={`scaff-l-${i}`}>
        <line x1="70" y1={170 + i * 50} x2="100" y2={170 + i * 50} stroke="var(--border-medium)" strokeWidth="0.5" />
        <line x1="70" y1={170 + i * 50} x2="100" y2={170 + (i + 1) * 50} stroke="var(--border-medium)" strokeWidth="0.3" />
      </React.Fragment>
    ))}
    {/* Scaffolding right */}
    <rect x="300" y="180" width="30" height="290" fill="none" stroke="var(--border-medium)" strokeWidth="0.5" />
    {[0,1,2,3,4,5].map(i => (
      <React.Fragment key={`scaff-r-${i}`}>
        <line x1="300" y1={200 + i * 50} x2="330" y2={200 + i * 50} stroke="var(--border-medium)" strokeWidth="0.5" />
        <line x1="300" y1={200 + i * 50} x2="330" y2={200 + (i + 1) * 50} stroke="var(--border-medium)" strokeWidth="0.3" />
      </React.Fragment>
    ))}
    {/* Tower crane */}
    <line x1="200" y1="20" x2="200" y2="120" stroke="var(--border-medium)" strokeWidth="3" />
    <line x1="120" y1="20" x2="350" y2="20" stroke="var(--border-medium)" strokeWidth="3" />
    {/* Crane jib */}
    <line x1="200" y1="20" x2="350" y2="20" stroke="#F59E0B" strokeWidth="3" />
    {/* Crane cables */}
    <line x1="340" y1="20" x2="320" y2="100" stroke="#4B5563" strokeWidth="1" />
    {/* Safety lights */}
    <circle cx="200" cy="20" r="4" fill="#F59E0B" />
    <circle cx="350" cy="20" r="3" fill="#FCD34D" opacity="0.8" />
    <circle cx="120" cy="20" r="3" fill="#FCD34D" opacity="0.5" />
    {/* Counterweight */}
    <rect x="110" y="20" width="16" height="12" fill="var(--border-medium)" />
    {/* Ground */}
    <line x1="0" y1="470" x2="400" y2="470" stroke="var(--border-subtle)" strokeWidth="2" />
    {/* Company branding */}
    <text x="200" y="520" textAnchor="middle" fill="#F59E0B" fontFamily="Oswald" fontSize="28" fontWeight="700" letterSpacing="3">BillX</text>
    <text x="200" y="545" textAnchor="middle" fill="var(--text-muted)" fontFamily="Inter" fontSize="11" letterSpacing="3">FINANCIAL INFRASTRUCTURE INTELLIGENCE</text>
  </svg>
);
