import React from 'react';
import { motion } from 'framer-motion';
import { componentStyles, animations } from '../../styles/designTokens';

const Header = ({ 
  children, 
  level = 1, 
  variant = 'base',
  className = '', 
  animate = true,
  ...props 
}) => {
  const baseClasses = componentStyles.header.base;
  const levelClasses = componentStyles.header[`h${level}`] || componentStyles.header.h1;
  
  const headerClasses = `
    ${baseClasses}
    ${levelClasses}
    ${className}
  `.trim();
  
  const MotionComponent = animate ? motion[`h${level}`] : `h${level}`;
  
  return (
    <MotionComponent
      className={headerClasses}
      initial={animate ? animations.slideUp.initial : undefined}
      animate={animate ? animations.slideUp.animate : undefined}
      transition={animations.slideUp.transition}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

export default Header;
