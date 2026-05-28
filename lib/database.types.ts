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
          starting_weight: number | null;
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
          starting_weight?: number | null;
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
          starting_weight?: number | null;
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
      client_daily_logs: {
        Row: {
          id: string;
          trainer_id: string;
          client_id: string;
          log_date: string;
          body_weight: number | null;
          calories: number | null;
          protein: number | null;
          fat: number | null;
          carbs: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        } & Record<string, unknown>;
        Insert: {
          id?: string;
          trainer_id: string;
          client_id: string;
          log_date: string;
          body_weight?: number | null;
          calories?: number | null;
          protein?: number | null;
          fat?: number | null;
          carbs?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Update: {
          id?: string;
          trainer_id?: string;
          client_id?: string;
          log_date?: string;
          body_weight?: number | null;
          calories?: number | null;
          protein?: number | null;
          fat?: number | null;
          carbs?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Relationships: [
          {
            foreignKeyName: "client_daily_logs_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_daily_logs_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "trainer_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      calendar_events: {
        Row: {
          id: string;
          trainer_id: string;
          client_id: string | null;
          type: "client_training" | "personal" | "break" | "other";
          title: string;
          starts_at: string;
          ends_at: string;
          status: "scheduled" | "started" | "completed" | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string;
        } & Record<string, unknown>;
        Insert: {
          id?: string;
          trainer_id: string;
          client_id?: string | null;
          type: "client_training" | "personal" | "break" | "other";
          title: string;
          starts_at: string;
          ends_at: string;
          status?: "scheduled" | "started" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Update: {
          id?: string;
          trainer_id?: string;
          client_id?: string | null;
          type?: "client_training" | "personal" | "break" | "other";
          title?: string;
          starts_at?: string;
          ends_at?: string;
          status?: "scheduled" | "started" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Relationships: [
          {
            foreignKeyName: "calendar_events_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_events_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "trainer_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      exercises: {
        Row: {
          id: string;
          trainer_id: string | null;
          source_type: "system" | "custom";
          exercise_key: string | null;
          name: string;
          primary_category: string;
          secondary_categories: string[];
          agonists: string[];
          synergists: string[];
          antagonists: string[];
          equipment: string | null;
          movement_pattern: string | null;
          default_intensity_type: "none" | "rpe" | "rir" | "percent" | "time";
          short_description: string | null;
          status: "active" | "archived";
          created_at: string;
          updated_at: string;
        } & Record<string, unknown>;
        Insert: {
          id?: string;
          trainer_id?: string | null;
          source_type: "system" | "custom";
          exercise_key?: string | null;
          name: string;
          primary_category: string;
          secondary_categories?: string[];
          agonists?: string[];
          synergists?: string[];
          antagonists?: string[];
          equipment?: string | null;
          movement_pattern?: string | null;
          default_intensity_type?: "none" | "rpe" | "rir" | "percent" | "time";
          short_description?: string | null;
          status?: "active" | "archived";
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Update: {
          id?: string;
          trainer_id?: string | null;
          source_type?: "system" | "custom";
          exercise_key?: string | null;
          name?: string;
          primary_category?: string;
          secondary_categories?: string[];
          agonists?: string[];
          synergists?: string[];
          antagonists?: string[];
          equipment?: string | null;
          movement_pattern?: string | null;
          default_intensity_type?: "none" | "rpe" | "rir" | "percent" | "time";
          short_description?: string | null;
          status?: "active" | "archived";
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Relationships: [
          {
            foreignKeyName: "exercises_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "trainer_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      workout_sessions: {
        Row: {
          id: string;
          trainer_id: string;
          client_id: string;
          calendar_event_id: string | null;
          status: "started" | "completed" | "cancelled";
          started_at: string;
          completed_at: string | null;
          duration_seconds: number | null;
          coach_notes: string | null;
          created_at: string;
          updated_at: string;
        } & Record<string, unknown>;
        Insert: {
          id?: string;
          trainer_id: string;
          client_id: string;
          calendar_event_id?: string | null;
          status?: "started" | "completed" | "cancelled";
          started_at?: string;
          completed_at?: string | null;
          duration_seconds?: number | null;
          coach_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Update: {
          id?: string;
          trainer_id?: string;
          client_id?: string;
          calendar_event_id?: string | null;
          status?: "started" | "completed" | "cancelled";
          started_at?: string;
          completed_at?: string | null;
          duration_seconds?: number | null;
          coach_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Relationships: [
          {
            foreignKeyName: "workout_sessions_calendar_event_id_fkey";
            columns: ["calendar_event_id"];
            isOneToOne: false;
            referencedRelation: "calendar_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sessions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sessions_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "trainer_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      session_exercises: {
        Row: {
          id: string;
          session_id: string;
          trainer_id: string;
          exercise_id: string | null;
          name: string;
          name_snapshot: string;
          position: number;
          intensity_type: "none" | "rpe" | "rir" | "percent" | "time";
          notes: string | null;
          created_at: string;
          updated_at: string;
        } & Record<string, unknown>;
        Insert: {
          id?: string;
          session_id: string;
          trainer_id: string;
          exercise_id?: string | null;
          name: string;
          name_snapshot: string;
          position?: number;
          intensity_type?: "none" | "rpe" | "rir" | "percent" | "time";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Update: {
          id?: string;
          session_id?: string;
          trainer_id?: string;
          exercise_id?: string | null;
          name?: string;
          name_snapshot?: string;
          position?: number;
          intensity_type?: "none" | "rpe" | "rir" | "percent" | "time";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_exercises_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "trainer_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      session_sets: {
        Row: {
          id: string;
          session_exercise_id: string;
          trainer_id: string;
          position: number;
          weight: number | null;
          reps: number | null;
          intensity_value: number | null;
          is_completed: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        } & Record<string, unknown>;
        Insert: {
          id?: string;
          session_exercise_id: string;
          trainer_id: string;
          position?: number;
          weight?: number | null;
          reps?: number | null;
          intensity_value?: number | null;
          is_completed?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Update: {
          id?: string;
          session_exercise_id?: string;
          trainer_id?: string;
          position?: number;
          weight?: number | null;
          reps?: number | null;
          intensity_value?: number | null;
          is_completed?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        } & Record<string, unknown>;
        Relationships: [
          {
            foreignKeyName: "session_sets_session_exercise_id_fkey";
            columns: ["session_exercise_id"];
            isOneToOne: false;
            referencedRelation: "session_exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_sets_trainer_id_fkey";
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
