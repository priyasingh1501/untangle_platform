import React from 'react';
import { motion } from 'framer-motion';
import { componentStyles, animations } from '../../styles/designTokens';

const Input = ({ 
  label,
  error,
  success,
  className = '',
  animate = true,
  icon,
  ...props 
}) => {
  const baseClasses = componentStyles.input.base;
  
  const statusClasses = error ? 'input-error' : 
                         success ? 'input-success' : 
                         '';
  
  const inputClasses = `
    input
    ${statusClasses}
    focus:outline-none
    ${className}
  `.trim();
  
  const MotionComponent = animate ? motion.div : 'div';
  
  return (
    <MotionComponent
      className="space-y-2"
      initial={animate ? animations.fade.initial : undefined}
      animate={animate ? animations.fade.animate : undefined}
    >
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <motion.input
          className={`${inputClasses} ${icon ? 'pl-10' : ''}`}
          whileFocus={{ scale: 1.01 }}
          transition={animations.fade.transition}
          {...props}
        />
      </div>
      
      {error && (
        <motion.p 
          className="error-text"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={animations.fade.transition}
        >
          {error}
        </motion.p>
      )}
      
      {success && (
        <motion.p 
          className="text-sm text-[#1E49C9]"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={animations.fade.transition}
        >
          {success}
        </motion.p>
      )}
    </MotionComponent>
  );
};

export default Input;
