const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    // Use Service Role Key for backend operations with elevated permissions
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'x-application-name': 'lines-liaison-backend'
          }
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    );
    
    // Connection health check
    this.isConnected = false;
    this.checkConnection();
  }

  async checkConnection() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      this.isConnected = !error;
      if (error) {
        console.error('Supabase connection error:', error);
      } else {
        console.log('✅ Supabase connection established');
      }
    } catch (error) {
      this.isConnected = false;
      console.error('Supabase connection failed:', error);
    }
  }

  // Authentication methods
  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(email, password, userData) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Profile methods
  async getProfile(userId) {
    try {
      const { data, error } = await this.supabase
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

  async updateProfile(userId, updates) {
    try {
      const { data, error } = await this.supabase
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

  async getAllProfiles() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get all profiles error:', error);
      throw error;
    }
  }

  // Project methods
  async getProjects(userId) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .or(`client_id.eq.${userId},manager_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get projects error:', error);
      throw error;
    }
  }

  async createProject(projectData) {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  }

  // Task methods
  async getTasks(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get tasks error:', error);
      throw error;
    }
  }

  async createTask(taskData) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create task error:', error);
      throw error;
    }
  }

  async getTasksByAssignee(assigneeId) {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', assigneeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get tasks by assignee error:', error);
      throw error;
    }
  }

  async getAllTasks() {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get all tasks error:', error);
      throw error;
    }
  }

  // File methods
  async uploadFile(fileData) {
    try {
      const { data, error } = await this.supabase
        .from('files')
        .insert(fileData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  async getFiles(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get files error:', error);
      throw error;
    }
  }

  // Message methods
  async getMessages(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  }

  async getAllMessages() {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get all messages error:', error);
      throw error;
    }
  }

  async createMessage(messageData) {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create message error:', error);
      throw error;
    }
  }

  // Utility methods
  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  }
}

module.exports = new SupabaseService();