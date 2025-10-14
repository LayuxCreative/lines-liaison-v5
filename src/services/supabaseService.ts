import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

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
  action: string;
  details?: string;
  user_id: string;
  project_id?: string;
  created_at?: string;
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
  description?: string;
  permissions?: string[];
  created_at?: string;
}

class SupabaseService {
  // Authentication
  async getCurrentUser(): Promise<User | null> {
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

  // Users
  async getUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) throw error;
    return { success: true, data };
  }

  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return { success: true, data };
  }

  async updateUser(userId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  async createUser(userData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(userData)
      .select();
    
    if (error) throw error;
    return { success: true, data };
  }

  async deleteUser(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
    return { success: true, data };
  }

  // Projects
  async getProjects(userId?: string) {
    let query = supabase.from('projects').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
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
      project_id: projectId,
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
  async getActivities(params?: { userId?: string }) {
    let query = supabase.from('activities').select('*');
    
    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data };
  }

  async createActivity(activityData: ActivityData) {
    const { data, error } = await supabase
      .from('activities')
      .insert(activityData)
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

  async getPermissionGroups() {
    try {
      const { data, error } = await supabase
        .from('permission_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching permission groups:', error);
      return { success: false, error };
    }
  }

  async createPermissionGroup(group: Omit<PermissionGroupData, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('permission_groups')
        .insert(group)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating permission group:', error);
      return { success: false, error };
    }
  }

  async updatePermissionGroup(id: string, updates: Partial<PermissionGroupData>) {
    try {
      const { data, error } = await supabase
        .from('permission_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
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
}

export const supabaseService = new SupabaseService();
export default supabaseService;