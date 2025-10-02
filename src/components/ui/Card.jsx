import React from 'react';
import { motion } from 'framer-motion';
import { componentStyles, animations } from '../../styles/designTokens';

const Card = ({ 
  children, 
  variant = 'base', 
  className = '', 
  onClick, 
  animate = true,
  title,
  subtitle,
  icon,
  ...props 
}) => {
  const baseClasses = componentStyles.card[variant];
  const isInteractive = variant === 'interactive' || onClick;
  
  const cardClasses = `
    ${baseClasses}
    ${isInteractive ? 'cursor-pointer' : ''}
    ${className}
  `.trim();
  
  const MotionComponent = animate ? motion.div : 'div';
  
  return (
    <MotionComponent
      className={cardClasses}
      onClick={onClick}
      whileHover={animate && isInteractive ? { y: -1, transition: { duration: 0.2 } } : undefined}
      whileTap={animate && isInteractive ? { scale: 0.98, transition: { duration: 0.1 } } : undefined}
      initial={animate ? animations.fade.initial : undefined}
      animate={animate ? animations.fade.animate : undefined}
      exit={animate ? animations.fade.exit : undefined}
      transition={animate ? animations.fade.transition : undefined}
      {...props}
    >
      
      {/* Card Header */}
      {(title || subtitle || icon) && (
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="p-2 bg-[#1E49C9] bg-opacity-20 rounded-lg">
                {icon}
              </div>
            )}
            <div>
              {title && (
        <h3 className="font-jakarta text-2xl leading-normal text-text-primary font-bold tracking-wide">
          {title}
        </h3>
              )}
              {subtitle && (
                <p className="font-jakarta text-lg leading-loose text-text-secondary">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Card Content */}
      <div className="relative z-10">
        {children}
      </div>
    </MotionComponent>
  );
};

export default Card;
