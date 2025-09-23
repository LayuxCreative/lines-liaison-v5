import { supabase } from '../../config/database';
import type { Database, Profile, Project, Task, Team } from '../../config/database/types';

// API Response types
export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Base API service class
export class BaseApiService {
  protected async handleRequest<T>(
    request: () => Promise<{ data: T | null; error: any }>
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await request();
      
      if (error) {
        console.error('API Error:', error);
        return {
          data: null,
          error: error.message || 'An error occurred',
          success: false
        };
      }
      
      return {
        data,
        error: null,
        success: true
      };
    } catch (error: any) {
      console.error('Unexpected error:', error);
      return {
        data: null,
        error: error.message || 'An unexpected error occurred',
        success: false
      };
    }
  }

  protected async handlePaginatedRequest<T>(
    request: () => Promise<{ data: T[] | null; error: any; count?: number }>,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<T>> {
    try {
      const { data, error, count } = await request();
      
      if (error) {
        console.error('API Error:', error);
        return {
          data: null,
          error: error.message || 'An error occurred',
          success: false,
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        };
      }
      
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: data || [],
        error: null,
        success: true,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error: any) {
      console.error('Unexpected error:', error);
      return {
        data: null,
        error: error.message || 'An unexpected error occurred',
        success: false,
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    }
  }
}

// Authentication API service
export class AuthApiService extends BaseApiService {
  async signIn(email: string, password: string): Promise<ApiResponse<{ user: any; session: any }>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      return {
        data: data.user && data.session ? { user: data.user, session: data.session } : null,
        error
      };
    });
  }

  async signUp(email: string, password: string, userData?: Record<string, any>): Promise<ApiResponse<{ user: any; session: any }>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      return {
        data: data.user && data.session ? { user: data.user, session: data.session } : null,
        error
      };
    });
  }

  async signOut(): Promise<ApiResponse<void>> {
    return this.handleRequest(async () => {
      const { error } = await supabase.auth.signOut();
      return { data: null, error };
    });
  }

  async getCurrentSession(): Promise<ApiResponse<any>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase.auth.getSession();
      return { data: data.session, error };
    });
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase.auth.getUser();
      return { data: data.user, error };
    });
  }
}

// Profile API service
export class ProfileApiService extends BaseApiService {
  async getProfile(userId: string): Promise<ApiResponse<Profile>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      return { data, error };
    });
  }

  async updateProfile(userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>): Promise<ApiResponse<Profile>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      return { data, error };
    });
  }

  async uploadAvatar(userId: string, file: File): Promise<ApiResponse<string>> {
    return this.handleRequest(async () => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        return { data: null, error: uploadError };
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return { data: data.publicUrl, error: null };
    });
  }
}

// Project API service
export class ProjectApiService extends BaseApiService {
  async getProjects(userId?: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Project>> {
    return this.handlePaginatedRequest(async () => {
      let query = supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('owner_id', userId);
      }

      return await query;
    }, page, limit);
  }

  async getProject(projectId: string): Promise<ApiResponse<Project>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      return { data, error };
    });
  }

  async createProject(project: Database['public']['Tables']['projects']['Insert']): Promise<ApiResponse<Project>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      
      return { data, error };
    });
  }

  async updateProject(projectId: string, updates: Database['public']['Tables']['projects']['Update']): Promise<ApiResponse<Project>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();
      
      return { data, error };
    });
  }

  async deleteProject(projectId: string): Promise<ApiResponse<void>> {
    return this.handleRequest(async () => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      return { data: null, error };
    });
  }
}

// Task API service
export class TaskApiService extends BaseApiService {
  async getTasks(projectId?: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Task>> {
    return this.handlePaginatedRequest(async () => {
      let query = supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      return await query;
    }, page, limit);
  }

  async getTask(taskId: string): Promise<ApiResponse<Task>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      return { data, error };
    });
  }

  async createTask(task: Database['public']['Tables']['tasks']['Insert']): Promise<ApiResponse<Task>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();
      
      return { data, error };
    });
  }

  async updateTask(taskId: string, updates: Database['public']['Tables']['tasks']['Update']): Promise<ApiResponse<Task>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();
      
      return { data, error };
    });
  }

  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    return this.handleRequest(async () => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      return { data: null, error };
    });
  }
}

// Team API service
export class TeamApiService extends BaseApiService {
  async getTeams(userId?: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Team>> {
    return this.handlePaginatedRequest(async () => {
      let query = supabase
        .from('teams')
        .select('*', { count: 'exact' })
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('owner_id', userId);
      }

      return await query;
    }, page, limit);
  }

  async getTeam(teamId: string): Promise<ApiResponse<Team>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
      
      return { data, error };
    });
  }

  async createTeam(team: Database['public']['Tables']['teams']['Insert']): Promise<ApiResponse<Team>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from('teams')
        .insert(team)
        .select()
        .single();
      
      return { data, error };
    });
  }

  async updateTeam(teamId: string, updates: Database['public']['Tables']['teams']['Update']): Promise<ApiResponse<Team>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select()
        .single();
      
      return { data, error };
    });
  }

  async deleteTeam(teamId: string): Promise<ApiResponse<void>> {
    return this.handleRequest(async () => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);
      
      return { data: null, error };
    });
  }
}

// Export service instances
export const authApi = new AuthApiService();
export const profileApi = new ProfileApiService();
export const projectApi = new ProjectApiService();
export const taskApi = new TaskApiService();
export const teamApi = new TeamApiService();

// Export unified API service
export const apiService = {
  auth: authApi,
  profile: profileApi,
  project: projectApi,
  task: taskApi,
  team: teamApi
};

export default apiService;