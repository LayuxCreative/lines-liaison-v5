// @refresh reset
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserStatusType } from "../types";
import { nodeApiService } from "../services/nodeApiService";
import { supabase } from "../services/supabaseClient";

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserStatus: (status: UserStatusType) => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ 
  children: React.ReactNode;
}> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);



  // Initialize auth state
  useEffect(() => {
    console.log('AuthProvider useEffect - initializing auth state');
    let isMounted = true;
    setIsLoading(true);

    // Prevent duplicate initialization in React StrictMode during development
    if (import.meta.env.DEV) {
      const w = window as unknown as { __authInitDone?: boolean };
      if (w.__authInitDone) {
        setIsLoading(false);
        return;
      }
      w.__authInitDone = true;
    }

    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Initializing auth...');
        const currentUser = await nodeApiService.getCurrentUser();
        console.log('AuthContext: getCurrentUser result:', currentUser);
        if (currentUser && isMounted) {
          console.log('AuthContext: Setting user:', currentUser);
          setUser(currentUser);
        } else {
          console.log('AuthContext: No current user found');
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Initialization error:", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          console.log('AuthContext: Setting loading to false');
          setIsLoading(false);
        }
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('AuthContext: Timeout reached, setting loading to false');
      setIsLoading(false);
    }, 10000);

    initializeAuth();

    // Auth state changes are now handled by the Node.js API
    // No need for Supabase auth state listeners

    // Realtime monitoring removed to prevent connection errors

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);



  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      console.log("AuthContext: Attempting login for:", email);
      
      const result = await nodeApiService.signIn(email, password);

      if (result.error) {
        console.error("AuthContext: Login error:", result.error);
        setIsLoading(false);
        return { success: false, error: result.error };
      }

      if (result.data?.user) {
        console.log("AuthContext: Login successful for:", result.data.user.email);
        setUser(result.data.user);
        
        // Log successful login
        console.log('User logged in:', result.data.user.id);
        
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error("AuthContext: Unexpected login error:", error);
      setIsLoading(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        return { success: false, error: "Database connection error. Please try again later." };
      }
      
      return { success: false, error: "Unexpected login error" };
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      console.log("AuthContext: Attempting registration for:", email);
      
      const result = await nodeApiService.signUp(email, password, { full_name: fullName });

      if (result.error) {
        console.error("AuthContext: Registration error:", result.error);
        setIsLoading(false);
        return { success: false, error: result.error };
      }

      if (result.data?.user) {
        console.log("AuthContext: Registration successful for:", result.data.user.email);
        setUser(result.data.user);
        
        // Log successful registration
        console.log('User registered:', result.data.user.id);
        
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Registration failed' };
    } catch (error: unknown) {
      console.error("AuthContext: Unexpected registration error:", error);
      setIsLoading(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        return { success: false, error: "Network connection error. Please check your internet connection." };
      }
      
      return { success: false, error: "Unexpected registration error" };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('AuthContext: Attempting logout');
      setIsLoading(true);
      
      const result = await nodeApiService.signOut();

      if (result.error) {
        console.error('AuthContext: Logout error:', result.error);
        throw new Error(result.error);
      }

      console.log('AuthContext: Logout successful');
      
      // Log logout before clearing user data
      if (user) {
        console.log('User logged out:', user.id);
      }
      
      // Clear user state immediately
      setUser(null);
      
      // Clear any cached data
      if (window.localStorage) {
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.includes('auth')
        );
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // console.log("Logout completed successfully");
    } catch (error) {
      console.error("Logout error:", error);
      
      // Ensure cleanup happens regardless of errors
      setUser(null);
      
      throw error;
    }
  };

  const updateUserStatus = async (status: UserStatusType) => {
    if (user) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ status })
          .eq("id", user.id);

        if (error) {
          console.error("Error updating user status:", error);
          return;
        }

        const updatedUser = { ...user, status };
        setUser(updatedUser);
      } catch (error) {
        console.error("Error updating user status:", error);
      }
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (user) {
      try {
        // Get original user data for comparison
        const originalUser = user;
        
        // Update in database
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id);

        if (error) {
          console.error("Error updating user profile:", error);
          throw error;
        }

        // Update local state
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);

        // Log profile update activity with details of what changed
        try {
          const changedFields: string[] = [];
          const changeDetails: Record<string, { from: unknown; to: unknown }> = {};

          Object.keys(updates).forEach(key => {
            const typedKey = key as keyof User;
            if (originalUser[typedKey] !== updates[typedKey]) {
              changedFields.push(key);
              changeDetails[key] = {
                from: originalUser[typedKey],
                to: updates[typedKey]
              };
            }
          });

          if (changedFields.length > 0) {
            await supabase.from('activities').insert({
              user_id: user.id,
              type: 'profile_update',
              description: `${user.name} updated profile: ${changedFields.join(', ')}`,
              metadata: {
                user_name: user.name,
                user_email: user.email,
                changed_fields: changedFields,
                changes: changeDetails,
                timestamp: new Date().toISOString()
              }
            });
          }
        } catch (activityError) {
          console.warn('Failed to log profile update activity:', activityError);
        }
      } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
      }
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (!user) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('Failed to refresh profile:', error);
        return;
      }

      if (profileData) {
        const updatedUser = {
          ...user,
          name: profileData.full_name || user.name,
          full_name: profileData.full_name || user.full_name,
          role: profileData.role || user.role,
          avatar: profileData.avatar_url || user.avatar, // Map avatar_url to avatar for header components
          avatar_url: profileData.avatar_url || user.avatar_url,
          company: profileData.company || '',
          department: profileData.department || '',
          position: profileData.position || '',
          phone: profileData.phone || '',
          updated_at: profileData.updated_at ? new Date(profileData.updated_at) : user.updated_at,
        };
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
      user,
      login,
      register,
      logout,
      updateUserStatus,
      updateUserProfile,
      refreshUserProfile,
      isLoading,
    }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
