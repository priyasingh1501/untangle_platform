import React, { useState, useEffect } from 'react';
import { Button } from './index.jsx';
import { usePWA } from '../../hooks/usePWA';

const PWAInstall = () => {
  const { showInstallPrompt, installApp, isInstalled, isOnline } = usePWA();
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render on desktop or if installed or no prompt
  if (!isMobile || isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-[#1E2330] to-[#2A313A] border border-[#1E49C9] rounded-lg shadow-lg p-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-[#E8EEF2] font-semibold text-sm">
            📱 Install Untangle App
          </h3>
          <p className="text-[#C9D1D9] text-xs mt-1">
            Get quick access and work offline
          </p>
        </div>
        
        <div className="flex gap-2 ml-4">
          <Button
            onClick={installApp}
            size="sm"
            className="bg-gradient-to-r from-[#1E49C9] to-[#1E49C9] text-white px-3 py-1 text-xs hover:from-[#1E49C9]/90 hover:to-[#1E49C9]/90"
          >
            Install
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="border-[#1E49C9] text-[#1E49C9] px-3 py-1 text-xs hover:bg-[#1E49C9] hover:text-white"
          >
            Later
          </Button>
        </div>
      </div>
      
      {!isOnline && (
        <div className="mt-2 p-2 bg-[#2A313A] rounded border-l-4 border-[#EF4444]">
          <p className="text-[#EF4444] text-xs">
            📴 You're offline - some features may be limited
          </p>
        </div>
      )}
    </div>
  );
};

export default PWAInstall;
