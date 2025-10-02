import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Target, Heart, DollarSign, FileText, Users, MessageCircle, BookOpen, Calendar, ShoppingCart, Brain, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

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

  const navItems = [
    { path: '/overview', icon: Home, label: 'Overview' },
    { path: '/goal-aligned-day', icon: Target, label: 'Goals' },
    { path: '/health', icon: Heart, label: 'Health' },
    { path: '/finance', icon: DollarSign, label: 'Finance' },
    { path: '/documents', icon: FileText, label: 'Documents' },
    { path: '/relationships', icon: Users, label: 'Relations' },
    { path: '/communication', icon: MessageCircle, label: 'Chat' },
    { path: '/journal', icon: BookOpen, label: 'Journal' },
    { path: '/time-management', icon: Calendar, label: 'Time' },
    { path: '/food', icon: ShoppingCart, label: 'Food' },
    { path: '/ai-chat', icon: Brain, label: 'AI Chat' },
    { path: '/profile', icon: Settings, label: 'Profile' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-gradient-to-b from-[#1E2330] to-[#0F1419] z-50 shadow-2xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-[#E8EEF2]">Untangle</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#C9D1D9] hover:text-[#E8EEF2]"
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-[#1E49C9] to-[#1E49C9] text-white'
                          : 'text-[#C9D1D9] hover:bg-[#2A313A] hover:text-[#E8EEF2]'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile App Info */}
              <div className="mt-8 p-4 bg-[#2A313A] rounded-lg">
                <h3 className="text-[#E8EEF2] font-semibold mb-2">📱 Mobile App</h3>
                <p className="text-[#C9D1D9] text-sm">
                  Add to home screen for app-like experience
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
