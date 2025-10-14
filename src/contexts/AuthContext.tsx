import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserStatusType } from "../types";
import { supabase, sessionManager } from "../lib/supabase";
import { safeLocalStorage } from "../utils/safeStorage";



interface UserRegistrationData {
  full_name: string;
  company?: string;
  department?: string;
  position?: string;
  phone?: string;
  role?: "admin" | "project_manager" | "team_member" | "client";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresTwoFactor?: boolean }>;
  register: (email: string, password: string, userData: UserRegistrationData) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  updateUserStatus: (status: UserStatusType) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Initializing authentication...');
        
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('AuthContext: Found active session:', session.user.email);
          console.log('🔍 AuthContext: Session user ID:', session.user.id);
          console.log('🔍 AuthContext: Session user metadata:', session.user.user_metadata);
          
          // Fetch user profile from database
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          console.log('🔍 AuthContext: Profile query result:', { userProfile, error });
          
          if (userProfile && !error) {
            console.log('🔍 AuthContext: Setting user profile:', {
              id: userProfile.id,
              email: userProfile.email,
              full_name: userProfile.full_name,
              role: userProfile.role
            });
            setUser(userProfile);
            safeLocalStorage.setItem('user', JSON.stringify(userProfile));
            console.log('AuthContext: User profile loaded successfully');
          } else {
            console.error('AuthContext: Error fetching user profile:', error);
          }
        } else {
          console.log('AuthContext: No active session found');
          safeLocalStorage.removeItem('user');
        }
      } catch (error) {
        console.error('AuthContext: Initialization error:', error);
        safeLocalStorage.removeItem('user');
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event);
      console.log('🔍 AuthContext: Auth state change session:', session?.user?.email, session?.user?.id);
      
      if (session?.user) {
        // Fetch user profile
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        console.log('🔍 AuthContext: Auth state change profile query:', { userProfile, error });
        
        if (userProfile && !error) {
          console.log('🔍 AuthContext: Auth state change setting user:', {
            id: userProfile.id,
            email: userProfile.email,
            full_name: userProfile.full_name,
            role: userProfile.role
          });
          setUser(userProfile);
          safeLocalStorage.setItem('user', JSON.stringify(userProfile));
        }
      } else {
        setUser(null);
        safeLocalStorage.removeItem('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔍 AuthContext: Attempting login for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('🔍 AuthContext: Login response received', { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        hasError: !!error,
        errorMessage: error?.message 
      });
      
      if (error) {
        console.error('❌ AuthContext: Login failed:', error.message);
        
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          return { 
            success: false, 
            error: 'Please confirm your email before logging in. Check your inbox.' 
          };
        }
        
        if (error.message.includes('Invalid login credentials')) {
          return { 
            success: false, 
            error: 'Invalid login credentials. Please check your email and password.' 
          };
        }
        
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ AuthContext: Login successful, user ID:', data.user.id);
        
        // Fetch user profile immediately after successful login
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ AuthContext: Failed to fetch user profile:', profileError.message);
          
          // Check if it's an RLS policy issue (user might not have a profile yet)
          if (profileError.code === 'PGRST116' || profileError.message?.includes('RLS')) {
            console.log('🔍 AuthContext: RLS policy issue, creating basic user profile');
            
            // If profile fetching fails (e.g., due to RLS policies), create a basic profile
            const basicProfile: User = {
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
              role: 'team_member',
              status: 'available' as UserStatusType,
              created_at: new Date(),
              updated_at: new Date()
            };
            
            setUser(basicProfile);
            safeLocalStorage.setItem('user', JSON.stringify(basicProfile));
            return { success: true };
          }
          
          return { success: false, error: 'Failed to load user profile' };
        }
        
        if (profileData) {
          console.log('✅ AuthContext: User profile loaded:', profileData.email);
          setUser(profileData);
          safeLocalStorage.setItem('user', JSON.stringify(profileData));
        }
        
        return { success: true };
      }

      console.error('❌ AuthContext: No user data received');
      return { success: false, error: 'Login failed - no user data' };
    } catch (error) {
      console.error('❌ AuthContext: Unexpected login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: errorMessage };
    } finally {
      console.log('🔍 AuthContext: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, userData: UserRegistrationData) => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Attempting registration...');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('AuthContext: Registration failed:', error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create user profile in database
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            full_name: userData.full_name,
            company: userData.company,
            department: userData.department,
            position: userData.position,
            phone: userData.phone,
            role: userData.role || 'team_member',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (profileError) {
          console.error('AuthContext: Error creating user profile:', profileError);
          return { success: false, error: 'Failed to create user profile' };
        }

        console.log('AuthContext: Registration successful');
        return { success: true, user: userProfile };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced logout function with proper session cleanup
  const logout = async () => {
    try {
      setIsLoading(true)
      
      // Use the enhanced session manager for complete cleanup
      await sessionManager.clearSession()
      
      // Clear user state
      setUser(null)
      
      // Clear any user data from safe storage
      safeLocalStorage.removeItem('user')
      safeLocalStorage.removeItem('userProfile')
      
      // Force reload to clear any cached data
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, clear local state
      setUser(null)
      safeLocalStorage.removeItem('user')
      safeLocalStorage.removeItem('userProfile')
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced session check with validation
  const checkSession = async () => {
    try {
      setIsLoading(true)
      
      // Use enhanced session manager
      const session = await sessionManager.getCurrentSession()
      
      if (session?.user) {
        // Convert Supabase User to our User type
        const userProfile: User = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email || '',
          role: session.user.user_metadata?.role || 'team_member',
          avatar_url: session.user.user_metadata?.avatar_url,
          company: session.user.user_metadata?.company,
          department: session.user.user_metadata?.department,
          position: session.user.user_metadata?.position,
          phone: session.user.user_metadata?.phone,
          status: 'available',
          created_at: new Date(session.user.created_at)
        }
        setUser(userProfile)
        safeLocalStorage.setItem('user', JSON.stringify(userProfile))
      } else {
        setUser(null)
        safeLocalStorage.removeItem('user')
      }
    } catch (error) {
      console.error('Session check error:', error)
      setUser(null)
      safeLocalStorage.removeItem('user')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial session check
    checkSession()

    // Enhanced auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userProfile: User = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email || '',
            role: session.user.user_metadata?.role || 'team_member',
            avatar_url: session.user.user_metadata?.avatar_url,
            company: session.user.user_metadata?.company,
            department: session.user.user_metadata?.department,
            position: session.user.user_metadata?.position,
            phone: session.user.user_metadata?.phone,
            status: 'available',
            created_at: new Date(session.user.created_at)
          }
          setUser(userProfile)
          safeLocalStorage.setItem('user', JSON.stringify(userProfile))
        } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
          setUser(null)
          safeLocalStorage.removeItem('user')
          safeLocalStorage.removeItem('userProfile')
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const userProfile: User = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email || '',
            role: session.user.user_metadata?.role || 'team_member',
            avatar_url: session.user.user_metadata?.avatar_url,
            company: session.user.user_metadata?.company,
            department: session.user.user_metadata?.department,
            position: session.user.user_metadata?.position,
            phone: session.user.user_metadata?.phone,
            status: 'available',
            created_at: new Date(session.user.created_at)
          }
          setUser(userProfile)
          safeLocalStorage.setItem('user', JSON.stringify(userProfile))
        }
        
        setIsLoading(false)
      }
    )

    // Periodic session validation (every 5 minutes)
    const sessionCheckInterval = setInterval(async () => {
      const session = await sessionManager.getCurrentSession()
      if (!session && user) {
        console.warn('Session expired, logging out user')
        await logout()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      subscription.unsubscribe()
      clearInterval(sessionCheckInterval)
    }
  }, [])

  const updateUserStatus = async (status: UserStatusType) => {
    console.log('🔄 updateUserStatus called with status:', status);
    if (user) {
      try {
        console.log('📤 Updating status in database for user:', user.id);
        const { error } = await supabase
          .from('profiles')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (error) {
          console.error("❌ Error updating user status:", error);
          return;
        }

        console.log('✅ Status updated successfully in database');
        setUser({ ...user, status });
        safeLocalStorage.setItem('user', JSON.stringify({ ...user, status }));
        console.log('✅ Local state and storage updated');
      } catch (error) {
        console.error("❌ Error updating user status:", error);
      }
    } else {
      console.log('❌ No user found, cannot update status');
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating user profile:", error);
          return;
        }

        setUser(data);
        safeLocalStorage.setItem('user', JSON.stringify(data));
      } catch (error) {
        console.error("Error updating user profile:", error);
      }
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error refreshing user profile:", error);
          return;
        }

        setUser(data);
        safeLocalStorage.setItem('user', JSON.stringify(data));
      } catch (error) {
        console.error("Error refreshing user profile:", error);
      }
    }
  };

  // Debug function to clear all auth data
  const clearAuthData = () => {
    console.log('🔍 AuthContext: Clearing all auth data for debugging');
    setUser(null);
    safeLocalStorage.removeItem('user');
    supabase.auth.signOut();
  };

  // Add to window for debugging
  if (typeof window !== 'undefined') {
    (window as typeof window & { clearAuthData: () => void }).clearAuthData = clearAuthData;
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateUserStatus,
    updateUserProfile,
    refreshUserProfile,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
