import React, { createContext, useContext, useState, useEffect } from "react";
import { Project, ProjectFile, Message, Task } from "../types";
import { supabase } from "../config/supabase";
import { supabaseStorageService } from "../services/supabaseStorageService";
import { useAuth } from "./AuthContext";
import { supabaseDataWrapper } from "../utils/mockDataProtection";

interface DataContextType {
  projects: Project[];
  files: ProjectFile[];
  messages: Message[];
  tasks: Task[];
  loadProjects: () => Promise<void>;
  loadFiles: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loadMessages: () => Promise<void>;
  addProject: (project: Omit<Project, "id" | "createdAt">) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addProjectFile: (
    projectId: string,
    file: File,
  ) => Promise<ProjectFile | undefined>;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => Promise<void>;
  addTask: (task: Omit<Task, "id" | "createdAt">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => void;
  getProjectsByUser: (userId: string, userRole: string) => Project[];
  getTasksByProject: (projectId: string) => Task[];
  getTasksByUser: (userId: string, userRole: string) => Task[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper functions for Supabase data conversion
const convertSupabaseProject = (data: Record<string, unknown>): Project => {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string,
    status: data.status as Project['status'],
    priority: data.priority as Project['priority'],
    clientId: data.client_id as string,
    managerId: data.manager_id as string,
    teamMembers: (data.team_members as string[]) || [],
    startDate: new Date(data.start_date as string),
    endDate: data.end_date ? new Date(data.end_date as string) : undefined,
    progress: (data.progress as number) || 0,
    budget: (data.budget as number) || 0,
    spent: (data.spent as number) || 0,
    category: data.category as Project['category'],
    files: [], // Will be loaded separately
    createdAt: new Date(data.created_at as string),
  };
};

const convertSupabaseFile = (data: Record<string, unknown>): ProjectFile => {
  return {
    id: data.id as string,
    name: data.name as string,
    type: data.type as string,
    size: data.size as number,
    url: (data.url as string) || "",
    projectId: data.project_id as string,
    uploadedBy: data.uploaded_by as string,
    uploadedAt: new Date(data.uploaded_at as string),
    lastModified: new Date((data.last_modified as string) || (data.uploaded_at as string)),
    lastModifiedBy: (data.last_modified_by as string) || (data.uploaded_by as string),
    category: data.category as ProjectFile['category'],
    isApproved: (data.is_approved as boolean) || false,
    version: (data.version as number) || 1,
    thumbnail: data.thumbnail as string,
    description: (data.description as string) || "",
    tags: (data.tags as string[]) || [],
    activity: [], // Will be loaded separately
    versions: [], // Will be loaded separately
    viewCount: (data.view_count as number) || 0,
    downloadCount: (data.download_count as number) || 0,
  };
};

const convertSupabaseTask = (data: Record<string, unknown>): Task => {
  return {
    id: data.id as string,
    projectId: data.project_id as string,
    title: data.title as string,
    description: data.description as string,
    status: data.status as Task['status'],
    priority: data.priority as Task['priority'],
    assigneeId: data.assignee_id as string,
    assigneeName: (data.assignee_name as string) || "",
    createdBy: data.created_by as string,
    createdAt: new Date(data.created_at as string),
    dueDate: data.due_date ? new Date(data.due_date as string) : new Date(),
    completedAt: data.completed_at ? new Date(data.completed_at as string) : undefined,
    estimatedHours: data.estimated_hours as number,
    actualHours: data.actual_hours as number,
    tags: (data.tags as string[]) || [],
    attachedFiles: (data.attached_files as string[]) || [],
    dependencies: (data.dependencies as string[]) || [],
    comments: [], // Will be loaded separately
    clickUpTaskId: data.clickup_task_id as string,
    clickUpUrl: data.clickup_url as string,
  };
};

const convertSupabaseMessage = (data: Record<string, unknown>): Message => {
  return {
    id: data.id as string,
    projectId: data.project_id as string,
    senderId: data.sender_id as string,
    senderName: (data.sender?.full_name as string) || "",
    content: data.content as string,
    timestamp: new Date(data.created_at as string),
    type: (data.type as Message['type']) || 'text',
    attachments: (data.attachments as string[]) || [],
    isRead: (data.is_read as boolean) || false,
    reactions: (data.reactions as unknown[]) || [],
  };
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  // addActivity is available via useActivity() hook when needed
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load projects from Supabase with optimization
  const loadProjects = async () => {
    if (!user) return;

    try {
      // Limit initial load to recent projects for faster response
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const convertedProjects = data?.map(convertSupabaseProject) || [];
      const validatedProjects = supabaseDataWrapper(convertedProjects, 'projects', 'load');
      setProjects(validatedProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  // Load files from Supabase
  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          uploaded_by_user:profiles!files_uploaded_by_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading files:', error);
        return;
      }

      const convertedFiles = data?.map(convertSupabaseFile) || [];
      setFiles(convertedFiles);
    } catch (error) {
      console.error('Error in loadFiles:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email),
          created_by_user:profiles!tasks_created_by_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tasks:', error);
        return;
      }

      const convertedTasks = data?.map(convertSupabaseTask) || [];
      setTasks(convertedTasks);
    } catch (error) {
      console.error('Error in loadTasks:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const convertedMessages = data?.map(convertSupabaseMessage) || [];
      setMessages(convertedMessages);
    } catch (error) {
      console.error('Error in loadMessages:', error);
    }
  };

  // Load essential data when user logs in
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      
      // Load data directly without connection test to avoid dependency loops
      Promise.all([
        loadProjects(),
        loadTasks(),
        loadFiles(),
        loadMessages()
      ]).then(() => {
        setIsLoading(false);
      }).catch((error) => {
        console.error('❌ DataContext: Error loading data:', error);
        setIsLoading(false);
      });
    } else {
      console.log('🚪 DataContext: User logged out, clearing data...');
      setProjects([]);
      setFiles([]);
      setMessages([]);
      setTasks([]);
      setIsLoading(false);
    }
  }, [user]);

