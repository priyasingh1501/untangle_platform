import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [registration, setRegistration] = useState(null);

  // Register service worker
  useEffect(() => {
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.jsx')
        .then((reg) => {
          console.log('✅ Service Worker registered successfully:', reg);
          setRegistration(reg);
          
          // Check if app is installed
          if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
          }
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      console.log('📱 Install prompt triggered');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('✅ App installed successfully');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 App is online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📴 App is offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install app function
  const installApp = async () => {
    if (deferredPrompt) {
      console.log('📱 Installing app...');
      deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      console.log('📱 Install outcome:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  // Update app function
  const updateApp = () => {
    if (registration) {
      registration.update();
    }
  };

  // Send message to service worker
  const sendMessageToSW = (message) => {
    if (registration && registration.active) {
      registration.active.postMessage(message);
    }
  };

  return {
    isInstalled,
    isOnline,
    showInstallPrompt,
    installApp,
    updateApp,
    sendMessageToSW,
    registration
  };
};
