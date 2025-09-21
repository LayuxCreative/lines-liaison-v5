import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  useEffect(() => {
    // Ensure proper cleanup on unmount
    return () => {
      if (containerRef.current) {
        // Clear any pending animations
        containerRef.current.style.animation = 'none';
      }
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      <div 
        ref={containerRef}
        className={`flex items-center justify-center ${className}`}
        key="loading-spinner"
      >
        <motion.div
          className={`${sizeClasses[size]} border-2 border-blue-200 border-t-blue-600 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            ease: "linear",
            repeatType: "loop"
          }}
          initial={{ rotate: 0 }}
          exit={{ opacity: 0 }}
        />
      </div>
    </AnimatePresence>
  );
};

export default LoadingSpinner;
