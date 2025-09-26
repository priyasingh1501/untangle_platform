import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Lightbulb, 
  Clock, 
  Target, 
  TrendingUp,
  BookOpen,
  Film,
  Music,
  Settings,
  RefreshCw,
  CheckCircle,
  Zap,
  Heart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AiChat = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [actions, setActions] = useState([]);
  const [context, setContext] = useState({});
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Quick action suggestions
  const quickActions = [
    { text: "I need to finish my project report", icon: Target, color: "bg-blue-500" },
    { text: "I'm feeling tired today", icon: Heart, color: "bg-pink-500" },
    { text: "I spent $25 on lunch", icon: TrendingUp, color: "bg-[#1E49C9]" },
    { text: "I want to read a good book", icon: BookOpen, color: "bg-purple-500" },
    { text: "Schedule a meeting tomorrow", icon: Clock, color: "bg-orange-500" },
    { text: "I'm feeling motivated", icon: Zap, color: "bg-yellow-500" }
  ];

  // Content type suggestions
  const contentSuggestions = [
    { text: "Recommend me a book", type: "book", icon: BookOpen },
    { text: "Suggest a movie", type: "movie", icon: Film },
    { text: "Find a podcast", type: "podcast", icon: Music },
    { text: "Learning resources", type: "course", icon: TrendingUp }
  ];

  const initializeChat = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-chat/session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContext(data.currentSession?.context || {});
        
        // Add welcome message
        if (data.recentMessages.length === 0) {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Hi ${data.userProfile?.goals?.length > 0 ? 'there' : '! I\'m Untangle, your AI lifestyle assistant'}! I'm here to work on today?`,
            timestamp: new Date(),
            metadata: {}
          }]);
        } else {
          setMessages(data.recentMessages);
        }
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to initialize chat');
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      initializeChat();
    }
  }, [token, initializeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      metadata: {}
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          context
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          metadata: {
            actions: data.actions || [],
            suggestions: data.suggestions || []
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
        setActions(data.actions || []);
        
        if (data.context) {
          setContext(data.context);
        }

        // Show success message for actions
        if (data.actions && data.actions.length > 0) {
          data.actions.forEach(action => {
            if (action.type === 'create_task') {
              toast.success('Task created successfully!');
            } else if (action.type === 'create_journal_entry') {
              toast.success('Journal entry added!');
            } else if (action.type === 'add_expense') {
              toast.success('Expense tracked!');
            } else if (action.type === 'schedule_time') {
              toast.success('Time scheduled!');
            }
          });
        }
      } else {
        toast.error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    setInputMessage(action.text);
    inputRef.current?.focus();
  };

  const handleContentSuggestion = (suggestion) => {
    setInputMessage(suggestion.text);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = (role) => {
    return role === 'user' ? User : Bot;
  };

  const getMessageBubbleStyle = (role) => {
    return role === 'user' 
      ? 'bg-primary-600 text-white ml-auto' 
      : 'bg-gray-100 text-gray-900';
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'create_task': return Target;
      case 'create_journal_entry': return BookOpen;
      case 'add_expense': return TrendingUp;
      case 'schedule_time': return Clock;
      default: return CheckCircle;
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'create_task': return 'text-blue-600';
      case 'create_journal_entry': return 'text-purple-600';
      case 'add_expense': return 'text-[#1E49C9]';
      case 'schedule_time': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto h-screen flex flex-col p-4 lg:p-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900">AI Assistant</h1>
                <p className="text-sm text-gray-600">Your personal lifestyle manager</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 min-h-[44px] min-w-[44px]"
                title="Toggle suggestions"
              >
                <Lightbulb className="h-5 w-5" />
              </button>
              <button
                onClick={initializeChat}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 min-h-[44px] min-w-[44px]"
                title="Refresh chat"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 flex flex-col">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`p-2 rounded-lg ${message.role === 'user' ? 'bg-primary-100' : 'bg-gray-200'}`}>
                          {React.createElement(getMessageIcon(message.role), { 
                            className: `h-5 w-5 ${message.role === 'user' ? 'text-primary-600' : 'text-gray-600'}` 
                          })}
                        </div>
                        
                        <div className="flex-1">
                          <div className={`rounded-2xl px-4 py-3 ${getMessageBubbleStyle(message.role)}`}>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                          
                          {/* Message Metadata */}
                          {message.metadata?.actions && message.metadata.actions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-sm text-gray-500 font-medium">Actions taken:</p>
                              {message.metadata.actions.map((action, actionIndex) => (
                                <div key={actionIndex} className="flex items-center space-x-2 text-sm">
                                  {React.createElement(getActionIcon(action.type), { 
                                    className: `h-4 w-4 ${getActionColor(action.type)}` 
                                  })}
                                  <span className="text-gray-600">
                                    {action.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                  <span className="text-[#1E49C9]">
                                    <CheckCircle className="h-4 w-4" />
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-2 text-xs text-gray-400">
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-200 rounded-lg">
                      <Bot className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tell me what you need help with..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions Sidebar */}
          {showSuggestions && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '320px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-gray-200 bg-white overflow-hidden"
            >
              <div className="p-4 space-y-6">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${action.color} bg-opacity-20`}>
                            {React.createElement(action.icon, { 
                              className: "h-4 w-4 text-gray-700" 
                            })}
                          </div>
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            {action.text}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Suggestions */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                    Content & Learning
                  </h3>
                  <div className="space-y-2">
                    {contentSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleContentSuggestion(suggestion)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-purple-100">
                            {React.createElement(suggestion.icon, { 
                              className: "h-4 w-4 text-purple-600" 
                            })}
                          </div>
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            {suggestion.text}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Context Info */}
                {context && Object.keys(context).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <Settings className="h-4 w-4 mr-2 text-blue-500" />
                      Current Context
                    </h3>
                    <div className="space-y-2 text-sm">
                      {context.energyLevel && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Energy:</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            context.energyLevel === 'high' ? 'bg-[#1E49C9]/20 text-[#1E49C9]' :
                            context.energyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {context.energyLevel}
                          </span>
                        </div>
                      )}
                      {context.mood && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Mood:</span>
                          <span className="text-gray-900 capitalize">{context.mood}</span>
                        </div>
                      )}
                      {context.timeOfDay && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Time:</span>
                          <span className="text-gray-900 capitalize">{context.timeOfDay}</span>
                        </div>
                      )}
                      {context.location && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="text-gray-900 capitalize">{context.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Actions */}
                {actions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-[#1E49C9]" />
                      Recent Actions
                    </h3>
                    <div className="space-y-2">
                      {actions.map((action, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          {React.createElement(getActionIcon(action.type), { 
                            className: `h-4 w-4 ${getActionColor(action.type)}` 
                          })}
                          <span className="text-gray-600">
                            {action.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiChat;
