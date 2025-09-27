import React, { createContext, useContext, useState, useEffect } from "react";
import { Project, ProjectFile, Message, Task } from "../types";
import { nodeApiService } from "../services/nodeApiService";
import { useAuth } from "./AuthContext";

// Import FileData interface from nodeApiService
interface FileData {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface DataContextType {
  projects: Project[];
  files: ProjectFile[];
  messages: Message[];
  tasks: Task[];
  loadProjects: (userId?: string) => Promise<void>;
  loadFiles: (projectId: string) => Promise<void>;
  loadTasks: () => Promise<void>;
  loadMessages: () => Promise<void>;
  addProject: (project: Omit<Project, "id" | "createdAt">) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addProjectFile: (projectId: string, file: File) => Promise<ProjectFile | undefined>;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => Promise<void>;
  addTask: (task: Omit<Task, "id" | "createdAt">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => void;
  getProjectsByUser: (userId: string, userRole: string) => Project[];
  getTasksByProject: (projectId: string) => Task[];
  getTasksByUser: (userId: string, userRole: string) => Task[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadProjects = async (userId?: string) => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        console.warn('DataContext: No user ID available for loading projects');
        return;
      }
      console.log('DataContext: Calling nodeApiService.getProjects with:', targetUserId);
      const response = await nodeApiService.getProjects(targetUserId);
      console.log('DataContext: getProjects response:', response);
      
      // Handle the response format correctly
      if (response.success && response.data) {
        const projectsData = Array.isArray(response.data) ? response.data : [];
        setProjects(projectsData);
        console.log('DataContext: Projects set successfully, count:', projectsData.length);
      } else {
        console.warn('DataContext: No projects data received');
        setProjects([]);
      }
    } catch (error) {
      console.error('DataContext: Error loading projects:', error);
      setProjects([]);
    }
  };

  const loadFiles = async (projectId: string) => {
    try {
      const response = await nodeApiService.getFiles(projectId);
      // Convert FileData to ProjectFile format
      if (response.success && response.data) {
        const filesData = Array.isArray(response.data) ? response.data : [];
        const convertedFiles: ProjectFile[] = filesData.map((file: FileData) => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          url: file.url,
          projectId: projectId,
          uploadedBy: '',
          uploadedAt: new Date(),
          lastModified: new Date(),
          lastModifiedBy: '',
          category: 'other' as const,
          isApproved: false,
          version: 1,
          thumbnail: undefined,
          isExternal: false,
          externalUrl: undefined,
          description: undefined,
          tags: [],
          activity: [],
          versions: [],
          viewCount: 0,
          downloadCount: 0
        }));
        setFiles(convertedFiles);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    }
  };

  const loadTasks = async () => {
    try {
      console.log('DataContext: Loading tasks...');
      const response = await nodeApiService.getTasks();
      console.log('DataContext: getTasks response:', response);
      
      // Handle the response format correctly
      if (response.success && response.data) {
        const tasksData = Array.isArray(response.data) ? response.data : [];
        setTasks(tasksData);
        console.log('DataContext: Tasks set successfully, count:', tasksData.length);
      } else {
        console.warn('DataContext: No tasks data received');
        setTasks([]);
      }
    } catch (error) {
      console.error('DataContext: Error loading tasks:', error);
      setTasks([]);
    }
  };

  const loadMessages = async () => {
    try {
      console.log('DataContext: Loading messages...');
      const response = await nodeApiService.getMessages();
      console.log('DataContext: getMessages response:', response);
      
      // Handle the response format correctly
      if (response.success && response.data) {
        const messagesData = Array.isArray(response.data) ? response.data : [];
        setMessages(messagesData);
        console.log('DataContext: Messages set successfully, count:', messagesData.length);
      } else {
        console.warn('DataContext: No messages data received');
        setMessages([]);
      }
    } catch (error) {
      console.error('DataContext: Error loading messages:', error);
      setMessages([]);
    }
  };

  const addProject = async (projectData: Omit<Project, "id" | "createdAt">) => {
    try {
      const response = await nodeApiService.createProject(projectData);
      if (response.data) {
        setProjects(prev => [...prev, response.data!]);
      }
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const response = await nodeApiService.updateProject(id, updates);
      if (response.data) {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const addProjectFile = async (projectId: string, file: File): Promise<ProjectFile | undefined> => {
    try {
      const response = await nodeApiService.uploadFile(file, projectId);
      if (response.data) {
        // Convert FileData to ProjectFile
        const fileData = response.data;
        const convertedFile: ProjectFile = {
          id: fileData.id,
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          url: fileData.url,
          projectId: projectId,
          uploadedBy: '',
          uploadedAt: new Date(),
          lastModified: new Date(),
          lastModifiedBy: '',
          category: 'other' as const,
          isApproved: false,
          version: 1,
          thumbnail: undefined,
          isExternal: false,
          externalUrl: undefined,
          description: undefined,
          tags: [],
          activity: [],
          versions: [],
          viewCount: 0,
          downloadCount: 0
        };
        setFiles(prev => [...prev, convertedFile]);
        return convertedFile;
      }
    } catch (error) {
      console.error('Error adding file:', error);
      throw error;
    }
    return undefined;
  };

  const addMessage = async (message: Omit<Message, "id" | "timestamp">) => {
    try {
      const response = await nodeApiService.createMessage(message);
      if (response.data) {
        setMessages(prev => [...prev, response.data!]);
      }
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  };

  const addTask = async (task: Omit<Task, "id" | "createdAt">) => {
    try {
      const response = await nodeApiService.createTask(task);
      if (response.data) {
        setTasks(prev => [...prev, response.data!]);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const response = await nodeApiService.updateTask(id, updates);
      if (response.data) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const getProjectsByUser = (userId: string, userRole: string): Project[] => {
    if (userRole === 'admin') {
      return projects;
    }
    return projects.filter(project => 
      project.managerId === userId || 
      project.teamMembers?.includes(userId)
    );
  };

  const getTasksByProject = (projectId: string): Task[] => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const getTasksByUser = (userId: string, userRole: string): Task[] => {
    if (userRole === 'admin') {
      return tasks;
    }
    return tasks.filter(task => task.assigneeId === userId);
  };

  // Load initial data when user is available
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('DataContext: loadInitialData called, user:', user);
      if (!user?.id) {
        console.log('DataContext: No user ID available, skipping data load');
        return;
      }
      
      console.log('DataContext: Loading data for user:', user.id);
      try {
        await Promise.all([
          loadProjects(user.id),
          loadTasks(),
          loadMessages()
        ]);
        console.log('DataContext: Initial data loaded successfully');
      } catch (error) {
        console.error('DataContext: Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [user?.id]);

  const value: DataContextType = {
    projects,
    files,
    messages,
    tasks,
    loadProjects,
    loadFiles,
    loadTasks,
    loadMessages,
    addProject,
    updateProject,
    addProjectFile,
    addMessage,
    addTask,
    updateTask,
    getProjectsByUser,
    getTasksByProject,
    getTasksByUser,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}

useData.displayName = 'useData';
