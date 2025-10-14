import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

const EmailConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const confirmEmail = async (token: string, type: string) => {
    try {
      const validType = type as 'signup' | 'email_change' | 'recovery';
      const response = await supabaseService.confirmEmail(token, validType);
      if (response.success) {
        setStatus('success');
        setMessage('Email confirmed successfully! You can now log in.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(typeof response.error === 'string' ? response.error : 'Failed to confirm email');
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred while confirming email');
    }
  };

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type') || 'signup';
    const emailParam = searchParams.get('email');

    if (emailParam) {
      setEmail(emailParam);
    }

    if (token) {
      confirmEmail(token, type);
    } else {
      setStatus('resend');
      setMessage('Confirmation code not found. Please resend confirmation email.');
    }
  }, [searchParams, navigate]);

  const handleResendConfirmation = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      const response = await supabaseService.resendConfirmation(email);
      if (response.success) {
        setMessage('Confirmation email sent successfully! Please check your inbox.');
      } else {
        setMessage('Failed to send confirmation email');
      }
    } catch {
      setMessage('An error occurred while sending confirmation email');
    } finally {
      setIsResending(false);
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'resend':
        return <Mail className="w-16 h-16 text-blue-500" />;
      default:
        return <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'success':
        return 'Successfully confirmed!';
      case 'error':
        return 'Confirmation failed';
      case 'resend':
        return 'Resend confirmation email';
      default:
        return 'Confirming...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          {getIcon()}
        </motion.div>

        <h1 className="text-2xl font-bold text-white mb-4">
          {getTitle()}
        </h1>

        <p className="text-gray-300 mb-6">
          {message}
        </p>

        {status === 'resend' && (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleResendConfirmation}
              disabled={isResending || !email}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Resend confirmation email
                </>
              )}
            </button>
          </div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-gray-400"
          >
            You will be redirected to the login page in 3 seconds...
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => navigate('/login')}
          className="mt-6 text-blue-400 hover:text-blue-300 transition-colors"
        >
          Back to login
        </motion.button>
      </motion.div>
    </div>
  );
};

export default EmailConfirmation;