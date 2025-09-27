import React from 'react';
import { motion } from 'framer-motion';

interface LoadingFallbackProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Loading...',
  size = 'medium',
  fullScreen = false
}) => {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  const containerClasses = fullScreen
    ? 'min-h-screen bg-gray-50 flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <motion.div
          className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.p
          className="text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
};

export default LoadingFallback;