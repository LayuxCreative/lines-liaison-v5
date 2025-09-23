import { supabase } from '../database';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Authentication configuration
export const AUTH_CONFIG = {
  storage: {
    key: 'lines-liaison-auth',
    storage: window.localStorage
  },
  session: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  flow: {
    type: 'pkce' as const,
    redirectTo: window.location.origin
  },
  providers: {
    google: {
      enabled: true,
      scopes: 'email profile'
    },
    github: {
      enabled: true,
      scopes: 'user:email'
    }
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  }
} as const;

// Authentication types
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  metadata?: Record<string, any>;
}

export interface SignInData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface ResetPasswordData {
  email: string;
  redirectTo?: string;
}

export interface UpdatePasswordData {
  password: string;
  accessToken: string;
}

export interface UpdateProfileData {
  fullName?: string;
  avatarUrl?: string;
  metadata?: Record<string, any>;
}

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < AUTH_CONFIG.password.minLength) {
    errors.push(`Password must be at least ${AUTH_CONFIG.password.minLength} characters long`);
  }
  
  if (AUTH_CONFIG.password.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (AUTH_CONFIG.password.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (AUTH_CONFIG.password.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (AUTH_CONFIG.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Authentication service class
export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Sign up with email and password
  async signUp(data: SignUpData) {
    const { email, password, fullName, metadata } = data;
    
    // Validate email
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...metadata
        }
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return authData;
  }

  // Sign in with email and password
  async signIn(data: SignInData) {
    const { email, password } = data;
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return authData;
  }

  // Sign in with OAuth provider
  async signInWithProvider(provider: 'google' | 'github') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: AUTH_CONFIG.flow.redirectTo
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
  }

  // Reset password
  async resetPassword(data: ResetPasswordData) {
    const { email, redirectTo } = data;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || AUTH_CONFIG.flow.redirectTo
    });
    
    if (error) {
      throw new Error(error.message);
    }
  }

  // Update password
  async updatePassword(data: UpdatePasswordData) {
    const { password } = data;
    
    // Validate new password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    const { error } = await supabase.auth.updateUser({
      password
    });
    
    if (error) {
      throw new Error(error.message);
    }
  }

  // Update user profile
  async updateProfile(data: UpdateProfileData) {
    const { fullName, avatarUrl, metadata } = data;
    
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        avatar_url: avatarUrl,
        ...metadata
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Get current session
  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session;
  }

  // Refresh session
  async refreshSession() {
    const { error } = await supabase.auth.refreshSession();
    
    if (error) {
      throw new Error(error.message);
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export configuration
export { AUTH_CONFIG as default };