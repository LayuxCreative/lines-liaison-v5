import { createContext } from 'react';
import type { Project, ProjectFile, Message, Task } from '../types';

// Align the DataContextType with the actual value provided in DataContext.tsx
export interface DataContextType {
  projects: Project[];
  files: ProjectFile[];
  messages: Message[];
  tasks: Task[];
  loadProjects: (userId?: string) => Promise<void>;
  loadFiles: (projectId: string) => Promise<void>;
  loadTasks: () => Promise<void>;
  loadMessages: () => Promise<void>;
  addProject: (projectData: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  addProjectFile: (projectId: string, file: File) => Promise<ProjectFile | undefined>;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  getProjectsByUser: (userId: string, userRole: string) => Project[];
  getTasksByProject: (projectId: string) => Task[];
  getTasksByUser: (userId: string, userRole: string) => Task[];
}

export const DataContext = createContext<DataContextType | undefined>(undefined);