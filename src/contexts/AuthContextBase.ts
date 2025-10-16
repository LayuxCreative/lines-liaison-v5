import { createContext } from 'react';
import type { User, UserStatusType } from '../types';

export interface UserRegistrationData {
  full_name: string;
  company?: string;
  department?: string;
  position?: string;
  phone?: string;
  role?: 'admin' | 'project_manager' | 'team_member' | 'client';
}

export interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; requiresTwoFactor?: boolean }>;
  register: (
    email: string,
    password: string,
    userData: UserRegistrationData
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  updateUserStatus: (status: UserStatusType) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);