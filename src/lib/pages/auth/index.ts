// Authentication Pages - Organized auth page types and utilities

// Auth page types
export interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  loading?: boolean;
  error?: string;
  redirectTo?: string;
}

export interface RegisterPageProps {
  onRegister: (userData: RegisterData) => Promise<void>;
  loading?: boolean;
  error?: string;
  redirectTo?: string;
}

export interface ForgotPasswordPageProps {
  onResetPassword: (email: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: boolean;
}

export interface ResetPasswordPageProps {
  onResetPassword: (password: string, token: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  token?: string;
}

export interface VerifyEmailPageProps {
  onVerifyEmail: (token: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: boolean;
  token?: string;
}

// Auth form data types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

// Auth validation schemas
export interface AuthValidationSchema {
  email: {
    required: boolean;
    pattern: RegExp;
    message: string;
  };
  password: {
    required: boolean;
    minLength: number;
    pattern?: RegExp;
    message: string;
  };
  confirmPassword?: {
    required: boolean;
    match: string;
    message: string;
  };
  firstName?: {
    required: boolean;
    minLength: number;
    message: string;
  };
  lastName?: {
    required: boolean;
    minLength: number;
    message: string;
  };
}

// Auth page utilities
export const getAuthPageClasses = (variant: 'login' | 'register' | 'forgot' | 'reset' | 'verify') => {
  const baseClasses = 'min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900';
  
  const variants = {
    login: 'bg-opacity-90',
    register: 'bg-opacity-95',
    forgot: 'bg-opacity-85',
    reset: 'bg-opacity-85',
    verify: 'bg-opacity-80'
  };
  
  return `${baseClasses} ${variants[variant]}`;
};

export const getAuthFormClasses = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const baseClasses = 'bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8';
  
  const sizes = {
    sm: 'w-full max-w-sm',
    md: 'w-full max-w-md',
    lg: 'w-full max-w-lg'
  };
  
  return `${baseClasses} ${sizes[size]}`;
};

export const getAuthInputClasses = (hasError: boolean = false) => {
  const baseClasses = 'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200';
  const errorClasses = 'border-red-400 focus:ring-red-400';
  const normalClasses = 'focus:ring-blue-400';
  
  return `${baseClasses} ${hasError ? errorClasses : normalClasses}`;
};

export const getAuthButtonClasses = (variant: 'primary' | 'secondary' | 'google' | 'github' = 'primary') => {
  const baseClasses = 'w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    google: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
    github: 'bg-gray-900 hover:bg-gray-800 text-white'
  };
  
  return `${baseClasses} ${variants[variant]}`;
};

// Auth validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export const validatePasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  else feedback.push('Password must be at least 8 characters');
  
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Include lowercase letters');
  
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Include uppercase letters');
  
  if (/\d/.test(password)) score++;
  else feedback.push('Include numbers');
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('Include special characters');
  
  return { score, feedback };
};

export const validateConfirmPassword = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

// Auth form helpers
export const formatAuthError = (error: string): string => {
  const errorMap: Record<string, string> = {
    'invalid_credentials': 'Invalid email or password',
    'email_not_verified': 'Please verify your email address',
    'account_locked': 'Account temporarily locked. Try again later',
    'weak_password': 'Password is too weak',
    'email_already_exists': 'An account with this email already exists',
    'invalid_token': 'Invalid or expired token',
    'network_error': 'Network error. Please check your connection'
  };
  
  return errorMap[error] || 'An unexpected error occurred';
};

export const getAuthRedirectPath = (userRole: string, defaultPath: string = '/dashboard'): string => {
  const rolePaths: Record<string, string> = {
    admin: '/dashboard/admin',
    manager: '/dashboard/manager',
    user: '/dashboard',
    client: '/dashboard/client'
  };
  
  return rolePaths[userRole] || defaultPath;
};

// Auth constants
export const AUTH_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  REMEMBER_ME_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SOCIAL_PROVIDERS: ['google', 'github', 'microsoft'] as const
};

// Auth page metadata
export interface AuthPageMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
}

export const AUTH_PAGE_METADATA: Record<string, AuthPageMetadata> = {
  login: {
    title: 'Login - Lines Liaison',
    description: 'Sign in to your Lines Liaison account',
    keywords: ['login', 'sign in', 'authentication'],
    ogTitle: 'Login to Lines Liaison',
    ogDescription: 'Access your project management dashboard'
  },
  register: {
    title: 'Register - Lines Liaison',
    description: 'Create your Lines Liaison account',
    keywords: ['register', 'sign up', 'create account'],
    ogTitle: 'Join Lines Liaison',
    ogDescription: 'Start managing your projects today'
  },
  forgot: {
    title: 'Forgot Password - Lines Liaison',
    description: 'Reset your Lines Liaison password',
    keywords: ['forgot password', 'reset password', 'recovery']
  },
  reset: {
    title: 'Reset Password - Lines Liaison',
    description: 'Set your new password',
    keywords: ['reset password', 'new password']
  },
  verify: {
    title: 'Verify Email - Lines Liaison',
    description: 'Verify your email address',
    keywords: ['verify email', 'email verification']
  }
};