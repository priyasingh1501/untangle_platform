import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  X,
  Home,
  DollarSign,
  LogOut,
  Brain,
  Send,
  Target,
  Utensils,
  Menu,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { componentStyles, colors, typography } from '../../styles/designTokens';
import { Logo, AppLogo, Tooltip } from '../ui';


const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [rightToolbarOpen, setRightToolbarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m Alfred, your AI lifestyle assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);



  const navigation = [
    { name: 'Overview', href: '/overview', icon: Home },
    { name: 'Goals', href: '/goal-aligned-day', icon: Target },
    { name: 'Food', href: '/food', icon: Utensils },
    { name: 'Finance', href: '/finance', icon: DollarSign },
    { name: 'Content', href: '/content', icon: Brain },
    { name: 'Journal', href: '/journal', icon: BookOpen },
  ];

  // Debug log
  console.log('Navigation items:', navigation.map(item => item.name));



  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };





  const handleAiMessage = async (message) => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setAiMessages(prev => [...prev, userMessage]);
    setAiInput('');
    setAiLoading(true);
    
    try {
      // Send message to AI chat API
      const token = localStorage.getItem('token');
      
      const requestUrl = '/api/ai-chat/chat';
      const requestBody = { message };
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      let response;
      try {
        response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });
      } catch (fetchError) {
        console.error('❌ Fetch request failed:', fetchError);
        throw fetchError;
      }
      
      if (response.ok) {
        const data = await response.json();
        
        const aiResponse = {
          role: 'assistant',
          content: data.response || data.content || 'I understand. How else can I help?',
          timestamp: new Date()
        };
        
        setAiMessages(prev => {
          const newMessages = [...prev, aiResponse];
          return newMessages;
        });
      } else {
        console.log('❌ Response not ok, status:', response.status);
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        
        // Fallback response if API fails
        const fallbackResponse = {
          role: 'assistant',
          content: 'I\'m here to help! You can ask me to track expenses, add tasks, or get lifestyle insights.',
          timestamp: new Date()
        };
        setAiMessages(prev => [...prev, fallbackResponse]);
      }
    } catch (error) {
      console.error('❌ AI chat error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Fallback response on error
      const fallbackResponse = {
        role: 'assistant',
        content: 'I\'m experiencing some technical difficulties. Please try again in a moment.',
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      {/* Skip Link for Keyboard Navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {/* Mobile Sidebar Overlay */}
      {isMobile && mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Layout */}
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div 
          className={cn(
            "bg-[rgba(0,0,0,0.2)] border-r border-[rgba(255,255,255,0.2)] flex flex-col transition-all duration-300 ease-in-out backdrop-blur-[32px] backdrop-saturate-[180%] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] relative overflow-hidden",
            isMobile 
              ? cn(
                  "fixed left-0 top-0 h-full z-50 transform transition-transform duration-300",
                  mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )
              : cn(
                  sidebarCollapsed ? 'w-16' : 'w-64'
                )
          )}
        >
          {/* Glassmorphic Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.1)] to-transparent pointer-events-none"></div>
          
          {/* Logo */}
          <div className={cn(
            "border-b border-[rgba(255,255,255,0.2)] transition-all duration-300 relative z-10",
            isMobile ? 'p-4' : sidebarCollapsed ? 'p-3' : 'p-6'
          )}>
            <div className={cn(
              "flex items-center transition-all duration-300",
              isMobile ? 'justify-between' : sidebarCollapsed ? 'justify-center' : 'space-x-3'
            )}>
              {!isMobile && (
                <Tooltip
                  content={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  position="right"
                  delay={300}
                  disabled={!sidebarCollapsed}
                >
                  <div className="w-full">
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="w-full flex items-center rounded-xl transition-all duration-200 bg-black text-white hover:text-gray-200 hover:bg-gray-800 px-2 py-3"
                    >
                      {sidebarCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                      ) : (
                        <ChevronLeft className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </Tooltip>
              )}
              <div className={cn(
                "flex items-center space-x-2 transition-all duration-300",
                isMobile ? 'opacity-100' : sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              )}>
                <AppLogo size={32} variant="minimal" />
                <span className="text-xl font-bold tracking-wide">
                  Untangle
                </span>
              </div>
              {isMobile && (
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button - Only visible on mobile when sidebar is closed */}
          {isMobile && !mobileSidebarOpen && (
            <div className="p-4 border-b border-[rgba(255,255,255,0.2)] relative z-10">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="w-full flex items-center justify-center space-x-2 bg-black text-text-muted hover:text-text-primary hover:bg-gray-800 transition-colors px-4 py-3 rounded-xl"
                aria-label="Open menu"
              >
                <Menu size={20} />
                <span className="font-medium">Menu</span>
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className={cn(
            "flex-1 transition-all duration-300 relative z-10",
            isMobile ? 'p-4' : sidebarCollapsed ? 'p-2' : 'p-4'
          )}>
            <div className={cn(
              "space-y-2",
              isMobile ? 'space-y-3' : sidebarCollapsed ? 'space-y-3' : 'space-y-2'
            )}>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Tooltip
                    key={item.name}
                    content={item.name}
                    position="right"
                    delay={300}
                    disabled={!sidebarCollapsed || isMobile}
                  >
                    <div className="w-full">
                      <a
                        href={item.href}
                        onClick={() => isMobile && setMobileSidebarOpen(false)}
                        className={cn(
                          "w-full flex items-center rounded-xl transition-all duration-200 bg-black",
                          isMobile 
                            ? "justify-start space-x-3 px-4 py-3" 
                            : sidebarCollapsed 
                              ? "justify-center px-2 py-3" 
                              : "justify-start space-x-3 px-4 py-3",
                          isActive
                            ? "text-[#1E49C9] border border-[#1E49C9]/30"
                            : "text-text-secondary hover:text-text-primary hover:bg-gray-800"
                        )}
                      >
                        <Icon size={20} />
                        <span className={cn(
                          "font-medium transition-all duration-300",
                          isMobile ? 'opacity-100' : sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                        )}>
                          {item.name}
                        </span>
                      </a>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </nav>

          {/* Chat with Alfred Button - Hidden for now */}
          {false && (
            <div className={cn(
              "border-t border-[rgba(255,255,255,0.2)] transition-all duration-300 relative z-10",
              isMobile ? 'p-4' : sidebarCollapsed ? 'p-2' : 'p-4'
            )}>
              <Tooltip
                content="Chat with Alfred"
                position="right"
                delay={300}
                disabled={!sidebarCollapsed || isMobile}
              >
                <button
                  onClick={() => setAiChatOpen(true)}
                  className={cn(
                    "w-full flex items-center space-x-2 bg-[#1E49C9] text-text-inverse rounded-lg hover:bg-[#1E49C9]/90 transition-all duration-200 font-medium",
                    isMobile ? 'px-4 py-3' : sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'
                  )}
                  aria-label="Chat with Alfred"
                >
                  <Brain size={isMobile ? 16 : 18} />
                  <span className={cn(
                    "transition-all duration-300",
                    isMobile ? 'opacity-100' : sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                  )}>
                    Chat with Alfred
                  </span>
                </button>
              </Tooltip>
            </div>
          )}

          {/* User Section */}
          <div className={cn(
            "border-t border-[rgba(255,255,255,0.2)] transition-all duration-300 relative z-10",
            isMobile ? 'p-4' : sidebarCollapsed ? 'p-2' : 'p-4'
          )}>
            <div
              onClick={() => navigate('/profile')}
              role="button"
              tabIndex={0}
              className={cn(
                "w-full flex items-center rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.15)] backdrop-blur-[28px] backdrop-saturate-[140%] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 text-left",
                isMobile ? 'space-x-3 p-3' : sidebarCollapsed ? 'justify-center p-2' : 'space-x-3 p-3'
              )}
              aria-label="Open profile"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1E49C9] flex items-center justify-center">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </span>
                )}
              </div>
              <div className={cn(
                "flex-1 min-w-0 transition-all duration-300",
                isMobile ? 'opacity-100' : sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              )}>
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.firstName || user?.lastName ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : (user?.email || 'User')}
                </p>
                {user?.bio && (
                  <p className="text-xs text-text-muted truncate">
                    {user.bio}
                  </p>
                )}
              </div>
              <Tooltip
                content="Logout"
                position="right"
                delay={300}
                disabled={!sidebarCollapsed || isMobile}
              >
                <div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                    type="button"
                    className={cn(
                      "bg-black text-text-muted hover:text-text-primary hover:bg-gray-800 transition-colors transition-all duration-300 rounded-lg p-2",
                      isMobile ? 'opacity-100' : sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                    )}
                    aria-label="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isMobile && mobileSidebarOpen ? 'ml-0' : ''
        )}>

          {/* Page Content */}
          <main id="main-content" className="flex-1 overflow-auto bg-background-primary safe-area-bottom">
            <Outlet />
          </main>
        </div>

        {/* Right Sidebar - AI Chat */}
        {aiChatOpen && (
          <div className={cn(
            "bg-background-secondary border-l border-border-primary flex flex-col",
            isMobile ? "fixed right-0 top-0 h-full w-full z-50" : "w-80"
          )}>
            {/* AI Chat Header */}
            <div className="p-4 border-b border-border-primary">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${typography.fontFamily.display} tracking-wide`}>
                  AI Assistant
                </h3>
                <button
                  onClick={() => setAiChatOpen(false)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                  aria-label="Close AI chat"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* AI Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiMessages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2 rounded-2xl",
                      isMobile ? "max-w-[80%]" : "max-w-xs",
                      msg.role === 'user'
                        ? "bg-[#1E49C9] text-text-inverse"
                        : "bg-background-tertiary text-text-primary"
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Chat Input */}
            <div className="p-4 border-t border-border-primary safe-area-bottom">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Ask Alfred anything..."
                  value={aiInput}
                  onChange={(e) => {
                    setAiInput(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && aiInput.trim() && !aiLoading) {
                      e.preventDefault();
                      handleAiMessage(aiInput);
                    }
                  }}
                  className={cn(
                    "input",
                    "flex-1 min-h-[44px]"
                  )}
                  disabled={aiLoading}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (aiInput.trim() && !aiLoading) {
                      handleAiMessage(aiInput);
                    }
                  }}
                  disabled={aiLoading || !aiInput.trim()}
                  className="p-3 bg-[#1E49C9] text-text-inverse rounded-xl hover:bg-[#1E49C9]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
