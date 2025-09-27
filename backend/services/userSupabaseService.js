const { createClient } = require('@supabase/supabase-js');

/**
 * User-specific Supabase service that uses JWT for RLS
 */
class UserSupabaseService {
  
  /**
   * Get projects for a user using their JWT
   */
  static async getProjects(userSupabase, userId) {
    try {
      const { data, error } = await userSupabase
        .from('projects')
        .select('*')
        .or(`client_id.eq.${userId},manager_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Get projects error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Get projects error:', error);
      throw error;
    }
  }
  
  /**
   * Create project using user's JWT
   */
  static async createProject(userSupabase, projectData) {
    try {
      const { data, error } = await userSupabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();
      
      if (error) {
        console.error('Create project error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  }
  
  /**
   * Get tasks for a project using user's JWT
   */
  static async getTasks(userSupabase, projectId) {
    try {
      const { data, error } = await userSupabase
        .from('tasks')
        .select(`
          *,
          projects!project_id (
            name
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Get tasks error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Get tasks error:', error);
      throw error;
    }
  }
  
  /**
   * Get tasks by assignee using user's JWT
   */
  static async getTasksByAssignee(userSupabase, assigneeId) {
    try {
      const { data, error } = await userSupabase
        .from('tasks')
        .select(`
          *,
          projects!project_id (
            name
          )
        `)
        .eq('assignee_id', assigneeId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Get tasks by assignee error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Get tasks by assignee error:', error);
      throw error;
    }
  }
  
  /**
   * Get all tasks accessible to user (based on RLS)
   */
  static async getAllTasks(userSupabase) {
    try {
      const { data, error } = await userSupabase
        .from('tasks')
        .select(`
          *,
          projects!project_id (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Get all tasks error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Get all tasks error:', error);
      throw error;
    }
  }
  
  /**
   * Create task using user's JWT
   */
  static async createTask(userSupabase, taskData) {
    try {
      const { data, error } = await userSupabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();
      
      if (error) {
        console.error('Create task error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Create task error:', error);
      throw error;
    }
  }
  
  /**
   * Get messages for a project using user's JWT
   */
  static async getMessages(userSupabase, projectId) {
    try {
      const { data, error } = await userSupabase
        .from('messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Get messages error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  }
  
  /**
   * Get all messages accessible to user (based on RLS)
   */
  static async getAllMessages(userSupabase) {
    try {
      const { data, error } = await userSupabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Get all messages error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Get all messages error:', error);
      throw error;
    }
  }
  
  /**
   * Create message using user's JWT
   */
  static async createMessage(userSupabase, messageData) {
    try {
      const { data, error } = await userSupabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();
      
      if (error) {
        console.error('Create message error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Create message error:', error);
      throw error;
    }
  }
  
  /**
   * Get files for a project using user's JWT
   */
  static async getFiles(userSupabase, projectId) {
    try {
      const { data, error } = await userSupabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Get files error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Get files error:', error);
      throw error;
    }
  }
  
  /**
   * Upload file using user's JWT
   */
  static async uploadFile(userSupabase, fileData) {
    try {
      const { data, error } = await userSupabase
        .from('files')
        .insert([fileData])
        .select()
        .single();
      
      if (error) {
        console.error('Upload file error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }
  
  /**
   * Get user profile using user's JWT
   */
  static async getProfile(userSupabase, userId) {
    try {
      const { data, error } = await userSupabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Get profile error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }
  
  /**
   * Update user profile using user's JWT
   */
  static async updateProfile(userSupabase, userId, updates) {
    try {
      const { data, error } = await userSupabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Update profile error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}

module.exports = UserSupabaseService;