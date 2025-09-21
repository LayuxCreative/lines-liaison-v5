import { supabase } from "../config/supabase";
import { User, Project, Task, Message, PermissionGroup, Role, PermissionItem, EnhancedNotification } from "../types";

// Enhanced error handling for Supabase operations
class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

// Connection state monitoring
interface ServiceConnectionState {
  isHealthy: boolean;
  lastSuccessfulOperation: Date | null;
  consecutiveFailures: number;
  circuitBreakerOpen: boolean;
}

const serviceState: ServiceConnectionState = {
  isHealthy: true,
  lastSuccessfulOperation: null,
  consecutiveFailures: 0,
  circuitBreakerOpen: false
};

// Circuit breaker pattern implementation
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

// Enhanced retry mechanism for network operations
class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting ${operationName} (${attempt}/${maxRetries})`);
        const result = await operation();
        if (attempt > 1) {
          console.log(`${operationName} succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`${operationName} failed on attempt ${attempt}:`, error);
        
        if (attempt === maxRetries) {
          console.error(`${operationName} failed after ${maxRetries} attempts`);
          break;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`Retrying ${operationName} in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error(`Operation ${operationName} failed`);
  }
}

// Utility function to handle Supabase responses with enhanced error handling
const handleSupabaseResponse = async <T>(
  operation: () => Promise<{ data: T | null; error: unknown }>,
  operationName: string
): Promise<T> => {
  // Check circuit breaker
  if (serviceState.circuitBreakerOpen) {
    const timeSinceLastFailure = Date.now() - (serviceState.lastSuccessfulOperation?.getTime() || 0);
    if (timeSinceLastFailure < CIRCUIT_BREAKER_TIMEOUT) {
      throw new SupabaseError(
        `Service temporarily unavailable (circuit breaker open)`,
        'CIRCUIT_BREAKER_OPEN',
        { operationName },
        false
      );
    } else {
      // Reset circuit breaker
      serviceState.circuitBreakerOpen = false;
      serviceState.consecutiveFailures = 0;
    }
  }

  try {
    const { data, error } = await operation();
    
    if (error) {
      console.error(`❌ Supabase ${operationName} error:`, error);
      
      // Update service state
      serviceState.consecutiveFailures++;
      serviceState.isHealthy = false;
      
      // Open circuit breaker if threshold reached
      if (serviceState.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        serviceState.circuitBreakerOpen = true;
        console.warn(`🚨 Circuit breaker opened for ${operationName} after ${serviceState.consecutiveFailures} failures`);
      }
      
      throw new SupabaseError(
        `Failed to ${operationName}: ${error}`,
        'OPERATION_FAILED',
        { error, operationName },
        true
      );
    }
    
    if (!data) {
      throw new SupabaseError(
        `No data returned from ${operationName}`,
        'NO_DATA',
        { operationName },
        false
      );
    }
    
    // Update service state on success
    serviceState.isHealthy = true;
    serviceState.lastSuccessfulOperation = new Date();
    serviceState.consecutiveFailures = 0;
    serviceState.circuitBreakerOpen = false;
    
    return data;
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }
    
    // Handle unexpected errors
    serviceState.consecutiveFailures++;
    serviceState.isHealthy = false;
    
    throw new SupabaseError(
      `Unexpected error in ${operationName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UNEXPECTED_ERROR',
      { error, operationName },
      true
    );
  }
};

// Enhanced logging utility with performance monitoring
const logOperation = (operation: string, startTime?: number, data?: unknown) => {
  const duration = startTime ? Date.now() - startTime : 0;
  const logData = {
    operation,
    duration: duration > 0 ? `${duration}ms` : undefined,
    dataSize: data ? JSON.stringify(data).length : undefined,
    timestamp: new Date().toISOString()
  };
  
  console.log(`🔄 Supabase ${operation}:`, logData);
  
  if (duration > 5000) {
    console.warn(`⚠️ Slow operation detected: ${operation} took ${duration}ms`);
  }
};

