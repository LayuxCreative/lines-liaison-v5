import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to login if user is already logged out
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl"
      >
        <div className="text-center">
          {/* Logout Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-6"
          >
            <LogOut className="w-8 h-8 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-4"
          >
            Logged Out Successfully
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-300 mb-8 leading-relaxed"
          >
            You have been successfully logged out of your account. Thank you for using Lines Liaison!
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            {/* Login Button */}
            <button
              onClick={handleBackToLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Login
            </button>

            {/* Home Button */}
            <button
              onClick={handleBackToHome}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 border border-white/20 hover:border-white/40 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Go to Home
            </button>
          </motion.div>

          {/* Auto redirect message */}
          {!user && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sm text-gray-400 mt-6"
            >
              Redirecting to login page in a few seconds...
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Logout;