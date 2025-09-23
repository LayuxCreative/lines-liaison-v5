// Email Validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password Validation
export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 6) return 'weak';
  
  let score = 0;
  
  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character types
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;
  
  if (score < 3) return 'weak';
  if (score < 5) return 'medium';
  return 'strong';
};

// Phone Validation
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// URL Validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// File Validation
export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const isValidFileSize = (file: File, maxSizeInBytes: number): boolean => {
  return file.size <= maxSizeInBytes;
};

export const validateFile = (
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): { isValid: boolean; error?: string } => {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options;
  
  if (allowedTypes.length > 0 && !isValidFileType(file, allowedTypes)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`
    };
  }
  
  if (!isValidFileSize(file, maxSize)) {
    return {
      isValid: false,
      error: `File size exceeds maximum limit of ${maxSize} bytes`
    };
  }
  
  return { isValid: true };
};

// Form Validation
export const isRequired = (value: any): boolean => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
};

export const minLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

export const maxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

export const isNumeric = (value: string): boolean => {
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
};

export const isInteger = (value: string): boolean => {
  return Number.isInteger(Number(value));
};

export const isPositive = (value: number): boolean => {
  return value > 0;
};

export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

// Date Validation
export const isValidDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

export const isFutureDate = (date: string | Date): boolean => {
  const targetDate = new Date(date);
  const now = new Date();
  return targetDate > now;
};

export const isPastDate = (date: string | Date): boolean => {
  const targetDate = new Date(date);
  const now = new Date();
  return targetDate < now;
};

// Object Validation
export const hasRequiredFields = (obj: Record<string, any>, fields: string[]): boolean => {
  return fields.every(field => isRequired(obj[field]));
};

// Custom Validation Rules
export type ValidationRule<T = any> = {
  validator: (value: T) => boolean;
  message: string;
};

export const createValidator = <T = any>(rules: ValidationRule<T>[]) => {
  return (value: T): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    for (const rule of rules) {
      if (!rule.validator(value)) {
        errors.push(rule.message);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
};

// Common validation rule sets
export const emailRules: ValidationRule<string>[] = [
  {
    validator: isRequired,
    message: 'Email is required'
  },
  {
    validator: isValidEmail,
    message: 'Please enter a valid email address'
  }
];

export const passwordRules: ValidationRule<string>[] = [
  {
    validator: isRequired,
    message: 'Password is required'
  },
  {
    validator: (value: string) => minLength(value, 8),
    message: 'Password must be at least 8 characters long'
  },
  {
    validator: isValidPassword,
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  }
];