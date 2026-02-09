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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in_time: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          permit_file_url: string | null
          photo_url: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          permit_file_url?: string | null
          photo_url?: string | null
          recorded_by?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          permit_file_url?: string | null
          photo_url?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      class_locations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          created_at: string
          date: string
          description: string | null
          grade: number
          grade_type: Database["public"]["Enums"]["grade_type"]
          id: string
          student_id: string
          subject_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string | null
          grade: number
          grade_type: Database["public"]["Enums"]["grade_type"]
          id?: string
          student_id: string
          subject_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          grade?: number
          grade_type?: Database["public"]["Enums"]["grade_type"]
          id?: string
          student_id?: string
          subject_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      journals: {
        Row: {
          class_id: string
          created_at: string
          date: string
          description: string
          id: string
          location_id: string
          teacher_id: string
          teaching_hours: number
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          description: string
          id?: string
          location_id: string
          teacher_id: string
          teaching_hours: number
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          location_id?: string
          teacher_id?: string
          teaching_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journals_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journals_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "class_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      pengurus_kelas_access: {
        Row: {
          class_id: string
          granted_at: string
          granted_by: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          granted_at?: string
          granted_by: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          granted_at?: string
          granted_by?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengurus_kelas_access_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          class: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          class?: string | null
          created_at?: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          class?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          class_id: string | null
          created_at: string
          full_name: string
          id: string
          nis: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          nis: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          nis?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          nit: string
          password_hash: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          nit: string
          password_hash: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          nit?: string
          password_hash?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_password: { Args: { password: string }; Returns: string }
      is_pengurus_kelas: {
        Args: { _class_name: string; _user_id: string }
        Returns: boolean
      }
      verify_password: {
        Args: { input_password: string; stored_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "guru" | "siswa" | "pengurus_kelas"
      attendance_status: "hadir" | "izin" | "sakit" | "alpha"
      grade_type: "ulangan_harian" | "tugas" | "kegiatan_harian"
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
      app_role: ["guru", "siswa", "pengurus_kelas"],
      attendance_status: ["hadir", "izin", "sakit", "alpha"],
      grade_type: ["ulangan_harian", "tugas", "kegiatan_harian"],
    },
  },
} as const
