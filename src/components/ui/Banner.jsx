import React from 'react';
import { motion } from 'framer-motion';
import { componentStyles, animations } from '../../styles/designTokens';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const Banner = ({ 
  children, 
  variant = 'info',
  title,
  onClose,
  className = '',
  animate = true,
  ...props 
}) => {
  const variantConfig = {
    info: {
      icon: Info,
      classes: 'bg-status-info/20 text-status-info border-status-info/30',
      iconClasses: 'text-status-info'
    },
    success: {
      icon: CheckCircle,
      classes: 'bg-status-success/20 text-status-success border-status-success/30',
      iconClasses: 'text-status-success'
    },
    warning: {
      icon: AlertTriangle,
      classes: 'bg-status-warning/20 text-status-warning border-status-warning/30',
      iconClasses: 'text-status-warning'
    },
    error: {
      icon: AlertCircle,
      classes: 'bg-status-error/20 text-status-error border-status-error/30',
      iconClasses: 'text-status-error'
    }
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  const bannerClasses = `
    ${componentStyles.badge.base}
    ${config.classes}
    border
    p-4
    rounded-xl
    ${className}
  `.trim();

  const MotionComponent = animate ? motion.div : 'div';

  return (
    <MotionComponent
      className={bannerClasses}
      initial={animate ? animations.slideDown.initial : undefined}
      animate={animate ? animations.slideDown.animate : undefined}
      exit={animate ? animations.slideDown.exit : undefined}
      transition={animations.slideDown.transition}
      {...props}
    >
      <div className="flex items-start space-x-3">
        <Icon size={20} className={`mt-0.5 flex-shrink-0 ${config.iconClasses}`} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold mb-1">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-current hover:opacity-70 transition-opacity flex-shrink-0"
            aria-label="Close banner"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </MotionComponent>
  );
};

export default Banner;