class SupabaseService {
  private supabase = supabase;

  // Health check method
  async checkHealth(): Promise<boolean> {
    try {
      const startTime = Date.now();
      await handleSupabaseResponse(
        () => this.supabase.from('profiles').select('id').limit(1),
        'health_check'
      );
      logOperation('health_check', startTime);
      return true;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  // Get service state
  getServiceState(): ServiceConnectionState {
    return { ...serviceState };
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return RetryHandler.withRetry(async () => {
      console.log('🔄 Starting to fetch users from Supabase...');
      const { data, error } = await this.supabase.from("profiles").select("*");

      if (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }
      
      console.log('✅ Successfully fetched users:', data?.length || 0, 'users');
      console.log('📊 Users data:', data);
      
      // Map database field names to frontend field names
      const mappedData = data?.map(user => ({
        ...user,
        name: user.full_name || user.name,
        additionalPermissions: user.additional_permissions || user.additionalPermissions || []
      })) || [];
      
      return mappedData;
    }, 3, 1000, 'getUsers');
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    if (!data) return null;
    
    // Map database field names to frontend field names
    return {
      ...data,
      name: data.full_name || data.name,
      additionalPermissions: data.additional_permissions || data.additionalPermissions || []
    };
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from("profiles")
      .update({ status })
      .eq("id", userId);

    if (error) throw error;
  }

  async createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
    // Map frontend field names to database field names
    const dbUserData: Record<string, unknown> = { ...userData };
    
    // Map additionalPermissions to additional_permissions
    if (userData.additionalPermissions !== undefined) {
      dbUserData.additional_permissions = userData.additionalPermissions;
      delete dbUserData.additionalPermissions;
    }
    
    // Map name to full_name if provided
    if (userData.name !== undefined) {
      dbUserData.full_name = userData.name;
      delete dbUserData.name;
    }
    
    const { data, error } = await this.supabase
      .from("profiles")
      .insert({
        ...dbUserData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    
    // Map database field names to frontend field names
    return {
      ...data,
      name: data.full_name || data.name,
      additionalPermissions: data.additional_permissions || data.additionalPermissions || []
    };
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    return RetryHandler.withRetry(async () => {
      console.log('🔧 SupabaseService.updateUser called with:', { userId, updates });
      
      // Map frontend field names to database field names and filter valid fields
      const dbUpdates: Record<string, unknown> = {};
      
      // Valid database fields for profiles table
      const validFields = [
        'email', 'full_name', 'avatar_url', 'role', 'department', 
        'position', 'phone', 'status', 'last_seen', 'preferences', 
        'additional_permissions'
      ];
      
      // Map and filter fields
      Object.keys(updates).forEach(key => {
        const value = updates[key as keyof User];
        console.log(`🔍 Processing field: ${key} = ${JSON.stringify(value)}`);
        
        if (key === 'additionalPermissions') {
          dbUpdates.additional_permissions = value;
        } else if (key === 'name') {
          dbUpdates.full_name = value;
        } else if (key === 'avatar') {
          dbUpdates.avatar_url = value;
        } else if (validFields.includes(key)) {
          dbUpdates[key] = value;
        } else {
          console.log(`⚠️ Skipping invalid field: ${key}`);
        }
      });

      console.log('🗄️ Database updates to be sent:', dbUpdates);

      // Add updated_at timestamp
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await this.supabase
        .from("profiles")
        .update(dbUpdates)
        .eq("id", userId)
        .select();

      console.log('📊 Supabase response:', { data, error });

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        // Check if user exists
        const { data: existingUser } = await this.supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .single();
        
        if (!existingUser) {
          throw new Error(`User with ID ${userId} does not exist`);
        } else {
          throw new Error(`User with ID ${userId} could not be updated - no changes made`);
        }
      }
      
      // Map database field names to frontend field names
      const result = {
        ...data[0],
        name: data[0].full_name || data[0].name,
        additionalPermissions: data[0].additional_permissions || data[0].additionalPermissions || []
      };
      
      console.log('✅ Final mapped result:', result);
      return result;
    }, 3, 1000, `updateUser(${userId})`);
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) throw error;
  }

  async toggleUserStatus(userId: string): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");
    
    const newStatus = user.status === "available" ? "away" : "available";
    return this.updateUser(userId, { status: newStatus });
  }

