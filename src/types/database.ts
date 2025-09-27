export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action: string
          description: string
          id: string
          metadata: Json | null
          project_id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          description: string
          id: string
          metadata?: Json | null
          project_id: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          description?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      files: {
        Row: {
          category: string | null
          description: string | null
          download_count: number | null
          external_url: string | null
          id: string
          is_approved: boolean | null
          is_external: boolean | null
          last_modified: string | null
          last_modified_by: string | null
          name: string
          project_id: string | null
          size: number
          tags: string[] | null
          thumbnail: string | null
          type: string
          uploaded_at: string | null
          uploaded_by: string | null
          url: string
          version: number | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          download_count?: number | null
          external_url?: string | null
          id?: string
          is_approved?: boolean | null
          is_external?: boolean | null
          last_modified?: string | null
          last_modified_by?: string | null
          name: string
          project_id?: string | null
          size: number
          tags?: string[] | null
          thumbnail?: string | null
          type: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          url: string
          version?: number | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          description?: string | null
          download_count?: number | null
          external_url?: string | null
          id?: string
          is_approved?: boolean | null
          is_external?: boolean | null
          last_modified?: string | null
          last_modified_by?: string | null
          name?: string
          project_id?: string | null
          size?: number
          tags?: string[] | null
          thumbnail?: string | null
          type?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          url?: string
          version?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          content: string
          created_at: string | null
          edited_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          message_type: string | null
          project_id: string | null
          reply_to: string | null
          sender_id: string | null
          team_id: string | null
          timestamp: string | null
          type: string | null
        }
        Insert: {
          attachments?: string[] | null
          content: string
          created_at?: string | null
          edited_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          message_type?: string | null
          project_id?: string | null
          reply_to?: string | null
          sender_id?: string | null
          team_id?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Update: {
          attachments?: string[] | null
          content?: string
          created_at?: string | null
          edited_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          message_type?: string | null
          project_id?: string | null
          reply_to?: string | null
          sender_id?: string | null
          team_id?: string | null
          timestamp?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_groups: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          permissions: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          permissions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          permissions?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          additional_permissions: Json | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          department: string | null
          email: string
          email_notifications: boolean | null
          full_name: string | null
          id: string
          is_online: boolean | null
          last_seen: string | null
          last_seen_at: string | null
          location: string | null
          phone: string | null
          position: string | null
          preferences: Json | null
          push_notifications: boolean | null
          role: string | null
          status: string | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          additional_permissions?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          is_online?: boolean | null
          last_seen?: string | null
          last_seen_at?: string | null
          location?: string | null
          phone?: string | null
          position?: string | null
          preferences?: Json | null
          push_notifications?: boolean | null
          role?: string | null
          status?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          additional_permissions?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          last_seen_at?: string | null
          location?: string | null
          phone?: string | null
          position?: string | null
          preferences?: Json | null
          push_notifications?: boolean | null
          role?: string | null
          status?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          category: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          manager_id: string | null
          name: string
          priority: string | null
          progress: number | null
          spent: number | null
          start_date: string | null
          status: string | null
          team_members: string[] | null
        }
        Insert: {
          budget?: number | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name: string
          priority?: string | null
          progress?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          team_members?: string[] | null
        }
        Update: {
          budget?: number | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          priority?: string | null
          progress?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          team_members?: string[] | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          assignee_name: string | null
          attached_files: string[] | null
          clickup_task_id: string | null
          clickup_url: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          dependencies: string[] | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          assignee_name?: string | null
          attached_files?: string[] | null
          clickup_task_id?: string | null
          clickup_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          dependencies?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          assignee_name?: string | null
          attached_files?: string[] | null
          clickup_task_id?: string | null
          clickup_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          dependencies?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string | null
          role: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          session_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          session_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier access to database types
export type Tables = Database['public']['Tables']
export type TablesInsert<T extends keyof Tables> = Tables[T]['Insert']
export type TablesUpdate<T extends keyof Tables> = Tables[T]['Update']
export type TablesRow<T extends keyof Tables> = Tables[T]['Row']