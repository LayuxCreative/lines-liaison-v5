import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserStatusType } from "../types";
import { supabase, connectionManager } from "../config/unifiedSupabase";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabaseService } from "../services/supabaseService";
import { activityLogger } from "../utils/activityLogger";

interface AuthContextType {
  user: User | null;
  session: Session | null;
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

// Helper function to convert Supabase user to app User type
const convertSupabaseUser = async (
  supabaseUser: SupabaseUser,
  profile?: { full_name?: string; role?: 'admin' | 'project_manager' | 'team_member' | 'client' | 'member'; avatar_url?: string; company?: string; department?: string; position?: string; phone?: string; [key: string]: unknown } | null,
): Promise<User> => {
  // Create basic user object first
  const basicUser: User = {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || "User",
    full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || "User",
    email: supabaseUser.email || '',
    role: 'team_member',
    avatar: supabaseUser.user_metadata?.avatar_url || '',
    avatar_url: supabaseUser.user_metadata?.avatar_url || '',
    company: '',
    department: '',
    position: '',
    phone: '',
    status: "available" as UserStatusType,
    last_seen: undefined,
    preferences: {} as Record<string, unknown>,
    createdAt: new Date(supabaseUser.created_at || new Date().toISOString()),
    created_at: new Date(supabaseUser.created_at || new Date().toISOString()),
    updated_at: undefined,
  };

  // Try to fetch profile data with timeout, but don't block login if it fails
  if (!profile) {
    try {
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      // Set a 3-second timeout for profile fetch
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      );
      
      const result = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);
      
      const { data: profileData, error } = result as { data: Record<string, unknown> | null; error: Error | null };
      
      if (!error && profileData) {
         // Update user with profile data
         basicUser.full_name = (typeof profileData.full_name === 'string' ? profileData.full_name : null) || basicUser.full_name;
         basicUser.name = (typeof profileData.full_name === 'string' ? profileData.full_name : null) || basicUser.name;
         const role = profileData.role;
         if (typeof role === 'string' && ['admin', 'project_manager', 'team_member', 'client', 'member'].includes(role)) {
           basicUser.role = (role === 'member' ? 'team_member' : role as 'admin' | 'project_manager' | 'team_member' | 'client') || basicUser.role;
         }
         basicUser.avatar_url = (typeof profileData.avatar_url === 'string' ? profileData.avatar_url : null) || basicUser.avatar_url;
         basicUser.avatar = (typeof profileData.avatar_url === 'string' ? profileData.avatar_url : null) || basicUser.avatar;
         basicUser.company = (typeof profileData.company === 'string' ? profileData.company : null) || '';
         basicUser.department = (typeof profileData.department === 'string' ? profileData.department : null) || '';
         basicUser.position = (typeof profileData.position === 'string' ? profileData.position : null) || '';
         basicUser.phone = (typeof profileData.phone === 'string' ? profileData.phone : null) || '';
         basicUser.last_seen = (typeof profileData.last_seen === 'string' ? new Date(profileData.last_seen) : undefined);
         basicUser.preferences = (profileData.preferences && typeof profileData.preferences === 'object' ? profileData.preferences as Record<string, unknown> : undefined) || basicUser.preferences;
         basicUser.created_at = (typeof profileData.created_at === 'string' ? new Date(profileData.created_at) : undefined) || basicUser.created_at;
         basicUser.updated_at = (typeof profileData.updated_at === 'string' ? new Date(profileData.updated_at) : undefined);
       }
    } catch (error) {
      console.warn('Profile fetch failed, using basic user data:', error);
      // Continue with basic user data
    }
  } else {
    // Use provided profile data
    basicUser.full_name = profile.full_name || basicUser.full_name;
    basicUser.name = profile.full_name || basicUser.name;
    basicUser.role = (profile.role === 'member' ? 'team_member' : profile.role) || basicUser.role;
    basicUser.avatar_url = profile.avatar_url || basicUser.avatar_url;
    basicUser.avatar = profile.avatar_url || basicUser.avatar;
    basicUser.company = profile.company || '';
    basicUser.department = profile.department || '';
    basicUser.position = profile.position || '';
    basicUser.phone = profile.phone || '';
  }

  return basicUser;
};

