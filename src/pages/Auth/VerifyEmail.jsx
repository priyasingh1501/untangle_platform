import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Header } from '../../components/ui';
import { buildApiUrl } from '../../config';
import axios from 'axios';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, verifying, success, error, expired
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If token is provided in URL, verify immediately
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    setVerificationStatus('verifying');
    try {
      const response = await axios.get(buildApiUrl('/api/auth/verify-email'), {
        params: { token: verificationToken }
      });

      if (response.data.verified) {
        setVerificationStatus('success');
        toast.success('Email verified successfully!');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorCode = error.response?.data?.code;
      if (errorCode === 'INVALID_VERIFICATION_TOKEN') {
        setVerificationStatus('expired');
      } else {
        setVerificationStatus('error');
      }
      toast.error(error.response?.data?.message || 'Verification failed');
    }
  };

  const resendVerification = async () => {
    if (!email) {
      toast.error('Email address is required');
      return;
    }

    setResending(true);
    try {
      await axios.post(buildApiUrl('/api/auth/resend-verification'), { email });
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
            {verificationStatus === 'success' ? (
              <CheckCircle size={40} className="text-green-400" />
            ) : verificationStatus === 'error' || verificationStatus === 'expired' ? (
              <XCircle size={40} className="text-red-400" />
            ) : (
              <Mail size={40} className="text-[#1E49C9]" />
            )}
          </motion.div>
          
          <Header level={2} className="mt-6">
            {verificationStatus === 'success' 
              ? 'Email Verified!' 
              : verificationStatus === 'expired'
              ? 'Verification Link Expired'
              : verificationStatus === 'error'
              ? 'Verification Failed'
              : 'Verify Your Email'}
          </Header>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-sm text-text-secondary"
          >
            {verificationStatus === 'success' 
              ? 'Your email has been verified successfully. Redirecting to login...'
              : verificationStatus === 'expired'
              ? 'This verification link has expired. Please request a new one.'
              : verificationStatus === 'error'
              ? 'There was an error verifying your email. Please try again.'
              : email
              ? `We've sent a verification link to ${email}. Please check your inbox and click the link to verify your account.`
              : 'Please check your email for the verification link.'}
          </motion.p>
        </div>

        {/* Verification Status */}
        {verificationStatus === 'verifying' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mr-3"></div>
              <p className="text-blue-400 text-sm">Verifying your email...</p>
            </div>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-green-400 text-sm text-center">
              ✓ Email verified successfully! You can now log in to your account.
            </p>
          </div>
        )}

        {(verificationStatus === 'error' || verificationStatus === 'expired' || verificationStatus === 'pending') && (
          <div className="space-y-4">
            {email && (
              <div className="bg-background-secondary border border-border-primary rounded-lg p-4">
                <p className="text-text-secondary text-sm text-center mb-4">
                  Didn't receive the email? Check your spam folder or resend the verification link.
                </p>
                <Button
                  onClick={resendVerification}
                  variant="primary"
                  className="w-full"
                  loading={resending}
                  disabled={resending}
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              </div>
            )}

            {token && verificationStatus !== 'pending' && (
              <div className="text-center">
                <p className="text-text-secondary text-sm mb-4">
                  You can also verify your email by clicking the link in the email we sent.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Back to Login */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-[#1E49C9] hover:text-[#1E49C9]/80 transition-colors duration-200"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
