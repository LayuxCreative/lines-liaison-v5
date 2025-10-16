// UI Components - Reusable interface elements
import type { ReactNode } from 'react';

// Button Component Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

// Input Component Types
export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
}

// Modal Component Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Card Component Types
export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

// Badge Component Types
export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

// UI Component utilities
export const getButtonClasses = (variant: string, size: string, disabled: boolean) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return `${baseClasses} ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClasses[size as keyof typeof sizeClasses]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
};

export const getInputClasses = (error?: string, disabled?: boolean) => {
  return `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;
};

export const getModalSizeClasses = (size: string) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  return sizeClasses[size as keyof typeof sizeClasses];
};

export const getCardClasses = (padding: string) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  return `bg-white rounded-lg shadow-md border border-gray-200 ${paddingClasses[padding as keyof typeof paddingClasses]}`;
};

export const getBadgeClasses = (variant: string, size: string) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return `inline-flex items-center font-medium rounded-full ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClasses[size as keyof typeof sizeClasses]}`;
};