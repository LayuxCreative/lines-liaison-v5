import { Project, ProjectFile, Message, Task } from "../types";
import { nodeApiService } from "./nodeApiService";

class NodeDataService {
  // Load projects from Node.js API
  async loadProjects(userId?: string): Promise<Project[]> {
    try {
      const response = await nodeApiService.getProjects(userId);
      return response.data || [];
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  }

  // Load files from Node.js API
  async loadFiles(projectId?: string): Promise<ProjectFile[]> {
    if (!projectId) return [];
    
    try {
      const response = await nodeApiService.getFiles(projectId);
      return response.data || [];
    } catch (error) {
      console.error('Error loading files:', error);
      return [];
    }
  }

  // Load tasks from Node.js API
  async loadTasks(filters?: { projectId?: string; assigneeId?: string }): Promise<Task[]> {
    try {
      const response = await nodeApiService.getTasks(filters);
      return response.data || [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  // Load messages from Node.js API
  async loadMessages(): Promise<Message[]> {
    try {
      const response = await nodeApiService.getMessages();
      return response.data || [];
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }

  // Add project via Node.js API
  async addProject(project: Omit<Project, "id" | "createdAt">): Promise<Project> {
    try {
      const response = await nodeApiService.createProject(project);
      if (!response.data) throw new Error('No data returned from createProject');
      return response.data;
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  }

  // Update project via Node.js API
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      const response = await nodeApiService.updateProject(id, updates);
      if (!response.data) throw new Error('No data returned from updateProject');
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  // Add project file via Node.js API
  async addProjectFile(projectId: string, file: File): Promise<ProjectFile> {
    try {
      const response = await nodeApiService.uploadFile(file, projectId);
      if (!response.data) throw new Error('No data returned from uploadFile');
      return response.data;
    } catch (error) {
      console.error('Error adding project file:', error);
      throw error;
    }
  }

  // Add message via Node.js API
  async addMessage(message: Omit<Message, "id" | "timestamp">): Promise<Message> {
    try {
      const response = await nodeApiService.createMessage(message);
      if (!response.data) throw new Error('No data returned from createMessage');
      return response.data;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Add task via Node.js API
  async addTask(task: Omit<Task, "id" | "createdAt">): Promise<Task> {
    try {
      const response = await nodeApiService.createTask(task);
      if (!response.data) throw new Error('No data returned from createTask');
      return response.data;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  // Update task via Node.js API
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const response = await nodeApiService.updateTask(id, updates);
      if (!response.data) throw new Error('No data returned from updateTask');
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Get projects by user via Node.js API
  async getProjectsByUser(userId: string): Promise<Project[]> {
    try {
      // Use loadProjects as fallback since getProjectsByUser doesn't exist
      const allProjects = await this.loadProjects();
      return allProjects.filter(project => 
        project.teamMembers?.includes(userId) || project.managerId === userId
      );
    } catch (error) {
      console.error('Error loading user projects:', error);
      return [];
    }
  }

  // Get tasks by project via Node.js API
  async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      // Use loadTasks as fallback since getTasksByProject doesn't exist
      const allTasks = await this.loadTasks();
      return allTasks.filter(task => task.projectId === projectId);
    } catch (error) {
      console.error('Error loading project tasks:', error);
      return [];
    }
  }

  // Get tasks by user via Node.js API
  async getTasksByUser(userId: string): Promise<Task[]> {
    try {
      // Use loadTasks as fallback since getTasksByUser doesn't exist
      const allTasks = await this.loadTasks();
      return allTasks.filter(task => task.assigneeId === userId);
    } catch (error) {
      console.error('Error loading user tasks:', error);
      return [];
    }
  }
}

export const nodeDataService = new NodeDataService();