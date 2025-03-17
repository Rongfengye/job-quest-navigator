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
          user_id: string | null
        }
        Insert: {
          additional_documents_path?: string | null
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
          user_id?: string | null
        }
        Update: {
          additional_documents_path?: string | null
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
          user_id?: string | null
        }
        Relationships: []
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
        Args: {
          user_id: string
          amount: number
        }
        Returns: number
      }
      deduct_user_tokens: {
        Args: {
          user_id: string
          amount: number
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
