import { User, Project, Task, PermissionGroup, Role, PermissionItem, Message } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

interface FileData {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

class NodeApiService {
  private static instance: NodeApiService;

  static getInstance(): NodeApiService {
    if (!NodeApiService.instance) {
      NodeApiService.instance = new NodeApiService();
    }
    return NodeApiService.instance;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 3): Promise<ApiResponse<T>> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          // Handle rate limiting with exponential backoff
          if (response.status === 429 && attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          // Do not retry on unauthorized; return structured error
          if (response.status === 401) {
            return {
              success: false,
              error: 'Unauthorized',
            } as ApiResponse<T>;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle backend response format for auth endpoints
        if (endpoint.includes('/auth/') && data.user) {
          return {
            success: true,
            data: {
              user: data.user,
              session: data.session
            }
          } as ApiResponse<T>;
        }
        
        // Handle other endpoints that already return ApiResponse format
        if (data.success !== undefined) {
          return data;
        }
        
        // Default: wrap response in ApiResponse format
        return {
          success: true,
          data: data
        } as ApiResponse<T>;
      } catch (error) {
        if (attempt === retries) {
          console.error(`API request failed for ${endpoint} after ${retries} attempts:`, error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          };
        }
        
        // Wait before retry for non-rate-limit errors
        const delay = 1000 * attempt;
        console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: 'Request failed after all retries',
    };
  }

  // Authentication methods
  async signIn(email: string, password: string) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signUp(email: string, password: string, userData: Partial<User>) {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...userData }),
    });
  }

  async signOut() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<User | null> {
    const response = await this.request<User>('/auth/me', {}, 1);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  }

  // Profile methods
  async getProfile(userId: string) {
    return this.request<User>(`/profiles/${userId}`);
  }

  async getUserById(userId: string) {
    return this.request<User>(`/profiles/${userId}`);
  }

  async getUsers() {
    return this.request<User[]>('/profiles');
  }

  async createUser(userData: Partial<User>) {
    return this.request<User>('/profiles', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateProfile(userId: string, updates: Partial<User>) {
    return this.request<User>(`/profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateUser(userId: string, updates: Partial<User>) {
    return this.request<User>(`/profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/profiles/${userId}`, {
      method: 'DELETE',
    });
  }

  // Permission methods
  async getPermissionGroups() {
    return this.request<PermissionGroup[]>('/permission-groups');
  }

  async createPermissionGroup(groupData: Partial<PermissionGroup>) {
    return this.request<PermissionGroup>('/permission-groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async updatePermissionGroup(groupId: string, updates: Partial<PermissionGroup>) {
    return this.request<PermissionGroup>(`/permission-groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePermissionGroup(groupId: string) {
    return this.request(`/permission-groups/${groupId}`, {
      method: 'DELETE',
    });
  }

  async getRoles() {
    return this.request<Role[]>('/roles');
  }

  async createRole(roleData: Partial<Role>) {
    return this.request<Role>('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  async updateRole(roleId: string, updates: Partial<Role>) {
    return this.request<Role>(`/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteRole(roleId: string) {
    return this.request(`/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  // Permission methods
  async getPermissions() {
    return this.request<PermissionItem[]>('/permissions');
  }

  // Project methods
  async getProjects(userId?: string) {
    const endpoint = userId ? `/projects/${userId}` : '/projects';
    const response = await this.request<{projects: Project[]}>(endpoint);
    
    // Backend returns {projects: [...]} format, adapt to expected format
    if (response.success && 'projects' in response.data!) {
      return {
        success: true,
        data: response.data.projects
      };
    }
    
    return response;
  }

  async createProject(project: Partial<Project>) {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(projectId: string, updates: Partial<Project>) {
    return this.request<Project>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(projectId: string) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Task methods
  async getTasks(filters?: { projectId?: string; assigneeId?: string }) {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
    const response = await this.request<{tasks: Task[]}>(endpoint);
    
    // Backend returns {tasks: [...]} format, adapt to expected format
    if (response.success && 'tasks' in response.data!) {
      return {
        success: true,
        data: response.data.tasks
      };
    }
    
    return response;
  }

  async createTask(task: Partial<Task>) {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(taskId: string, updates: Partial<Task>) {
    return this.request<Task>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(taskId: string) {
    return this.request(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Message methods
  async getMessages(projectId?: string) {
    const endpoint = projectId ? `/messages?projectId=${projectId}` : '/messages';
    const response = await this.request<{messages: Message[]}>(endpoint);
    
    // Backend returns {messages: [...]} format, adapt to expected format
    if (response.success && 'messages' in response.data!) {
      return {
        success: true,
        data: response.data.messages
      };
    }
    
    return response;
  }

  async createMessage(message: Partial<Message>) {
    return this.request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // File methods
  async getFiles(projectId: string) {
    return this.request<FileData[]>(`/files?projectId=${projectId}`);
  }

  async uploadFile(file: File, projectId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) {
      formData.append('projectId', projectId);
    }

    return this.request<FileData>('/files/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Let browser set Content-Type for FormData
      },
    });
  }

  async deleteFile(fileId: string) {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Notification methods
  async getNotifications(userId: string) {
    return this.request<Notification[]>(`/notifications?userId=${userId}`);
  }

  async subscribeToNotifications() {
    // For real-time notifications, we'll need to implement WebSocket connection
    // This is a placeholder - actual implementation would require backend support
    console.warn('Realtime notifications not implemented through nodeApiService');
    return { unsubscribe: () => {} };
  }

  async unsubscribe(subscription: { unsubscribe: () => void }) {
    // Placeholder for subscription cleanup
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe();
    }
  }
  
  // Notification management
  async createNotification(notification: { title: string; message: string; type: string; userId: string; projectId?: string; actionUrl?: string }) {
    return this.request<Notification>('/notifications', {
      method: 'POST',
      body: JSON.stringify({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        user_id: notification.userId,
        project_id: notification.projectId,
        action_url: notification.actionUrl,
      }),
    });
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'PUT',
      body: JSON.stringify({ read: true }),
    });
  }

  async markAllNotificationsAsRead(userId: string) {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT',
      body: JSON.stringify({ userId }),
    });
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }
}

export const nodeApiService = NodeApiService.getInstance();
export default nodeApiService;