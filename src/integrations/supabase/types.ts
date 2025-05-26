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
      profiles: {
        Row: {
          created_at: string | null
          credits: number
          email: string | null
          email_sent: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          linkedin_id: string | null
          profile_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits?: number
          email?: string | null
          email_sent?: boolean | null
          first_name?: string | null
          id: string
          last_name?: string | null
          linkedin_id?: string | null
          profile_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          email?: string | null
          email_sent?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          linkedin_id?: string | null
          profile_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resubump_analysis: {
        Row: {
          analysis_results: Json
          crawled_content: Json | null
          created_at: string
          file_type: string | null
          file_url: string | null
          filename: string | null
          guiding_questions: Json | null
          id: string
          job_descriptions: Json | null
          question_answers: Json | null
          resume_text: string
          structured_resume: Json | null
          tailored_content: string | null
          tailoring_timestamp: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analysis_results: Json
          crawled_content?: Json | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          filename?: string | null
          guiding_questions?: Json | null
          id?: string
          job_descriptions?: Json | null
          question_answers?: Json | null
          resume_text: string
          structured_resume?: Json | null
          tailored_content?: string | null
          tailoring_timestamp?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_results?: Json
          crawled_content?: Json | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          filename?: string | null
          guiding_questions?: Json | null
          id?: string
          job_descriptions?: Json | null
          question_answers?: Json | null
          resume_text?: string
          structured_resume?: Json | null
          tailored_content?: string | null
          tailoring_timestamp?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      resume_analyses: {
        Row: {
          created_at: string
          current_version: Json
          id: string
          improved_version: Json
          resume_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_version: Json
          id?: string
          improved_version: Json
          resume_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_version?: Json
          id?: string
          improved_version?: Json
          resume_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      storyline_behaviorals: {
        Row: {
          additional_documents_path: string | null
          company_description: string | null
          company_name: string | null
          cover_letter_path: string | null
          created_at: string | null
          feedback: Json | null
          id: string
          job_description: string
          job_title: string
          questions: Json | null
          responses: Json | null
          resume_path: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_documents_path?: string | null
          company_description?: string | null
          company_name?: string | null
          cover_letter_path?: string | null
          created_at?: string | null
          feedback?: Json | null
          id?: string
          job_description: string
          job_title: string
          questions?: Json | null
          responses?: Json | null
          resume_path: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_documents_path?: string | null
          company_description?: string | null
          company_name?: string | null
          cover_letter_path?: string | null
          created_at?: string | null
          feedback?: Json | null
          id?: string
          job_description?: string
          job_title?: string
          questions?: Json | null
          responses?: Json | null
          resume_path?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      storyline_job_questions: {
        Row: {
          answer: string | null
          created_at: string | null
          id: string
          iterations: Json | null
          question: string
          question_index: number
          storyline_id: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          answer?: string | null
          created_at?: string | null
          id?: string
          iterations?: Json | null
          question: string
          question_index: number
          storyline_id: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          answer?: string | null
          created_at?: string | null
          id?: string
          iterations?: Json | null
          question?: string
          question_index?: number
          storyline_id?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storyline_job_questions_storyline_id_fkey"
            columns: ["storyline_id"]
            isOneToOne: false
            referencedRelation: "storyline_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      storyline_jobs: {
        Row: {
          additional_documents_path: string | null
          behavioral_id: string | null
          company_description: string | null
          company_name: string | null
          cover_letter_path: string | null
          created_at: string | null
          id: string
          job_description: string
          job_title: string
          openai_response: Json | null
          resume_path: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_documents_path?: string | null
          behavioral_id?: string | null
          company_description?: string | null
          company_name?: string | null
          cover_letter_path?: string | null
          created_at?: string | null
          id?: string
          job_description: string
          job_title: string
          openai_response?: Json | null
          resume_path: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_documents_path?: string | null
          behavioral_id?: string | null
          company_description?: string | null
          company_name?: string | null
          cover_letter_path?: string | null
          created_at?: string | null
          id?: string
          job_description?: string
          job_title?: string
          openai_response?: Json | null
          resume_path?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storyline_jobs_behavioral_id_fkey"
            columns: ["behavioral_id"]
            isOneToOne: false
            referencedRelation: "storyline_behaviorals"
            referencedColumns: ["id"]
          },
        ]
      }
      storyline_user_tokens: {
        Row: {
          created_at: string | null
          id: string
          tokens_remaining: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tokens_remaining?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tokens_remaining?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_metrics: {
        Row: {
          analyze_clicks: number | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analyze_clicks?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analyze_clicks?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_contacts: {
        Row: {
          auth_provider: Database["public"]["Enums"]["auth_provider"]
          completed_at: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone_number: string | null
          product: string
          status: string | null
        }
        Insert: {
          auth_provider: Database["public"]["Enums"]["auth_provider"]
          completed_at?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          phone_number?: string | null
          product: string
          status?: string | null
        }
        Update: {
          auth_provider?: Database["public"]["Enums"]["auth_provider"]
          completed_at?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone_number?: string | null
          product?: string
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_tokens: {
        Args: { user_id: string; amount: number }
        Returns: number
      }
      deduct_user_tokens: {
        Args: { user_id: string; amount: number }
        Returns: number
      }
    }
    Enums: {
      auth_provider:
        | "google"
        | "github"
        | "linkedin"
        | "email"
        | "linkedin_oidc"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      auth_provider: ["google", "github", "linkedin", "email", "linkedin_oidc"],
    },
  },
} as const
