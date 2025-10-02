import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Download, Share2 } from 'lucide-react';
import { Button } from './index.jsx';

const MobileInstallGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [showAndroid, setShowAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOS(true);
      setShowAndroid(false);
    } else if (isAndroid) {
      setShowAndroid(true);
      setShowIOS(false);
    } else {
      // Show both options for desktop
      setShowIOS(true);
      setShowAndroid(true);
    }
    setIsOpen(true);
  };

  return (
    <>
      {/* Install Button */}
      <button
        onClick={handleInstallClick}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
        title="Install App"
      >
        <Download size={24} />
      </button>

      {/* Installation Guide Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-[#1E2330] to-[#0F1419] rounded-lg shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#E8EEF2] flex items-center">
                  <Smartphone className="mr-2" />
                  Install Untangle App
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#C9D1D9] hover:text-[#E8EEF2]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* iOS Instructions */}
                {showIOS && (
                  <div className="bg-[#2A313A] rounded-lg p-4">
                    <h3 className="text-[#E8EEF2] font-semibold mb-3 flex items-center">
                      📱 iPhone/iPad
                    </h3>
                    <ol className="text-[#C9D1D9] text-sm space-y-2">
                      <li>1. Tap the <Share2 className="inline w-4 h-4" /> Share button</li>
                      <li>2. Scroll down and tap "Add to Home Screen"</li>
                      <li>3. Tap "Add" to install</li>
                      <li>4. Open from your home screen!</li>
                    </ol>
                  </div>
                )}

                {/* Android Instructions */}
                {showAndroid && (
                  <div className="bg-[#2A313A] rounded-lg p-4">
                    <h3 className="text-[#E8EEF2] font-semibold mb-3 flex items-center">
                      🤖 Android
                    </h3>
                    <ol className="text-[#C9D1D9] text-sm space-y-2">
                      <li>1. Look for the install prompt</li>
                      <li>2. Or tap menu (⋮) → "Add to Home Screen"</li>
                      <li>3. Tap "Install" to add</li>
                      <li>4. Open from your app drawer!</li>
                    </ol>
                  </div>
                )}

                {/* Benefits */}
                <div className="bg-gradient-to-r from-[#1E49C9]/20 to-[#1E49C9]/20 rounded-lg p-4 border border-[#1E49C9]/30">
                  <h4 className="text-[#E8EEF2] font-semibold mb-2">✨ Benefits</h4>
                  <ul className="text-[#C9D1D9] text-sm space-y-1">
                    <li>• Works offline</li>
                    <li>• Fast loading</li>
                    <li>• App-like experience</li>
                    <li>• No app store needed</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Got it!
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-gradient-to-r from-[#1E49C9] to-[#1E49C9]"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileInstallGuide;
