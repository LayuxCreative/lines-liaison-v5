import React, { useEffect } from "react";
import { motion } from "framer-motion";

interface BackdropBlurProps {
  isOpen: boolean;
  onClose: () => void;
  intensity?: "light" | "medium" | "strong";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable BackdropBlur component with cross-browser support
 * Provides consistent backdrop blur implementation across the application
 */
const BackdropBlur: React.FC<BackdropBlurProps> = ({
  isOpen,
  onClose,
  intensity = "medium",
  className = "",
  children,
}) => {
  // Prevent body scroll when backdrop is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      // Prevent scroll on iOS Safari
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getBlurIntensity = () => {
    switch (intensity) {
      case "light":
        return {
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          background: "rgba(0, 0, 0, 0.1)",
        };
      case "strong":
        return {
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          background: "rgba(0, 0, 0, 0.3)",
        };
      default: // medium
        return {
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          background: "rgba(0, 0, 0, 0.2)",
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`fixed inset-0 z-[9998] cursor-pointer ${className}`}
      style={getBlurIntensity()}
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      aria-label="Close modal"
    >
      {children}
    </motion.div>
  );
};

export default BackdropBlur;
