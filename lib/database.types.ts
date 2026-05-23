export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      trainer_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          phone: string | null;
          timezone: string;
          specialization: string | null;
          onboarding_status: string;
          created_at: string;
          updated_at: string;
        } & Record<string, unknown>;
        Insert: {
          id: string;
          display_name?: string | null;
          phone?: string | null;
          timezone?: string;
          specialization?: string | null;
          onboarding_status?: string;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Update: {
          id?: string;
          display_name?: string | null;
          phone?: string | null;
          timezone?: string;
          specialization?: string | null;
          onboarding_status?: string;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          trainer_id: string;
          name: string;
          preferred_name: string | null;
          phone: string | null;
          email: string | null;
          birth_date: string | null;
          sex: string | null;
          goal: string | null;
          level: string | null;
          limitations: string | null;
          injuries: string | null;
          notes: string | null;
          training_frequency: string | null;
          training_split: string | null;
          status: "active" | "paused" | "archived";
          started_at: string | null;
          created_at: string;
          updated_at: string;
        } & Record<string, unknown>;
        Insert: {
          id?: string;
          trainer_id: string;
          name: string;
          preferred_name?: string | null;
          phone?: string | null;
          email?: string | null;
          birth_date?: string | null;
          sex?: string | null;
          goal?: string | null;
          level?: string | null;
          limitations?: string | null;
          injuries?: string | null;
          notes?: string | null;
          training_frequency?: string | null;
          training_split?: string | null;
          status?: "active" | "paused" | "archived";
          started_at?: string | null;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Update: {
          id?: string;
          trainer_id?: string;
          name?: string;
          preferred_name?: string | null;
          phone?: string | null;
          email?: string | null;
          birth_date?: string | null;
          sex?: string | null;
          goal?: string | null;
          level?: string | null;
          limitations?: string | null;
          injuries?: string | null;
          notes?: string | null;
          training_frequency?: string | null;
          training_split?: string | null;
          status?: "active" | "paused" | "archived";
          started_at?: string | null;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Relationships: [
          {
            foreignKeyName: "clients_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "trainer_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Update"];
