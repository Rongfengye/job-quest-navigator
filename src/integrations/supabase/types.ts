export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      hireme_feedback: {
        Row: {
          created_at: string
          feedback: string[]
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback?: string[]
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback?: string[]
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      hireme_user_status: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          user_plan_status: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          user_plan_status?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          user_plan_status?: number
        }
        Relationships: []
      }
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
          user_feedback_text: string | null
          user_id: string | null
          user_resume_feedback: number | null
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
          user_feedback_text?: string | null
          user_id?: string | null
          user_resume_feedback?: number | null
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
          user_feedback_text?: string | null
          user_id?: string | null
          user_resume_feedback?: number | null
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
      storyline_user_monthly_usage: {
        Row: {
          behavioral_practices_count: number
          created_at: string
          id: string
          month_year: string
          question_vaults_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          behavioral_practices_count?: number
          created_at?: string
          id?: string
          month_year: string
          question_vaults_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          behavioral_practices_count?: number
          created_at?: string
          id?: string
          month_year?: string
          question_vaults_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
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
      check_user_monthly_usage: {
        Args: { user_id: string; usage_type: string }
        Returns: Json
      }
      deduct_user_tokens: {
        Args: { user_id: string; amount: number }
        Returns: number
      }
      get_user_monthly_usage_summary: {
        Args: { user_id: string }
        Returns: Json
      }
      increment_user_monthly_usage: {
        Args: { user_id: string; usage_type: string }
        Returns: Json
      }
      make_user_basic: {
        Args: { user_id: string; amount?: number }
        Returns: number
      }
      make_user_premium: {
        Args: { user_id: string; amount?: number }
        Returns: number
      }
      toggle_user_premium: {
        Args: { user_id: string }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
