import { supabase, connectionManager } from '../config/unifiedSupabase';
import type { Database } from '../types/database';
import { User, Project, Task } from '../types';

export class UnifiedSupabaseService {
  private static instance: UnifiedSupabaseService;

  static getInstance(): UnifiedSupabaseService {
    if (!UnifiedSupabaseService.instance) {
      UnifiedSupabaseService.instance = new UnifiedSupabaseService();
    }
    return UnifiedSupabaseService.instance;
  }

  // Connection health check
  async checkConnection(): Promise<boolean> {
    return connectionManager.getConnectionStatus();
  }

  // Authentication methods
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string, userData?: Partial<User>) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      throw error;
    }
  }

  // Profile methods
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Project methods
  async getProjects(userId?: string) {
    try {
      let query = supabase.from('projects').select('*');
      
      if (userId) {
        query = query.eq('owner_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get projects error:', error);
      throw error;
    }
  }

  async createProject(project: Database['public']['Tables']['projects']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  }

  async updateProject(projectId: string, updates: Database['public']['Tables']['projects']['Update']) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update project error:', error);
      throw error;
    }
  }

  async deleteProject(projectId: string) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  }

  // Task methods
  async getTasks(projectId?: string) {
    try {
      let query = supabase.from('tasks').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get tasks error:', error);
      throw error;
    }
  }

  async createTask(task: Database['public']['Tables']['tasks']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create task error:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updates: Database['public']['Tables']['tasks']['Update']) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update task error:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Delete task error:', error);
      throw error;
    }
  }

  // Team methods
  async getTeams(userId?: string) {
    try {
      let query = supabase.from('teams').select('*');
      
      if (userId) {
        query = query.eq('owner_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get teams error:', error);
      throw error;
    }
  }

  async createTeam(team: Database['public']['Tables']['teams']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert(team)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create team error:', error);
      throw error;
    }
  }

  // Realtime subscriptions
  subscribeToTable(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe();
  }

  unsubscribeFromChannel(channel: any) {
    return supabase.removeChannel(channel);
  }
}

// Export singleton instance
export const unifiedSupabaseService = UnifiedSupabaseService.getInstance();
export default unifiedSupabaseService;