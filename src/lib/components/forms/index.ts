// Form Components - Input handling and validation
import React from 'react';

// Form Types
export interface FormProps {
  children: React.ReactNode;
  onSubmit: (data: Record<string, any>) => void;
  validation?: ValidationSchema;
  className?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

// Field Types
export interface FieldProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface TextareaProps extends Omit<FieldProps, 'type'> {
  rows?: number;
  maxLength?: number;
}

export interface SelectProps extends Omit<FieldProps, 'type'> {
  options: SelectOption[];
  multiple?: boolean;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface CheckboxProps extends Omit<FieldProps, 'type'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export interface RadioProps extends Omit<FieldProps, 'type'> {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
}

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// File Upload Types
export interface FileUploadProps {
  name: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  onUpload?: (files: File[]) => void;
  className?: string;
}

// Form Group Types
export interface FormGroupProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

// Form utilities
export const validateField = (value: any, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return rule.message;
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return rule.message;
        }
        break;
      case 'minLength':
        if (value && value.length < rule.value) {
          return rule.message;
        }
        break;
      case 'maxLength':
        if (value && value.length > rule.value) {
          return rule.message;
        }
        break;
      case 'pattern':
        if (value && !rule.value.test(value)) {
          return rule.message;
        }
        break;
      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return rule.message;
        }
        break;
    }
  }
  return null;
};

export const validateForm = (data: Record<string, any>, schema: ValidationSchema): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  for (const [fieldName, rules] of Object.entries(schema)) {
    const error = validateField(data[fieldName], rules);
    if (error) {
      errors[fieldName] = error;
    }
  }
  
  return errors;
};

// Form field classes
export const getFieldClasses = (error?: string, disabled?: boolean) => {
  return `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;
};

export const getLabelClasses = (required?: boolean) => {
  return `block text-sm font-medium text-gray-700 mb-1 ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''}`;
};

export const getErrorClasses = () => {
  return 'mt-1 text-sm text-red-600';
};

export const getFormGroupClasses = (className?: string) => {
  return `mb-4 ${className || ''}`;
};

// File upload utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFileType = (file: File, accept: string): boolean => {
  if (!accept) return true;
  const acceptedTypes = accept.split(',').map(type => type.trim());
  return acceptedTypes.some(type => {
    if (type.startsWith('.')) {
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    }
    return file.type.match(type.replace('*', '.*'));
  });
};

export const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

// Form constants
export const FORM_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_IMAGE_TYPES: 'image/jpeg,image/png,image/gif,image/webp',
  ACCEPTED_DOCUMENT_TYPES: '.pdf,.doc,.docx,.txt',
  VALIDATION_MESSAGES: {
    REQUIRED: 'This field is required',
    EMAIL: 'Please enter a valid email address',
    MIN_LENGTH: 'Minimum length is {min} characters',
    MAX_LENGTH: 'Maximum length is {max} characters',
    FILE_SIZE: 'File size must be less than {size}',
    FILE_TYPE: 'File type not supported'
  }
};