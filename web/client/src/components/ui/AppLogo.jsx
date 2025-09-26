import React from 'react';

const AppLogo = ({ 
  size = 40, 
  className = '', 
  variant = 'default' // 'default', 'white', 'black', 'minimal'
}) => {
  const getColor = () => {
    switch (variant) {
      case 'white':
        return '#FFFFFF';
      case 'black':
        return '#000000';
      case 'minimal':
        return '#1E49C9'; // Brand blue
      default:
        return '#E8EEF2'; // Default light color
    }
  };

  const color = getColor();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle (optional, for better visibility) */}
      {variant === 'minimal' && (
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          opacity="0.1"
        />
      )}
      
      {/* Spiral (top-left element - eye/thought bubble) */}
      <path
        d="M 25 25 
           A 8 8 0 1 1 33 25
           A 6 6 0 1 1 39 25
           A 4 4 0 1 1 43 25
           A 2 2 0 1 1 45 25"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Central element (nose/cheek) */}
      <path
        d="M 45 25 
           Q 50 30 55 40
           Q 60 50 55 60
           Q 50 65 45 60"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Bottom element (mouth/chin) */}
      <path
        d="M 30 70 
           Q 50 80 70 70"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default AppLogo;
