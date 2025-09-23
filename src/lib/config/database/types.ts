// Database type definition for Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          project_id: string;
          assignee_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: string;
          priority?: string;
          project_id: string;
          assignee_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          project_id?: string;
          assignee_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          content: string;
          sender_id: string;
          receiver_id: string | null;
          room_id: string | null;
          message_type: 'text' | 'file' | 'image' | 'video' | 'audio';
          file_url: string | null;
          file_name: string | null;
          file_size: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          sender_id: string;
          receiver_id?: string | null;
          room_id?: string | null;
          message_type?: 'text' | 'file' | 'image' | 'video' | 'audio';
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          sender_id?: string;
          receiver_id?: string | null;
          room_id?: string | null;
          message_type?: 'text' | 'file' | 'image' | 'video' | 'audio';
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: 'public' | 'private' | 'direct';
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          type?: 'public' | 'private' | 'direct';
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          type?: 'public' | 'private' | 'direct';
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      message_type: 'text' | 'file' | 'image' | 'video' | 'audio';
      room_type: 'public' | 'private' | 'direct';
      task_status: 'todo' | 'in_progress' | 'review' | 'done';
      task_priority: 'low' | 'medium' | 'high' | 'urgent';
    };
  };
};

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Specific table types
export type Profile = Tables<'profiles'>;
export type Project = Tables<'projects'>;
export type Task = Tables<'tasks'>;
export type Team = Tables<'teams'>;
export type Message = Tables<'messages'>;
export type Room = Tables<'rooms'>;

// Insert types
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProjectInsert = TablesInsert<'projects'>;
export type TaskInsert = TablesInsert<'tasks'>;
export type TeamInsert = TablesInsert<'teams'>;
export type MessageInsert = TablesInsert<'messages'>;
export type RoomInsert = TablesInsert<'rooms'>;

// Update types
export type ProfileUpdate = TablesUpdate<'profiles'>;
export type ProjectUpdate = TablesUpdate<'projects'>;
export type TaskUpdate = TablesUpdate<'tasks'>;
export type TeamUpdate = TablesUpdate<'teams'>;
export type MessageUpdate = TablesUpdate<'messages'>;
export type RoomUpdate = TablesUpdate<'rooms'>;

// Enum types
export type MessageType = Enums<'message_type'>;
export type RoomType = Enums<'room_type'>;
export type TaskStatus = Enums<'task_status'>;
export type TaskPriority = Enums<'task_priority'>;