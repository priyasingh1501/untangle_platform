import React from 'react';

const Logo = ({ 
  size = 'md', 
  className = '',
  variant = 'default' // default, minimal, icon
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8', 
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    '2xl': 'w-24 h-24'
  };

  const colorClasses = {
    default: 'text-white',
    primary: 'text-accent-primary',
    muted: 'text-text-muted'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[variant]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Double Helix on the left */}
        <path
          d="M15 20
             C15 15, 20 10, 25 10
             C30 10, 35 15, 35 20
             L35 25
             C35 26, 34 27, 33 27
             C32 27, 31 26, 31 25
             L31 30
             C31 31, 32 32, 33 32
             C34 32, 35 31, 35 30
             L35 35
             C35 36, 34 37, 33 37
             C32 37, 31 36, 31 35
             L31 40
             C31 41, 32 42, 33 42
             C34 42, 35 41, 35 40
             L35 45
             C35 46, 34 47, 33 47
             C32 47, 31 46, 31 45
             L31 50
             C31 51, 32 52, 33 52
             C34 52, 35 51, 35 50
             L35 55
             C35 56, 34 57, 33 57
             C32 57, 31 56, 31 55
             L31 60
             C31 61, 32 62, 33 62
             C34 62, 35 61, 35 60
             L35 65
             C35 66, 34 67, 33 67
             C32 67, 31 66, 31 65
             L31 70
             C31 71, 32 72, 33 72
             C34 72, 35 71, 35 70
             L35 20"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Second helix strand */}
        <path
          d="M20 20
             C20 15, 25 10, 30 10
             C35 10, 40 15, 40 20
             L40 25
             C40 26, 39 27, 38 27
             C37 27, 36 26, 36 25
             L36 30
             C36 31, 37 32, 38 32
             C39 32, 40 31, 40 30
             L40 35
             C40 36, 39 37, 38 37
             C37 37, 36 36, 36 35
             L36 40
             C36 41, 37 42, 38 42
             C39 42, 40 41, 40 40
             L40 45
             C40 46, 39 47, 38 47
             C37 47, 36 46, 36 45
             L36 50
             C36 51, 37 52, 38 52
             C39 52, 40 51, 40 50
             L40 55
             C40 56, 39 57, 38 57
             C37 57, 36 56, 36 55
             L36 60
             C36 61, 37 62, 38 62
             C39 62, 40 61, 40 60
             L40 65
             C40 66, 39 67, 38 67
             C37 67, 36 66, 36 65
             L36 70
             C36 71, 37 72, 38 72
             C39 72, 40 71, 40 70
             L40 20"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* U Shape on the right */}
        <path
          d="M50 20
             C50 15, 55 10, 60 10
             C65 10, 70 15, 70 20
             L70 60
             C70 65, 65 70, 60 70
             C55 70, 50 65, 50 60
             L50 20"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Inner U line for double-line effect */}
        <path
          d="M55 20
             C55 18, 56 17, 57 17
             C58 17, 59 18, 59 20
             L59 60
             C59 61, 58 62, 57 62
             C56 62, 55 61, 55 60
             L55 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

export default Logo;