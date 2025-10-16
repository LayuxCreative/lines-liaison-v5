import { supabase } from '../lib/supabase';
import type { User as AuthUser, RealtimeChannel } from '@supabase/supabase-js';
import type { User as AppUser, PermissionGroup } from '../types';

// Types
export interface ProjectData {
  id?: string;
  name: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface TaskData {
  id?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  project_id?: string;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MessageData {
  id?: string;
  content: string;
  sender_id: string;
  receiver_id?: string;
  project_id?: string;
  created_at?: string;
}

export interface FileData {
  id?: string;
  name: string;
  path: string;
  size?: number;
  type?: string;
  project_id?: string;
  uploaded_by?: string;
  created_at?: string;
}

export interface NotificationData {
  id?: string;
  title: string;
  message: string;
  type?: string;
  user_id: string;
  read?: boolean;
  created_at?: string;
}

export interface ActivityData {
  id?: string;
  // Core columns for public.activities
  action?: string;
  description?: string;
  user_id?: string;
  project_id?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  created_at?: string;
  // Flexible fields used by callers (mapped internally)
  event_type?: string;
  target_id?: string;
  target_type?: string;
  actor_email?: string;
  occurred_at?: string;
}

// Concrete row shape returned by the 'activities' table
interface ActivityRow {
  id: string;
  user_id: string;
  project_id?: string | null;
  action?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp?: string | null;
  created_at?: string | null;
}

export interface RoleData {
  id?: string;
  name: string;
  description?: string;
  permissions?: string[];
  created_at?: string;
}

export interface PermissionGroupData {
  id?: string;
  name: string;
  display_name?: string;
  description?: string;
  permissions?: string[];
  created_at?: string;
  is_active?: boolean;
}

class SupabaseService {
  // Authentication
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string) {
    return await supabase.auth.signUp({ email, password });
  }

  async signOut() {
    return await supabase.auth.signOut();
  }

  /**
   * Change the current authenticated user's password.
   * Verifies the current password by re-authentication, then updates to the new password.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }>{
    // Ensure there is a logged-in user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || !authUser.email) {
      throw new Error('User not authenticated');
    }

    // Re-authenticate using current password to validate
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error('Invalid current password');
    }

    // Update to the new password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      throw new Error(updateError.message || 'Failed to update password');
    }

    return { success: true };
  }

  // Users
  async getUsers(): Promise<{ success: boolean; data?: AppUser[]; error?: unknown }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) return { success: false, error };
    return { success: true, data: data as AppUser[] };
  }

  async getUserById(userId: string): Promise<{ success: boolean; data?: AppUser; error?: unknown }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) return { success: false, error };
    return { success: true, data: data as AppUser };
  }

  async updateUser(userId: string, updates: Record<string, unknown>): Promise<{ success: boolean; data?: AppUser[]; error?: unknown }> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();
    
    if (error) return { success: false, error };
    return { success: true, data: data as AppUser[] };
  }

  async createUser(userData: Record<string, unknown>): Promise<{ success: boolean; data?: AppUser[]; error?: unknown }> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(userData)
      .select();
    
    if (error) return { success: false, error };
    return { success: true, data: data as AppUser[] };
  }

  async deleteUser(userId: string): Promise<{ success: boolean; data?: AppUser[]; error?: unknown }> {
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
      .select();
    
    if (error) return { success: false, error };
    return { success: true, data: data as AppUser[] };
  }

  // Projects
  async getProjects(_userId?: string) {
    // RLS on projects already restricts rows to those accessible by the
    // authenticated user (manager, client, or team_members contains user).
    const { data, error } = await supabase.from('projects').select('*');
    if (error) throw error;
    return { success: true, data };
  }

  async createProject(projectData: ProjectData) {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  async updateProject(id: string, updates: Partial<ProjectData>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  // Tasks
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');
    
    if (error) throw error;
    return { success: true, data };
  }

  async createTask(taskData: TaskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  async updateTask(id: string, updates: Partial<TaskData>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  // Messages
  async getMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  }

  async createMessage(messageData: MessageData) {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  // Files
  async getFiles(projectId?: string) {
    let query = supabase.from('files').select('*');
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  }

  async uploadFile(file: File, projectId?: string) {
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const fileData: FileData = {
      name: file.name,
      path: uploadData.path,
      size: file.size,
      type: file.type,
      ...(projectId && { project_id: projectId }),
    };

    const { data, error } = await supabase
      .from('files')
      .insert(fileData)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  // Notifications
  async getNotifications(userId: string) {
    if (!userId || userId.trim().length === 0) {
      throw new Error('Invalid userId for notifications query');
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  }

  async createNotification(notificationData: NotificationData) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  async markNotificationAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  async markAllNotificationsAsRead(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  async deleteNotification(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) throw error;
    return { success: true, data };
  }

  // Activities
  async getActivities(params?: { userId?: string; limit?: number; offset?: number; event?: string; from?: string; to?: string }) {
    let query = supabase.from('activities').select('*');

    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }
    if (params?.event) {
      // The activities table uses 'action' for event type
      query = query.eq('action', params.event);
    }
    if (params?.from) {
      query = query.gte('timestamp', params.from);
    }
    if (params?.to) {
      query = query.lte('timestamp', params.to);
    }

    query = query.order('timestamp', { ascending: false });

    if (typeof params?.offset === 'number' && typeof params?.limit === 'number') {
      query = query.range(params.offset, params.offset + params.limit - 1);
    } else if (typeof params?.limit === 'number') {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Normalize for consumers expecting event_type/occurred_at/created_at/actor_email
    const rows = (data ?? []) as ActivityRow[];
    const normalized = rows.map((row) => {
      const meta = row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : undefined;
      const actor_email = meta ? (meta['actor_email'] as string | undefined) : undefined;

      return {
        ...row,
        event_type: row.action ?? undefined,
        occurred_at: row.timestamp ?? undefined,
        created_at: row.created_at ?? row.timestamp ?? undefined,
        actor_email
      };
    });

    return { success: true, data: normalized };
  }

  async createActivity(activityData: ActivityData | Record<string, unknown>) {
    const src = (activityData ?? {}) as Partial<ActivityData> & Record<string, unknown> & { metadata?: Record<string, unknown> };

    const meta = src.metadata && typeof src.metadata === 'object' ? (src.metadata as Record<string, unknown>) : undefined;
    const user_id: string | undefined = src.user_id ?? (meta?.['user_id'] as string | undefined);
    const project_id: string | undefined = src.project_id ?? (src.target_type === 'project' ? (src.target_id as string | undefined) : (meta?.['project_id'] as string | undefined));
    const action: string | undefined = src.action ?? (src.event_type as string | undefined);
    const description: string | undefined = src.description ?? (src as { details?: string }).details ?? (meta?.['description'] as string | undefined) ?? (typeof action === 'string' ? action : undefined);
    const timestamp: string | undefined = src.timestamp ?? (src.occurred_at as string | undefined) ?? (meta?.['timestamp'] as string | undefined) ?? new Date().toISOString();
    const metadata: Record<string, unknown> = meta ?? {};

    if (!user_id || !action || !description) {
      throw new Error('Missing required activity fields (user_id, action, description)');
    }

    const insertRow = { user_id, project_id, action, description, metadata, timestamp };

    const { data, error } = await supabase
      .from('activities')
      .insert(insertRow)
      .select();

    if (error) throw error;
    return { success: true, data };
  }

  // Roles
  async getRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('*');
    
    if (error) throw error;
    return { success: true, data };
  }

  async createRole(roleData: RoleData) {
    const { data, error } = await supabase
      .from('roles')
      .insert(roleData)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  async updateRole(id: string, updates: Partial<RoleData>) {
    const { data, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  async deleteRole(roleId: string) {
    const { data, error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);
    
    if (error) throw error;
    return { success: true, data };
  }

  // Permissions
  async getPermissions() {
    const { data, error } = await supabase
      .from('permissions')
      .select('*');
    
    if (error) throw error;
    return { success: true, data };
  }

  async getPermissionGroups(): Promise<{ success: boolean; data?: PermissionGroup[]; error?: unknown }> {
    try {
      const { data, error } = await supabase
        .from('permission_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data as PermissionGroup[] };
    } catch (error) {
      console.error('Error fetching permission groups:', error);
      return { success: false, error };
    }
  }

  async createPermissionGroup(group: Omit<PermissionGroupData, 'id'>): Promise<{ success: boolean; data?: PermissionGroup; error?: unknown }> {
    try {
      const { data, error } = await supabase
        .from('permission_groups')
        .insert(group)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as PermissionGroup };
    } catch (error) {
      console.error('Error creating permission group:', error);
      return { success: false, error };
    }
  }

  async updatePermissionGroup(id: string, updates: Partial<PermissionGroupData>): Promise<{ success: boolean; data?: PermissionGroup; error?: unknown }> {
    try {
      const { data, error } = await supabase
        .from('permission_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as PermissionGroup };
    } catch (error) {
      console.error('Error updating permission group:', error);
      return { success: false, error };
    }
  }

  async deletePermissionGroup(id: string) {
    try {
      const { error } = await supabase
        .from('permission_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting permission group:', error);
      return { success: false, error };
    }
  }

  // Two Factor Authentication
  async toggleTwoFactor(enabled: boolean) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({ two_factor_enabled: enabled })
      .eq('id', user.id)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  // Email Confirmation
  async confirmEmail(token: string, type: 'signup' | 'email_change' | 'recovery') {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as 'signup' | 'email_change' | 'recovery'
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error confirming email:', error);
      return { success: false, error };
    }
  }

  async resendConfirmation(email: string) {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });
    
    if (error) throw error;
    return { success: true, data };
  }

  // Realtime subscriptions
  async subscribeToNotifications(userId: string, callback: (payload: Record<string, unknown>) => void) {
    return supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();
  }

  // Unsubscribe helper to clean up realtime channels safely
  unsubscribe(channel: RealtimeChannel | { unsubscribe?: () => void }) {
    const hasUnsubscribe = (obj: unknown): obj is { unsubscribe: () => void } =>
      !!obj && typeof (obj as { unsubscribe?: () => void }).unsubscribe === 'function';
    try {
      if (hasUnsubscribe(channel)) {
        channel.unsubscribe();
      }
    } catch (error) {
      console.warn('Error unsubscribing from realtime channel:', error);
    }
  }
}

export const supabaseService = new SupabaseService();
export default supabaseService;