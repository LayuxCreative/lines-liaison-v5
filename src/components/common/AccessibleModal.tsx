import React, { useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { trapFocus, generateA11yId, announceToScreenReader, prefersReducedMotion } from '../../utils/accessibility';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  returnFocus?: React.RefObject<HTMLElement>;
  className?: string;
}

const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  initialFocus,
  returnFocus,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(generateA11yId('modal-title'));
  const descriptionId = useRef(generateA11yId('modal-description'));
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const reducedMotion = prefersReducedMotion();

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus management
      setTimeout(() => {
        if (initialFocus?.current) {
          initialFocus.current.focus();
        } else if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);

      // Announce modal opening to screen readers
      announceToScreenReader(`Modal opened: ${title}`, 'assertive');
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Return focus to previous element
      if (returnFocus?.current) {
        returnFocus.current.focus();
      } else if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, title, initialFocus, returnFocus]);

  // Handle focus trap
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (modalRef.current && event.key === 'Tab') {
      trapFocus(modalRef.current, event.nativeEvent);
    }
  };

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const modalVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: reducedMotion ? 1 : 0.95,
      y: reducedMotion ? 0 : 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.2,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: reducedMotion ? 1 : 0.95,
      y: reducedMotion ? 0 : 20,
      transition: {
        duration: reducedMotion ? 0 : 0.15,
        ease: 'easeIn'
      }
    }
  };

  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: reducedMotion ? 0 : 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: reducedMotion ? 0 : 0.15 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            className={`
              relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden
              bg-white dark:bg-gray-900 rounded-xl shadow-2xl
              border border-gray-200 dark:border-gray-700
              ${className}
            `}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId.current}
            aria-describedby={descriptionId.current}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2
                id={titleId.current}
                className="text-xl font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="
                  p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  dark:focus:ring-offset-gray-900
                  transition-colors
                "
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div
              id={descriptionId.current}
              className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]"
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AccessibleModal;