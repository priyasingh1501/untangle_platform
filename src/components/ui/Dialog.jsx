import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Dialog = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "md",
  showCloseButton = true,
  className = '',
  ...props 
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        {/* Dialog Content */}
        <motion.div
          className={`
            glass-card
            relative
            w-full
            ${maxWidthClasses[maxWidth]}
            mx-auto
            ${className}
          `}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">
                {title}
              </h2>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="
                    p-2 
                    rounded-lg 
                    text-text-secondary 
                    hover:text-text-primary 
                    hover:bg-white/10 
                    transition-colors 
                    duration-200
                    group
                  "
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="text-text-primary">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Dialog;