  // Add project function
  const addProject = async (projectData: Omit<Project, "id" | "createdAt">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: projectData.name,
          description: projectData.description,
          status: projectData.status,
          priority: projectData.priority,
          client_id: projectData.clientId,
          manager_id: projectData.managerId,
          team_members: projectData.teamMembers,
          start_date: projectData.startDate.toISOString(),
          end_date: projectData.endDate?.toISOString(),
          progress: projectData.progress,
          budget: projectData.budget,
          spent: projectData.spent,
          category: projectData.category,
        })
        .select()
        .single();

      if (error) throw error;

      const newProject = convertSupabaseProject(data);
      setProjects((prev) => [newProject, ...prev]);
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  // Update project function
  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.progress !== undefined)
        updateData.progress = updates.progress;
      if (updates.budget !== undefined) updateData.budget = updates.budget;
      if (updates.spent !== undefined) updateData.spent = updates.spent;
      if (updates.startDate)
        updateData.start_date = updates.startDate.toISOString();
      if (updates.endDate) updateData.end_date = updates.endDate.toISOString();

      const { error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((project) =>
          project.id === id ? { ...project, ...updates } : project,
        ),
      );
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  // Add file function with Supabase Storage
  const addProjectFile = async (
    projectId: string,
    file: File,
  ): Promise<ProjectFile | undefined> => {
    if (!user) return;

    try {
      const uploadedFile = await supabaseStorageService.uploadFile(
        file,
        projectId,
      );

      const newFile: ProjectFile = {
        id: uploadedFile.id,
        name: uploadedFile.name,
        type: uploadedFile.type,
        size: uploadedFile.size,
        url: uploadedFile.url,
        projectId: projectId,
        uploadedBy: user.id,
        uploadedAt: uploadedFile.uploadedAt,
        lastModified: uploadedFile.uploadedAt,
        lastModifiedBy: user.id,
        category: "document",
        isApproved: false,
        version: 1,
        thumbnail: "",
        description: "",
        tags: [],
        activity: [],
        versions: [],
        viewCount: 0,
        downloadCount: 0,
      };

      setFiles((prev) => [newFile, ...prev]);
      return newFile;
    } catch (error) {
      console.error("Error adding file:", error);
      throw error;
    }
  };

  // Add task function
  const addTask = async (taskData: Omit<Task, "id" | "createdAt">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          project_id: taskData.projectId,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          assignee_id: taskData.assigneeId,
          assignee_name: taskData.assigneeName,
          created_by: user.id,
          due_date: taskData.dueDate?.toISOString(),
          estimated_hours: taskData.estimatedHours,
          tags: taskData.tags,
          attached_files: taskData.attachedFiles,
          dependencies: taskData.dependencies,
        })
        .select()
        .single();

      if (error) throw error;

      const newTask = convertSupabaseTask(data);
      setTasks((prev) => [newTask, ...prev]);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  // Update task function
  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.assigneeId) updateData.assignee_id = updates.assigneeId;
      if (updates.assigneeName) updateData.assignee_name = updates.assigneeName;
      if (updates.dueDate) updateData.due_date = updates.dueDate.toISOString();
      if (updates.completedAt)
        updateData.completed_at = updates.completedAt.toISOString();
      if (updates.estimatedHours !== undefined)
        updateData.estimated_hours = updates.estimatedHours;
      if (updates.actualHours !== undefined)
        updateData.actual_hours = updates.actualHours;

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((task) => (task.id === id ? { ...task, ...updates } : task)),
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Placeholder functions for messages and activities
  const addMessage = async (message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    // Save to Supabase first
     try {
       const { error } = await supabase
         .from("messages")
         .insert({
           id: newMessage.id,
           project_id: newMessage.projectId,
           sender_id: newMessage.senderId,
           content: newMessage.content,
           timestamp: newMessage.timestamp.toISOString(),
           type: newMessage.type,
           attachments: newMessage.attachments || [],
         });
      
      if (error) {
        console.error("Error saving message to Supabase:", error);
        return;
      }
      
      // Only add to local state if Supabase save was successful
      setMessages((prev) => [newMessage, ...prev]);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  // addActivity is now provided by useActivity()

  // Helper functions
  const getProjectsByUser = (userId: string, userRole: string): Project[] => {
    if (userRole === "admin") {
      return projects;
    }
    return projects.filter(
      (project) =>
        project.managerId === userId || project.teamMembers.includes(userId),
    );
  };

  const getTasksByProject = (projectId: string): Task[] => {
    return tasks.filter((task) => task.projectId === projectId);
  };

  const getTasksByUser = (userId: string, userRole: string): Task[] => {
    if (userRole === "admin") {
      return tasks;
    }
    return tasks.filter(
      (task) => task.assigneeId === userId || task.createdBy === userId,
    );
  };

  if (isLoading) {
    return (
      <DataContext.Provider
        value={{
          projects: [],
      files: [],
      messages: [],
      tasks: [],
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
        }}
      >
        {children}
      </DataContext.Provider>
    );
  }

  return (
    <DataContext.Provider
      value={{
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
    }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Fix Fast Refresh compatibility
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
