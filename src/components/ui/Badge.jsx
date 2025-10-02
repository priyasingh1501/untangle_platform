import React from 'react';
import { motion } from 'framer-motion';
import { componentStyles, animations } from '../../styles/designTokens';

const Badge = ({ 
  children, 
  variant = 'base', 
  size = 'md',
  className = '', 
  animate = true,
  ...props 
}) => {
  const baseClasses = componentStyles.badge.base;
  const variantClasses = componentStyles.badge[variant] || '';
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const badgeClasses = `
    ${baseClasses}
    ${variantClasses}
    ${sizeClasses[size]}
    ${className}
  `.trim();
  
  const MotionComponent = animate ? motion.span : 'span';
  
  return (
    <MotionComponent
      className={badgeClasses}
      initial={animate ? animations.scale.initial : undefined}
      animate={animate ? animations.scale.animate : undefined}
      whileHover={animate ? animations.hover : undefined}
      transition={animations.scale.transition}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

export default Badge;
