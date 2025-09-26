import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, Header, Section } from '../../components/ui';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // Redirect to dashboard
        navigate('/');
      } else {
        // Handle login failure - show error message
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex">
      {/* Left Half - Login Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-20 h-20 bg-gradient-to-r from-accent-yellow via-[#1E49C9] to-[#1E49C9] rounded-2xl flex items-center justify-center shadow-lg"
          >
            <span className="text-text-inverse font-bold text-3xl">U</span>
          </motion.div>
          
          <Header level={2} className="mt-6">
            Welcome to Untangle
          </Header>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-sm text-text-secondary"
          >
            Sign in to manage your lifestyle
          </motion.p>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
        >
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
          
          <div className="space-y-5">
            {/* Email Field */}
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              icon={<Mail size={20} className="text-text-muted" />}
            />

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-text-muted" />
                </div>
                <motion.input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="bg-background-secondary border border-border-primary text-text-primary placeholder:text-text-muted px-4 py-3 pl-10 pr-12 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1E49C9]/50 focus:border-[#1E49C9] hover:border-border-secondary w-full"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                />
                {/* Password Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors z-20 pointer-events-auto"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Remember me and Forgot password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#1E49C9] focus:ring-accent-green border-border-primary rounded bg-background-secondary focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button 
                type="button"
                className="font-medium text-[#1E49C9] hover:text-[#1E49C9]/80 transition-colors duration-200"
                onClick={() => {/* TODO: Implement forgot password */}}
              >
                Forgot your password?
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-[#1E49C9] hover:text-[#1E49C9]/80 transition-colors duration-200"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </motion.form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-xs text-text-muted">
            By signing in, you agree to our{' '}
            <button 
              type="button"
              className="text-[#1E49C9] hover:text-[#1E49C9]/80"
              onClick={() => {/* TODO: Implement Terms of Service */}}
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button 
              type="button"
              className="text-[#1E49C9] hover:text-[#1E49C9]/80"
              onClick={() => {/* TODO: Implement Privacy Policy */}}
            >
              Privacy Policy
            </button>
          </p>
        </motion.div>
      </motion.div>
      </div>

      {/* Right Half - Masonry Video Cards */}
      <div className="hidden lg:flex lg:flex-1 relative bg-background-primary p-6 overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E49C9]/5 via-[#1E49C9]/5 to-accent-yellow/5"></div>
        
        {/* Masonry Grid Container - 50% width and height, centered */}
        <div className="relative w-1/2 h-1/2 mx-auto my-auto columns-2 gap-3 space-y-3">
          {/* Video Card 1 - Extra Large */}
          <div className="break-inside-avoid mb-3">
            <div className="relative group rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:rotate-1">
              <video
                className="w-full h-80 object-cover"
                autoPlay
                muted
                loop
                playsInline
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallbackDiv = e.target.parentElement.querySelector('.video-fallback');
                  if (fallbackDiv) {
                    fallbackDiv.style.display = 'flex';
                  }
                }}
              >
                <source src="/videos/welcome-video.mp4" type="video/mp4" />
              </video>
              <div className="video-fallback hidden absolute inset-0 bg-gradient-to-br from-[#1E49C9] via-[#1E49C9] to-accent-yellow items-center justify-center">
                <div className="text-center text-text-inverse">
                  <div className="w-20 h-20 bg-text-inverse/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold">U</span>
                  </div>
                  <h3 className="text-xl font-bold">Welcome</h3>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-6 left-6 text-text-inverse opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                <h3 className="font-bold text-xl">Welcome to Untangle</h3>
                <p className="text-sm opacity-90 mt-1">Your lifestyle journey starts here</p>
              </div>
            </div>
          </div>

          {/* Video Card 2 - Small */}
          <div className="break-inside-avoid mb-3">
            <div className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-400 transform hover:scale-110 hover:-rotate-1">
              <video
                className="w-full h-32 object-cover"
                autoPlay
                muted
                loop
                playsInline
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallbackDiv = e.target.parentElement.querySelector('.video-fallback');
                  if (fallbackDiv) {
                    fallbackDiv.style.display = 'flex';
                  }
                }}
              >
                <source src="/videos/join-community.mp4" type="video/mp4" />
              </video>
              <div className="hidden absolute inset-0 bg-gradient-to-br from-accent-yellow via-[#1E49C9] to-[#1E49C9] items-center justify-center">
                <div className="text-center text-text-inverse">
                  <div className="w-8 h-8 bg-text-inverse/20 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-sm font-bold">U</span>
                  </div>
                  <h3 className="text-xs font-bold">Join</h3>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
              <div className="absolute bottom-2 left-2 text-text-inverse opacity-0 group-hover:opacity-100 transition-all duration-400 transform translate-y-2 group-hover:translate-y-0">
                <h3 className="font-bold text-xs">Join Us</h3>
                <p className="text-xs opacity-90">Connect</p>
              </div>
            </div>
          </div>

          {/* Video Card 3 - Medium */}
          <div className="break-inside-avoid mb-3">
            <div className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-450 transform hover:scale-105 hover:rotate-0.5">
              <video
                className="w-full h-48 object-cover"
                autoPlay
                muted
                loop
                playsInline
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallbackDiv = e.target.parentElement.querySelector('.video-fallback');
                  if (fallbackDiv) {
                    fallbackDiv.style.display = 'flex';
                  }
                }}
              >
                <source src="/videos/start-journey.mp4" type="video/mp4" />
              </video>
              <div className="hidden absolute inset-0 bg-gradient-to-br from-[#1E49C9] via-accent-yellow to-[#1E49C9] items-center justify-center">
                <div className="text-center text-text-inverse">
                  <div className="w-12 h-12 bg-text-inverse/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-bold">U</span>
                  </div>
                  <h3 className="text-sm font-bold">Start</h3>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-450"></div>
              <div className="absolute bottom-3 left-3 text-text-inverse opacity-0 group-hover:opacity-100 transition-all duration-450 transform translate-y-3 group-hover:translate-y-0">
                <h3 className="font-bold text-sm">Start Today</h3>
                <p className="text-xs opacity-90">Take action</p>
              </div>
            </div>
          </div>

          {/* Video Card 4 - Large */}
          <div className="break-inside-avoid mb-3">
            <div className="relative group rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-rotate-0.5">
              <video
                className="w-full h-64 object-cover"
                autoPlay
                muted
                loop
                playsInline
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallbackDiv = e.target.parentElement.querySelector('.video-fallback');
                  if (fallbackDiv) {
                    fallbackDiv.style.display = 'flex';
                  }
                }}
              >
                <source src="/videos/transform-life.mp4" type="video/mp4" />
              </video>
              <div className="video-fallback hidden absolute inset-0 bg-gradient-to-br from-[#1E49C9] via-[#1E49C9] to-accent-yellow items-center justify-center">
                <div className="text-center text-text-inverse">
                  <div className="w-16 h-16 bg-text-inverse/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold">U</span>
                  </div>
                  <h3 className="text-lg font-bold">Transform</h3>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-4 left-4 text-text-inverse opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                <h3 className="font-bold text-lg">Transform Life</h3>
                <p className="text-sm opacity-90">Positive changes</p>
              </div>
            </div>
          </div>

          {/* Video Card 5 - Extra Small */}
          <div className="break-inside-avoid mb-3">
            <div className="relative group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-110 hover:rotate-2">
              <video
                className="w-full h-28 object-cover"
                autoPlay
                muted
                loop
                playsInline
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallbackDiv = e.target.parentElement.querySelector('.video-fallback');
                  if (fallbackDiv) {
                    fallbackDiv.style.display = 'flex';
                  }
                }}
              >
                <source src="/videos/grow-daily.mp4" type="video/mp4" />
              </video>
              <div className="hidden absolute inset-0 bg-gradient-to-br from-accent-yellow via-[#1E49C9] to-[#1E49C9] items-center justify-center">
                <div className="text-center text-text-inverse">
                  <div className="w-6 h-6 bg-text-inverse/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-xs font-bold">U</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-1 left-1 text-text-inverse opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                <h3 className="font-bold text-xs">Grow</h3>
              </div>
            </div>
          </div>

          {/* Video Card 6 - Medium */}
          <div className="break-inside-avoid mb-3">
            <div className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-400 transform hover:scale-105 hover:-rotate-1">
              <video
                className="w-full h-52 object-cover"
                autoPlay
                muted
                loop
                playsInline
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallbackDiv = e.target.parentElement.querySelector('.video-fallback');
                  if (fallbackDiv) {
                    fallbackDiv.style.display = 'flex';
                  }
                }}
              >
                <source src="/videos/achieve-goals.mp4" type="video/mp4" />
              </video>
              <div className="hidden absolute inset-0 bg-gradient-to-br from-[#1E49C9] via-accent-yellow to-[#1E49C9] items-center justify-center">
                <div className="text-center text-text-inverse">
                  <div className="w-14 h-14 bg-text-inverse/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold">U</span>
                  </div>
                  <h3 className="text-sm font-bold">Achieve</h3>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
              <div className="absolute bottom-3 left-3 text-text-inverse opacity-0 group-hover:opacity-100 transition-all duration-400 transform translate-y-3 group-hover:translate-y-0">
                <h3 className="font-bold text-sm">Achieve Goals</h3>
                <p className="text-xs opacity-90">Success awaits</p>
              </div>
            </div>
          </div>

          {/* Video Card 7 - Small */}
          <div className="break-inside-avoid mb-3">
            <div className="relative group rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-350 transform hover:scale-110 hover:rotate-1">
              <video
                className="w-full h-36 object-cover"
                autoPlay
                muted
                loop
                playsInline
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallbackDiv = e.target.parentElement.querySelector('.video-fallback');
                  if (fallbackDiv) {
                    fallbackDiv.style.display = 'flex';
                  }
                }}
              >
                <source src="/videos/learn-more.mp4" type="video/mp4" />
              </video>
              <div className="video-fallback hidden absolute inset-0 bg-gradient-to-br from-[#1E49C9] via-[#1E49C9] to-accent-yellow items-center justify-center">
                <div className="text-center text-text-inverse">
                  <div className="w-10 h-10 bg-text-inverse/20 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-lg font-bold">U</span>
                  </div>
                  <h3 className="text-xs font-bold">Learn</h3>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-350"></div>
              <div className="absolute bottom-2 left-2 text-text-inverse opacity-0 group-hover:opacity-100 transition-all duration-350 transform translate-y-2 group-hover:translate-y-0">
                <h3 className="font-bold text-xs">Learn More</h3>
                <p className="text-xs opacity-90">Grow</p>
              </div>
            </div>
          </div>

          {/* Video Card 8 - Large */}
          <div className="break-inside-avoid mb-3">
            <div className="relative group rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:rotate-0.5">
              <video
                className="w-full h-72 object-cover"
                autoPlay
                muted
                loop
                playsInline
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallbackDiv = e.target.parentElement.querySelector('.video-fallback');
                  if (fallbackDiv) {
                    fallbackDiv.style.display = 'flex';
                  }
                }}
              >
                <source src="/videos/succeed-together.mp4" type="video/mp4" />
              </video>
              <div className="hidden absolute inset-0 bg-gradient-to-br from-accent-yellow via-[#1E49C9] to-[#1E49C9] items-center justify-center">
                <div className="text-center text-text-inverse">
                  <div className="w-18 h-18 bg-text-inverse/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold">U</span>
                  </div>
                  <h3 className="text-lg font-bold">Succeed</h3>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-5 left-5 text-text-inverse opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-5 group-hover:translate-y-0">
                <h3 className="font-bold text-lg">Succeed Together</h3>
                <p className="text-sm opacity-90">Achieve greatness</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
