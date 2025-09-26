import React from 'react';
import { X } from 'lucide-react';

const ConsistentPopup = ({ isOpen, onClose, title, children, maxWidth = "md", showReasonStrip = true, reasonStripColor = "from-accent-yellow to-[#1E49C9]" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4 safe-area-top safe-area-bottom" onClick={onClose}>
      <div className="bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.2)] rounded-2xl p-4 lg:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto backdrop-blur-[32px] backdrop-saturate-[180%] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] relative overflow-hidden" 
           onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.1)] to-transparent pointer-events-none"></div>
        {showReasonStrip && (
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${reasonStripColor} z-20`}></div>
        )}
        <div className="flex items-center justify-between mb-4 lg:mb-6 relative z-10 pt-1">
          <h3 className="text-lg lg:text-xl font-semibold text-[#E8EEF2] tracking-wide">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#E8EEF2] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close popup"
          >
            <X size={20} />
          </button>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ConsistentPopup;


