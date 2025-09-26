import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import { PWAInstall, MobileNav, MobileInstallGuide } from './components/ui';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Journal from './pages/Journal';
import Content from './pages/Content';
import GoalAlignedDay from './pages/GoalAlignedDay';
import Food from './pages/Food';
import AiChat from './pages/AiChat';
import Profile from './pages/Profile';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  
  return children;
};

// Auth-only Route: requires authentication
const AuthOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/overview" replace />;
  }
  
  return children;
};

function App() {
  console.log('🔍 App: Component rendered');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
                        <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'glass-toast',
                style: {
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(28px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(140%)',
                  color: '#E8EEF2',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  duration: 3000,
                  className: 'glass-toast',
                  iconTheme: {
                    primary: '#1E49C9',
                    secondary: '#E8EEF2',
                  },
                },
                error: {
                  duration: 5000,
                  className: 'glass-toast glass-toast-error',
                  iconTheme: {
                    primary: '#FF6B6B',
                    secondary: '#E8EEF2',
                  },
                },
              }}
            />
            
            {/* PWA Install Prompt */}
            <PWAInstall />
            
            {/* Mobile Navigation */}
            <MobileNav />
            
            {/* Mobile Install Guide */}
            <MobileInstallGuide />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              
                
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/overview" replace />} />
                <Route path="overview" element={<Dashboard />} />
                <Route path="finance" element={<Finance />} />
                <Route path="journal" element={<Journal />} />
                <Route path="content" element={<Content />} />
                <Route path="goal-aligned-day" element={<GoalAlignedDay />} />
                <Route path="food" element={<Food />} />
                <Route path="ai-chat" element={<AiChat />} />
                <Route path="profile" element={<Profile />} />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