  // Real-time subscription for users - RE-ENABLED with improved stability
  static subscribeToUsers(callback: (payload: unknown) => void) {
    return RetryHandler.withRetry(async () => {
      return supabase
        .channel("users-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
          },
          callback
        )
        .subscribe();
    }, 3, 2000, 'subscribeToUsers');
  }

  // Permission Groups operations
  async getPermissionGroups(): Promise<PermissionGroup[]> {
    const { data, error } = await this.supabase
      .from("permission_groups")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map(group => ({
      ...group,
      created_at: new Date(group.created_at),
      updated_at: new Date(group.updated_at)
    }));
  }

  async getPermissionGroupById(id: string): Promise<PermissionGroup | null> {
    const { data, error } = await this.supabase
      .from("permission_groups")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data ? {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    } : null;
  }

  async createPermissionGroup(groupData: Omit<PermissionGroup, "id" | "created_at" | "updated_at">): Promise<PermissionGroup> {
    const { data, error } = await this.supabase
      .from("permission_groups")
      .insert({
        ...groupData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  async updatePermissionGroup(id: string, updates: Partial<Omit<PermissionGroup, "id" | "created_at">>): Promise<PermissionGroup> {
    const { data, error } = await this.supabase
      .from("permission_groups")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  async deletePermissionGroup(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("permission_groups")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  // Real-time subscription for permission groups - DISABLED to prevent ChannelRateLimitReached
  static subscribeToPermissionGroups(callback: (payload: unknown) => void) {
    void callback;
    console.warn('Realtime subscriptions are temporarily disabled');
    return null;
    /*
    return supabase
      .channel("permission-groups-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "permission_groups",
        },
        callback
      )
      .subscribe();
    */
  }

  // Role operations
  async getRoles(): Promise<Role[]> {
    const { data, error } = await this.supabase
      .from("roles")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map(role => ({
      ...role,
      created_at: new Date(role.created_at),
      updated_at: new Date(role.updated_at)
    }));
  }

  async getRoleById(id: string): Promise<Role | null> {
    const { data, error } = await this.supabase
      .from("roles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data ? {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    } : null;
  }

  async createRole(roleData: Omit<Role, "id" | "created_at" | "updated_at">): Promise<Role> {
    const { data, error } = await this.supabase
      .from("roles")
      .insert({
        ...roleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  async updateRole(id: string, updates: Partial<Omit<Role, "id" | "created_at">>): Promise<Role> {
    const { data, error } = await this.supabase
      .from("roles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  async deleteRole(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("roles")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  // Permissions operations
  async getPermissions(): Promise<PermissionItem[]> {
    try {
      // Get all permission groups to extract available permissions
      const { data: permissionGroups, error } = await this.supabase
        .from("permission_groups")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Extract all unique permissions from all groups
      const allPermissions = new Set<string>();
      permissionGroups?.forEach(group => {
        if (group.permissions && Array.isArray(group.permissions)) {
          group.permissions.forEach((perm: string) => allPermissions.add(perm));
        }
      });

      // Convert to PermissionItem format with categories
       const permissionItems: PermissionItem[] = Array.from(allPermissions).map(permName => {
         // Determine category based on permission name
         let category = 'Other';
         const displayName = permName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
         let description = `Permission to ${displayName.toLowerCase()}`;

        if (permName.includes('user_management')) {
          category = 'User Management';
          description = permName.includes('read') ? 'View users and their details' : 'Create, edit, and manage users';
        } else if (permName.includes('project_management')) {
          category = 'Project Management';
          description = permName.includes('read') ? 'View projects and their details' : 'Create, edit, and manage projects';
        } else if (permName.includes('task_management')) {
          category = 'Task Management';
          description = permName.includes('read') ? 'View tasks and their details' : 'Create, edit, and manage tasks';
        } else if (permName.includes('file_upload')) {
          category = 'File Management';
          description = permName.includes('read') ? 'View and download files' : 'Upload, edit, and manage files';
        } else if (permName.includes('report_generation')) {
          category = 'Reports';
          description = permName.includes('read') ? 'View reports' : 'Generate and manage reports';
        } else if (permName.includes('client_communication')) {
          category = 'Communication';
          description = permName.includes('read') ? 'View client communications' : 'Communicate with clients';
        } else if (permName.includes('system_settings')) {
          category = 'System Settings';
          description = permName.includes('read') ? 'View system settings' : 'Modify system settings';
        } else if (permName.includes('analytics')) {
          category = 'Analytics';
          description = 'View analytics and insights';
        } else if (permName.includes('team_coordination')) {
          category = 'Team Management';
          description = permName.includes('read') ? 'View team information' : 'Coordinate and manage teams';
        } else if (permName.includes('time_tracking')) {
          category = 'Time Management';
          description = permName.includes('read') ? 'View time tracking data' : 'Track and manage time';
        } else if (permName.includes('budget_management')) {
          category = 'Financial';
          description = permName.includes('read') ? 'View budget information' : 'Manage budgets and finances';
        } else if (permName.includes('export_data')) {
          category = 'Data Management';
          description = 'Export data and reports';
        }

        // Extract resource and action from permission name
         let resource = 'general';
         let action = 'access';
         
         if (permName.includes('_')) {
           const parts = permName.split('_');
           if (parts.length >= 2) {
             resource = parts[0];
             action = parts[parts.length - 1];
           }
         }

         return {
           id: permName,
           name: permName,
           display_name: displayName,
           description: description,
           category: category,
           resource: resource,
           action: action,
           is_active: true,
           created_at: new Date(),
           updated_at: new Date()
         };
      });

      return permissionItems;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  }

  async getPermissionById(id: string): Promise<PermissionItem | null> {
    const { data, error } = await this.supabase
      .from("permissions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data ? {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    } : null;
  }

  async createPermission(permissionData: Omit<PermissionItem, "id" | "created_at" | "updated_at">): Promise<PermissionItem> {
    const { data, error } = await this.supabase
      .from("permissions")
      .insert({
        ...permissionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  async updatePermission(id: string, updates: Partial<Omit<PermissionItem, "id" | "created_at">>): Promise<PermissionItem> {
    const { data, error } = await this.supabase
      .from("permissions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  async deletePermission(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("permissions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  // Message operations
  async getMessages(projectId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from("messages")
      .select("*")
      .eq("projectId", projectId)
      .order("timestamp", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createMessage(
    messageData: Omit<Message, "id" | "timestamp">,
  ): Promise<Message> {
    const { data, error } = await this.supabase
      .from("messages")
      .insert({
        ...messageData,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Team operations (using profiles table for team members)
  async getTeamMembers(projectId: string): Promise<User[]> {
    // First get the project to access teamMembers array
    const { data: project, error: projectError } = await this.supabase
      .from("projects")
      .select("teamMembers")
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;
    if (!project?.teamMembers || project.teamMembers.length === 0) {
      return [];
    }

    // Then get the team members
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .in("id", project.teamMembers);

    if (error) throw error;
    
    // Map database field names to frontend field names
    const mappedData = data?.map(user => ({
      ...user,
      name: user.full_name || user.name,
      additionalPermissions: user.additional_permissions || user.additionalPermissions || []
    })) || [];
    
    return mappedData;
  }

  // Project operations
  static async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase.from("projects").select(`
        *,
        team:teams(id, name),
        members:project_members(
          user_id,
          role,
          profiles(id, name, avatar)
        )
      `);

    if (error) throw error;
    return data || [];
  }

  static async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        team:teams(id, name),
        members:project_members(
          user_id,
          role,
          profiles(id, name, avatar)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  async createProject(
    projectData: Omit<Project, "id" | "createdAt">,
  ): Promise<Project> {
    const { data, error } = await this.supabase
      .from("projects")
      .insert({
        ...projectData,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Task operations
  static async getTasks(projectId?: string): Promise<Task[]> {
    let query = supabase.from("tasks").select(`
        *,
        assignee:profiles(id, name, avatar),
        project:projects(id, name)
      `);

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async createTask(task: Omit<Task, "id" | "createdAt">): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        project_id: task.projectId,
        assignee_id: task.assigneeId,
        due_date: task.dueDate,
        created_by: task.createdBy,
      })
      .select(
        `
        *,
        assignee:profiles(id, name, avatar),
        project:projects(id, name)
      `,
      )
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        assignee_id: updates.assigneeId,
        due_date: updates.dueDate,
      })
      .eq("id", id)
      .select(
        `
        *,
        assignee:profiles(id, name, avatar),
        project:projects(id, name)
      `,
      )
      .single();

    if (error) throw error;
    return data;
  }

  // Notification operations
  async getNotifications(userId: string): Promise<EnhancedNotification[]> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createNotification(
    notificationData: Omit<EnhancedNotification, "id" | "createdAt">,
  ): Promise<EnhancedNotification> {
    const { data, error } = await this.supabase
      .from("notifications")
      .insert({
        ...notificationData,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({ status: "read", readAt: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  }

  // Real-time subscriptions
  static subscribeToMessages(
    channelId: string,
    callback: (message: Message) => void,
  ) {
    void channelId; void callback;
    console.warn('Realtime subscriptions are temporarily disabled');
    return null;
    /*
    return supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        },
      )
      .subscribe();
    */
  }

  static subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void,
  ) {
    return RetryHandler.withRetry(async () => {
      return supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            callback(payload.new as Notification);
          },
        )
        .subscribe();
    }, 3, 2000, 'subscribeToNotifications');
  }

  static subscribeToUserStatus(callback: (user: User) => void) {
    return RetryHandler.withRetry(async () => {
      return supabase
        .channel("user_status")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
          },
          (payload) => {
            callback(payload.new as User);
          },
        )
        .subscribe();
    }, 3, 2000, 'subscribeToUserStatus');
  }

  // Subscribe to notifications realtime updates - RE-ENABLED with improved stability
  subscribeToNotifications(userId: string, callback: (payload: unknown) => void) {
    return RetryHandler.withRetry(async () => {
      return supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          callback,
        )
        .subscribe();
    }, 3, 2000, 'subscribeToNotifications');
  }

  // Activity operations
  async getActivities(): Promise<unknown[]> {
    return RetryHandler.withRetry(async () => {
      console.log('🔄 Starting to fetch activities from Supabase...');
      
      try {
        const { data, error } = await this.supabase
          .from("activities")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(50);

        if (error) {
          console.error('❌ Error fetching activities:', error);
          // Return empty array instead of throwing for better UX
          return [];
        }

        console.log('✅ Successfully fetched activities:', data?.length || 0);
        return data || [];
      } catch (networkError) {
        console.error('❌ Network error fetching activities:', networkError);
        // Return empty array for network errors
        return [];
      }
    }, 3, 1000, 'getActivities');
  }

  // Unsubscribe from realtime updates
  unsubscribe(subscription: { unsubscribe: () => void } | null) {
    if (subscription) {
      subscription.unsubscribe();
    }
  }
}

// Create and export a singleton instance
const supabaseService = new SupabaseService();
export default supabaseService;
export { supabaseService };