export const AuthProvider: React.FC<{ 
  children: React.ReactNode;
}> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);



  // Initialize auth state
  useEffect(() => {
    console.log('AuthProvider useEffect - initializing auth state');
    let isMounted = true;
    setIsLoading(true);

    const initializeAuth = async (retryCount = 0) => {
      try {
        // Initialize connection manager first
        await connectionManager.initialize();

        // Skip token validation - let Supabase handle session management

        // Get current session with extended timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timeout')), 30000)
        );
        
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const { data: { session }, error } = result as { data: { session: Session | null }; error: Error | null };
        
        if (error) {
          console.error("AuthContext: Session error:", error);
          
          // Retry once on timeout or network error
          if (retryCount < 1 && (error.message.includes('timeout') || error.message.includes('network'))) {
            console.log("AuthContext: Retrying session fetch...");
            setTimeout(() => initializeAuth(retryCount + 1), 2000);
            return;
          }
          
          if (isMounted) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        if (session?.user && session.access_token && isMounted) {
          // console.log("AuthContext: Found valid session");
          setSession(session);
          
          // Load user profile
          const profile = await supabaseService.getUserById(session.user.id);
          if (profile) {
            // console.log("AuthContext: User authenticated successfully");
            const convertedUser = await convertSupabaseUser(session.user, profile);
            setUser(convertedUser);
          }
        } else {
          // console.log("AuthContext: No valid session found");
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Initialization error:", error);
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      // console.log("AuthContext: Timeout reached, forcing loading to false");
      setIsLoading(false);
    }, 35000);

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log("AuthContext: Auth state changed:", event, session?.user?.email);
      
      if (event === "SIGNED_OUT" || !session) {
        // console.log("AuthContext: User signed out or no session");
        setSession(null);
        setUser(null);
        setIsLoading(false);
      } else if (event === "SIGNED_IN" && session?.user) {
        // console.log("AuthContext: User signed in");
        setSession(session);
        try {
          const profile = await supabaseService.getUserById(session.user.id);
          const convertedUser = await convertSupabaseUser(session.user, profile);
          setUser(convertedUser);
          // console.log("AuthContext: User profile loaded after sign in");
        } catch (error) {
          console.error("AuthContext: Error loading user profile:", error);
          setUser(null);
        }
        setIsLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        console.log("AuthContext: Token refreshed");
        setSession(session);
        // Keep existing user data, just update session
        if (!user) {
          try {
            const convertedUser = await convertSupabaseUser(session.user);
            setUser(convertedUser);
          } catch (error) {
            console.error("AuthContext: Error loading user profile on refresh:", error);
          }
        }
        setIsLoading(false);
      } else {
        // Handle any other auth events
        setIsLoading(false);
      }
    });

    // Realtime monitoring removed to prevent connection errors

    return () => {
      isMounted = false;
      subscription.unsubscribe();
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
      
      // Test connection first
      try {
        await supabase.from('profiles').select('count').limit(1);
        console.log("AuthContext: Connection test successful");
      } catch (connectionError) {
        console.error("AuthContext: Connection test failed:", connectionError);
        setIsLoading(false);
        return { success: false, error: "خطأ في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت." };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("AuthContext: Supabase auth error:", error);
        setIsLoading(false);
        
        // Handle specific error types
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: "بيانات تسجيل الدخول غير صحيحة" };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: "يرجى تأكيد البريد الإلكتروني أولاً" };
        }
        if (error.message.includes('Too many requests')) {
          return { success: false, error: "محاولات كثيرة، يرجى المحاولة لاحقاً" };
        }
        if (error.message.includes('fetch')) {
          return { success: false, error: "خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً." };
        }
        
        return { success: false, error: error.message || "خطأ في تسجيل الدخول" };
      }

      if (data.user && data.session) {
        console.log("AuthContext: Login successful for:", data.user.email);
        setSession(data.session);
        
        try {
          // Load user profile
          const profile = await supabaseService.getUserById(data.user.id);
          if (profile) {
            const convertedUser = await convertSupabaseUser(data.user, profile);
            setUser(convertedUser);
            console.log("AuthContext: User profile loaded successfully");
            // Log successful login
            await activityLogger.logLogin(data.user.id, 'email');
          } else {
            console.warn("AuthContext: No profile found for user");
            // Create basic user without profile
            const convertedUser = await convertSupabaseUser(data.user, null);
            setUser(convertedUser);
            // Log successful login
            await activityLogger.logLogin(data.user.id, 'email');
          }
        } catch (profileError) {
          console.error("AuthContext: Profile loading error:", profileError);
          // Still set basic user data even if profile fails
          const convertedUser = await convertSupabaseUser(data.user, null);
          setUser(convertedUser);
          // Log successful login
          await activityLogger.logLogin(data.user.id, 'email');
        }
        
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: "لم يتم استلام بيانات المستخدم" };
    } catch (error) {
      console.error("AuthContext: Unexpected login error:", error);
      setIsLoading(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        return { success: false, error: "خطأ في الاتصال بالشبكة. يرجى التحقق من الاتصال بالإنترنت." };
      }
      
      return { success: false, error: "خطأ غير متوقع في تسجيل الدخول" };
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create profile record
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: fullName,
          email: email,
          role: "member",
          department: "LiNES AND LiAiSON",
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      }

      setIsLoading(false);
      return { success: true };
    } catch (error: unknown) {
      console.error("Registration error:", error);
      setIsLoading(false);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // console.log("Starting logout process...");
      setIsLoading(true);
      
      // Log logout before clearing user data
      if (user) {
        await activityLogger.logLogout(user.id);
      }
      
      // Clear user state immediately
      setUser(null);
      
      // Clear any cached data
      if (window.localStorage) {
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.startsWith('supabase') || 
          key.startsWith('sb-') ||
          key.includes('auth') ||
          key.includes('session')
        );
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      if (window.sessionStorage) {
        const keysToRemove = Object.keys(sessionStorage).filter(key => 
          key.startsWith('supabase') || 
          key.startsWith('sb-') ||
          key.includes('auth') ||
          key.includes('session')
        );
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
      }

      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // console.log("Logout completed successfully");
    } catch (error) {
      console.error("Logout error:", error);
      
      // Ensure cleanup happens regardless of errors
      setUser(null);
      setSession(null);
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
          avatar: profileData.avatar_url || user.avatar,
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
      session,
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

// Export hook with consistent naming for Fast Refresh compatibility
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Add displayName for Fast Refresh compatibility
useAuth.displayName = 'useAuth';
