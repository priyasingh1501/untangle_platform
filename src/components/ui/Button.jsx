import React from 'react';
import { motion } from 'framer-motion';
import { componentStyles, animations } from '../../styles/designTokens';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  disabled = false,
  loading = false,
  animate = true,
  ...props 
}) => {
  const baseClasses = componentStyles.button[variant];
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };
  
  const hoverClasses = variant === 'primary' 
    ? 'hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05),0_0_30px_rgba(30,73,201,0.4)] hover:-translate-y-0.5'
    : 'hover:bg-[rgba(30,73,201,0.1)] hover:border-[rgba(30,73,201,0.3)] hover:-translate-y-0.5';
  
  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${!disabled ? hoverClasses : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();
  
  const MotionComponent = animate ? motion.button : 'button';
  
  return (
    <MotionComponent
      className={buttonClasses}
      disabled={disabled || loading}
      whileHover={animate && !disabled ? { y: -1, transition: { duration: 0.2 } } : undefined}
      whileTap={animate && !disabled ? { scale: 0.98, transition: { duration: 0.1 } } : undefined}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </MotionComponent>
  );
};

export default Button;
