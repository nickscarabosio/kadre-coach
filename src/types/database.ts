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
          telegram_chat_id: number | null
          telegram_username: string | null
          notification_preferences: Json
          phone: string | null
          todoist_api_token: string | null
          todoist_sync_enabled: boolean
          bio: string | null
          booking_link: string | null
          parent_coach_id: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          avatar_url?: string | null
          timezone?: string
          telegram_chat_id?: number | null
          telegram_username?: string | null
          notification_preferences?: Json
          phone?: string | null
          todoist_api_token?: string | null
          todoist_sync_enabled?: boolean
          bio?: string | null
          booking_link?: string | null
          parent_coach_id?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          timezone?: string
          telegram_chat_id?: number | null
          telegram_username?: string | null
          notification_preferences?: Json
          phone?: string | null
          todoist_api_token?: string | null
          todoist_sync_enabled?: boolean
          bio?: string | null
          booking_link?: string | null
          parent_coach_id?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_message_snippets: {
        Row: {
          id: string
          coach_id: string
          title: string
          body: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          title: string
          body: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          title?: string
          body?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      client_coaches: {
        Row: {
          id: string
          client_id: string
          coach_id: string
          is_lead: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          coach_id: string
          is_lead?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          coach_id?: string
          is_lead?: boolean
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
          company_name: string
          industry: string | null
          website: string | null
          notes: string | null
          role: string | null
          access_token: string
          engagement_score: number
          status: string
          visibility: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          email: string
          company?: string | null
          company_name: string
          industry?: string | null
          website?: string | null
          notes?: string | null
          role?: string | null
          access_token?: string
          engagement_score?: number
          status?: string
          visibility?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          name?: string
          email?: string
          company?: string | null
          company_name?: string
          industry?: string | null
          website?: string | null
          notes?: string | null
          role?: string | null
          engagement_score?: number
          status?: string
          visibility?: string
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
          current_phase_id: string | null
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
          current_phase_id?: string | null
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
          current_phase_id?: string | null
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
          conversation_id: string | null
          sender_type: string | null
          sender_coach_id: string | null
          sender_contact_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id: string
          content: string
          is_read?: boolean
          conversation_id?: string | null
          sender_type?: string | null
          sender_coach_id?: string | null
          sender_contact_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string
          content?: string
          is_read?: boolean
          conversation_id?: string | null
          sender_type?: string | null
          sender_coach_id?: string | null
          sender_contact_id?: string | null
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
          recording_url: string | null
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
          recording_url?: string | null
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
          recording_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          coach_id: string
          client_id: string | null
          project_id: string | null
          assigned_to_coach_id: string | null
          title: string
          description: string | null
          due_date: string | null
          due_time: string | null
          status: string
          priority: string
          priority_level: number
          parent_task_id: string | null
          section_id: string | null
          sort_order: number
          is_recurring: boolean
          recurrence_rule: string | null
          completed_at: string | null
          todoist_id: string | null
          todoist_sync_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id?: string | null
          project_id?: string | null
          assigned_to_coach_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          status?: string
          priority?: string
          priority_level?: number
          parent_task_id?: string | null
          section_id?: string | null
          sort_order?: number
          is_recurring?: boolean
          recurrence_rule?: string | null
          completed_at?: string | null
          todoist_id?: string | null
          todoist_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string | null
          project_id?: string | null
          assigned_to_coach_id?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          status?: string
          priority?: string
          priority_level?: number
          parent_task_id?: string | null
          section_id?: string | null
          sort_order?: number
          is_recurring?: boolean
          recurrence_rule?: string | null
          completed_at?: string | null
          todoist_id?: string | null
          todoist_sync_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          client_id: string
          name: string
          email: string | null
          role: string | null
          is_primary: boolean
          phone: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          email?: string | null
          role?: string | null
          is_primary?: boolean
          phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          email?: string | null
          role?: string | null
          is_primary?: boolean
          phone?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      telegram_updates: {
        Row: {
          id: string
          coach_id: string
          client_id: string | null
          telegram_message_id: number | null
          chat_id: number
          content: string
          message_type: string
          classification: string | null
          action_items: Json
          ai_summary: string | null
          voice_transcript: string | null
          file_url: string | null
          raw_update: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id?: string | null
          telegram_message_id?: number | null
          chat_id: number
          content: string
          message_type?: string
          classification?: string | null
          action_items?: Json
          ai_summary?: string | null
          voice_transcript?: string | null
          file_url?: string | null
          raw_update?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string | null
          telegram_message_id?: number | null
          chat_id?: number
          content?: string
          message_type?: string
          classification?: string | null
          action_items?: Json
          ai_summary?: string | null
          voice_transcript?: string | null
          file_url?: string | null
          raw_update?: Json | null
        }
        Relationships: []
      }
      daily_syntheses: {
        Row: {
          id: string
          coach_id: string
          synthesis_date: string
          content: string
          summary: string | null
          client_highlights: Json
          action_items: Json
          sent_telegram: boolean
          sent_email: boolean
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          synthesis_date: string
          content: string
          summary?: string | null
          client_highlights?: Json
          action_items?: Json
          sent_telegram?: boolean
          sent_email?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          synthesis_date?: string
          content?: string
          summary?: string | null
          client_highlights?: Json
          action_items?: Json
          sent_telegram?: boolean
          sent_email?: boolean
        }
        Relationships: []
      }
      task_sections: {
        Row: {
          id: string
          coach_id: string
          name: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      task_labels: {
        Row: {
          id: string
          coach_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          name?: string
          color?: string
        }
        Relationships: []
      }
      task_label_assignments: {
        Row: {
          task_id: string
          label_id: string
        }
        Insert: {
          task_id: string
          label_id: string
        }
        Update: {
          task_id?: string
          label_id?: string
        }
        Relationships: []
      }
      coach_check_ins: {
        Row: {
          id: string
          coach_id: string
          client_id: string
          check_in_type: string
          title: string | null
          notes: string | null
          duration_minutes: number | null
          check_in_date: string
          recording_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          client_id: string
          check_in_type?: string
          title?: string | null
          notes?: string | null
          duration_minutes?: number | null
          check_in_date?: string
          recording_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          client_id?: string
          check_in_type?: string
          title?: string | null
          notes?: string | null
          duration_minutes?: number | null
          check_in_date?: string
          recording_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          coach_id: string
          subject: string | null
          conversation_type: string
          client_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          subject?: string | null
          conversation_type?: string
          client_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          subject?: string | null
          conversation_type?: string
          client_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_projects: {
        Row: {
          id: string
          client_id: string
          coach_id: string
          title: string
          description: string | null
          status: string
          sort_order: number
          assigned_to: string | null
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          coach_id: string
          title: string
          description?: string | null
          status?: string
          sort_order?: number
          assigned_to?: string | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          coach_id?: string
          title?: string
          description?: string | null
          status?: string
          sort_order?: number
          assigned_to?: string | null
          due_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          participant_type: string
          coach_id: string | null
          contact_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          participant_type?: string
          coach_id?: string | null
          contact_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          participant_type?: string
          coach_id?: string | null
          contact_id?: string | null
        }
        Relationships: []
      }
      program_phases: {
        Row: {
          id: string
          program_id: string
          name: string
          description: string | null
          duration_value: number
          duration_unit: string
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          program_id: string
          name: string
          description?: string | null
          duration_value?: number
          duration_unit?: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          program_id?: string
          name?: string
          description?: string | null
          duration_value?: number
          duration_unit?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      program_assignments: {
        Row: {
          id: string
          phase_id: string
          coach_id: string
          title: string
          description: string | null
          assignment_type: string
          response_type: string
          recurrence_pattern: string | null
          recurrence_day: number | null
          video_url: string | null
          resource_url: string | null
          resource_name: string | null
          delay_days: number
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phase_id: string
          coach_id: string
          title: string
          description?: string | null
          assignment_type?: string
          response_type?: string
          recurrence_pattern?: string | null
          recurrence_day?: number | null
          video_url?: string | null
          resource_url?: string | null
          resource_name?: string | null
          delay_days?: number
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phase_id?: string
          coach_id?: string
          title?: string
          description?: string | null
          assignment_type?: string
          response_type?: string
          recurrence_pattern?: string | null
          recurrence_day?: number | null
          video_url?: string | null
          resource_url?: string | null
          resource_name?: string | null
          delay_days?: number
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      assigned_assignments: {
        Row: {
          id: string
          coach_id: string
          assignment_id: string | null
          enrollment_id: string | null
          client_id: string | null
          assignee_name: string | null
          assignee_email: string | null
          title: string
          description: string | null
          status: string
          due_date: string | null
          response_text: string | null
          response_file_url: string | null
          email_sent_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          assignment_id?: string | null
          enrollment_id?: string | null
          client_id?: string | null
          assignee_name?: string | null
          assignee_email?: string | null
          title: string
          description?: string | null
          status?: string
          due_date?: string | null
          response_text?: string | null
          response_file_url?: string | null
          email_sent_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          assignment_id?: string | null
          enrollment_id?: string | null
          client_id?: string | null
          assignee_name?: string | null
          assignee_email?: string | null
          title?: string
          description?: string | null
          status?: string
          due_date?: string | null
          response_text?: string | null
          response_file_url?: string | null
          email_sent_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      assignment_templates: {
        Row: {
          id: string
          coach_id: string
          title: string
          description: string | null
          assignment_type: string
          video_url: string | null
          resource_url: string | null
          resource_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          title: string
          description?: string | null
          assignment_type?: string
          video_url?: string | null
          resource_url?: string | null
          resource_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          title?: string
          description?: string | null
          assignment_type?: string
          video_url?: string | null
          resource_url?: string | null
          resource_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          coach_id: string
          category: string
          document_type: string
          title: string
          description: string | null
          file_name: string | null
          file_url: string | null
          file_path: string | null
          file_type: string | null
          file_size: number | null
          content: string | null
          url: string | null
          status: string
          client_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          category?: string
          document_type?: string
          title: string
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          file_path?: string | null
          file_type?: string | null
          file_size?: number | null
          content?: string | null
          url?: string | null
          status?: string
          client_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          category?: string
          document_type?: string
          title?: string
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          file_path?: string | null
          file_type?: string | null
          file_size?: number | null
          content?: string | null
          url?: string | null
          status?: string
          client_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      document_shares: {
        Row: {
          id: string
          document_id: string
          client_id: string
          shared_at: string
        }
        Insert: {
          id?: string
          document_id: string
          client_id: string
          shared_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          client_id?: string
          shared_at?: string
        }
        Relationships: []
      }
      forms: {
        Row: {
          id: string
          coach_id: string
          title: string
          description: string | null
          fields: Json
          status: string
          form_type: string | null
          public_token: string | null
          public_token_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          title: string
          description?: string | null
          fields?: Json
          status?: string
          form_type?: string | null
          public_token?: string | null
          public_token_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          title?: string
          description?: string | null
          fields?: Json
          status?: string
          form_type?: string | null
          public_token?: string | null
          public_token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          id: string
          form_id: string
          client_id: string | null
          submitter_name: string | null
          submitter_email: string | null
          responses: Json
          submitted_at: string
        }
        Insert: {
          id?: string
          form_id: string
          client_id?: string | null
          submitter_name?: string | null
          submitter_email?: string | null
          responses?: Json
          submitted_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          client_id?: string | null
          submitter_name?: string | null
          submitter_email?: string | null
          responses?: Json
          submitted_at?: string
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
export type CoachMessageSnippet = Database['public']['Tables']['coach_message_snippets']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientCoach = Database['public']['Tables']['client_coaches']['Row']
export type Company = Database['public']['Tables']['clients']['Row']
export type Program = Database['public']['Tables']['programs']['Row']
export type Enrollment = Database['public']['Tables']['enrollments']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Resource = Database['public']['Tables']['resources']['Row']
export type Reflection = Database['public']['Tables']['reflections']['Row']
export type SessionNote = Database['public']['Tables']['session_notes']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type TelegramUpdate = Database['public']['Tables']['telegram_updates']['Row']
export type DailySynthesis = Database['public']['Tables']['daily_syntheses']['Row']
export type TaskSection = Database['public']['Tables']['task_sections']['Row']
export type TaskLabel = Database['public']['Tables']['task_labels']['Row']
export type TaskLabelAssignment = Database['public']['Tables']['task_label_assignments']['Row']
export type CoachCheckIn = Database['public']['Tables']['coach_check_ins']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row']
export type ClientProject = Database['public']['Tables']['client_projects']['Row']
export type ProgramPhase = Database['public']['Tables']['program_phases']['Row']
export type ProgramAssignment = Database['public']['Tables']['program_assignments']['Row']
export type AssignedAssignment = Database['public']['Tables']['assigned_assignments']['Row']
export type AssignmentTemplate = Database['public']['Tables']['assignment_templates']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentShare = Database['public']['Tables']['document_shares']['Row']
export type Form = Database['public']['Tables']['forms']['Row']
export type FormSubmission = Database['public']['Tables']['form_submissions']['Row']

export type NotificationPreferences = {
  email_daily_synthesis: boolean
  email_check_in_alerts: boolean
  telegram_check_in_alerts: boolean
  telegram_daily_synthesis: boolean
  sms_urgent_alerts: boolean
}
