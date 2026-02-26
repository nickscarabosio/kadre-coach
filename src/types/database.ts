export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      coaches: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          avatar_url?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          coach_id: string
          name: string
          email: string
          company: string | null
          role: string | null
          access_token: string
          engagement_score: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          email: string
          company?: string | null
          role?: string | null
          access_token?: string
          engagement_score?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          name?: string
          email?: string
          company?: string | null
          role?: string | null
          engagement_score?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          id: string
          coach_id: string
          name: string
          description: string | null
          duration_weeks: number
          is_template: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          description?: string | null
          duration_weeks?: number
          is_template?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          name?: string
          description?: string | null
          duration_weeks?: number
          is_template?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          id: string
          client_id: string
          program_id: string
          start_date: string
          current_week: number
          completion_rate: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          program_id: string
          start_date?: string
          current_week?: number
          completion_rate?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          program_id?: string
          current_week?: number
          completion_rate?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          coach_id: string
          client_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string
          content?: string
          is_read?: boolean
        }
        Relationships: []
      }
      resources: {
        Row: {
          id: string
          coach_id: string
          client_id: string | null
          name: string
          type: string
          url: string
          file_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id?: string | null
          name: string
          type: string
          url: string
          file_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string | null
          name?: string
          type?: string
          url?: string
          file_path?: string | null
        }
        Relationships: []
      }
      reflections: {
        Row: {
          id: string
          client_id: string
          energy_level: number
          goal_progress: string
          action_items_completed: string
          accountability_score: number
          win: string | null
          challenge: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          energy_level: number
          goal_progress: string
          action_items_completed: string
          accountability_score: number
          win?: string | null
          challenge?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          energy_level?: number
          goal_progress?: string
          action_items_completed?: string
          accountability_score?: number
          win?: string | null
          challenge?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      session_notes: {
        Row: {
          id: string
          coach_id: string
          client_id: string
          title: string
          content: string
          is_pinned: boolean
          session_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id: string
          title: string
          content: string
          is_pinned?: boolean
          session_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string
          title?: string
          content?: string
          is_pinned?: boolean
          session_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          coach_id: string
          client_id: string | null
          title: string
          description: string | null
          due_date: string | null
          status: string
          priority: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          status?: string
          priority?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          status?: string
          priority?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Coach = Database['public']['Tables']['coaches']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Program = Database['public']['Tables']['programs']['Row']
export type Enrollment = Database['public']['Tables']['enrollments']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Resource = Database['public']['Tables']['resources']['Row']
export type Reflection = Database['public']['Tables']['reflections']['Row']
export type SessionNote = Database['public']['Tables']['session_notes']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
