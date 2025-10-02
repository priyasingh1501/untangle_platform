import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ 
  id,
  message, 
  type = 'default',
  duration = 4000,
  onClose,
  ...props 
}) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    default: Info
  };

  const Icon = icons[type];

  const getToastClasses = () => {
    const baseClasses = 'glass-toast px-4 py-3 rounded-lg flex items-center gap-3 min-w-80 max-w-md';
    
    switch (type) {
      case 'error':
        return `${baseClasses} glass-toast-error`;
      case 'success':
        return `${baseClasses}`;
      case 'warning':
        return `${baseClasses}`;
      case 'info':
        return `${baseClasses}`;
      default:
        return `${baseClasses}`;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-[#1E49C9]';
      case 'error':
        return 'text-[#1E49C9]';
      case 'warning':
        return 'text-[#1E49C9]';
      case 'info':
        return 'text-[#1E49C9]';
      default:
        return 'text-text-secondary';
    }
  };

  return (
    <motion.div
      className={getToastClasses()}
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...props}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${getIconColor()}`} />
      
      <div className="flex-1 text-text-primary text-sm font-medium">
        {message}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="
            p-1 
            rounded-md 
            text-text-secondary 
            hover:text-text-primary 
            hover:bg-white/10 
            transition-colors 
            duration-200
            flex-shrink-0
          "
          aria-label="Close toast"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

// Toast container component
export const ToastContainer = ({ children, position = 'top-right' }) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div className={`fixed z-50 ${positionClasses[position]} space-y-2`}>
      {children}
    </div>
  );
};

export default Toast;
