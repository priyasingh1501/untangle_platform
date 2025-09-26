import React from 'react';
import { motion } from 'framer-motion';
import { componentStyles, animations } from '../../styles/designTokens';

const Section = ({ 
  children, 
  variant = 'base',
  className = '', 
  animate = true,
  container = true,
  ...props 
}) => {
  const baseClasses = componentStyles.section.base;
  const containerClasses = container ? componentStyles.section.container : '';
  
  const sectionClasses = `
    ${baseClasses}
    ${containerClasses}
    ${className}
  `.trim();
  
  const MotionComponent = animate ? motion.section : 'section';
  
  return (
    <MotionComponent
      className={sectionClasses}
      initial={animate ? animations.fade.initial : undefined}
      animate={animate ? animations.fade.animate : undefined}
      transition={animations.fade.transition}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

export default Section;
