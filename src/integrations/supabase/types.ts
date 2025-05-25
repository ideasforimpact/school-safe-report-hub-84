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
      backoffice_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_saas_admin: boolean
          last_signed_in: string | null
          password: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_saas_admin?: boolean
          last_signed_in?: string | null
          password: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_saas_admin?: boolean
          last_signed_in?: string | null
          password?: string
          updated_at?: string
        }
        Relationships: []
      }
      campuses: {
        Row: {
          client_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campuses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_modules: {
        Row: {
          access_level: Json
          client_id: string
          enabled: boolean
          id: string
          module_id: string | null
        }
        Insert: {
          access_level?: Json
          client_id: string
          enabled?: boolean
          id?: string
          module_id?: string | null
        }
        Update: {
          access_level?: Json
          client_id?: string
          enabled?: boolean
          id?: string
          module_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_modules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          active: boolean
          allowed_domains: string | null
          auth_providers: string | null
          contact_person: string | null
          creation_date: string
          email: string | null
          id: string
          institution_type: string | null
          logo: string | null
          name: string
          phone: string | null
          super_admin_allowed_domain: string | null
        }
        Insert: {
          active?: boolean
          allowed_domains?: string | null
          auth_providers?: string | null
          contact_person?: string | null
          creation_date?: string
          email?: string | null
          id?: string
          institution_type?: string | null
          logo?: string | null
          name: string
          phone?: string | null
          super_admin_allowed_domain?: string | null
        }
        Update: {
          active?: boolean
          allowed_domains?: string | null
          auth_providers?: string | null
          contact_person?: string | null
          creation_date?: string
          email?: string | null
          id?: string
          institution_type?: string | null
          logo?: string | null
          name?: string
          phone?: string | null
          super_admin_allowed_domain?: string | null
        }
        Relationships: []
      }
      contributing_factors: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          weight: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          weight?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributing_factors_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_status: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_document_type: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_status_id: string | null
          document_type_id: string | null
          document_url: string
          employee_docs_log: Json | null
          employee_id: string
          id: string
          last_otp_generated: string | null
          params: Json | null
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_status_id?: string | null
          document_type_id?: string | null
          document_url: string
          employee_docs_log?: Json | null
          employee_id: string
          id?: string
          last_otp_generated?: string | null
          params?: Json | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_status_id?: string | null
          document_type_id?: string | null
          document_url?: string
          employee_docs_log?: Json | null
          employee_id?: string
          id?: string
          last_otp_generated?: string | null
          params?: Json | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_document_status_id_fkey"
            columns: ["document_status_id"]
            isOneToOne: false
            referencedRelation: "document_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "employee_document_type"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_modules: {
        Row: {
          access_level: Json | null
          created_at: string
          employee_id: string
          id: string
          module_id: string
          updated_at: string
        }
        Insert: {
          access_level?: Json | null
          created_at?: string
          employee_id: string
          id?: string
          module_id: string
          updated_at?: string
        }
        Update: {
          access_level?: Json | null
          created_at?: string
          employee_id?: string
          id?: string
          module_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_modules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          client_id: string | null
          created_at: string
          department: string
          email: string
          employee_id: string
          employee_type: string
          first_name: string
          id: string
          is_super_admin: boolean
          joining_date: string
          last_name: string
          status: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          department: string
          email: string
          employee_id: string
          employee_type: string
          first_name: string
          id?: string
          is_super_admin?: boolean
          joining_date: string
          last_name: string
          status?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          department?: string
          email?: string
          employee_id?: string
          employee_type?: string
          first_name?: string
          id?: string
          is_super_admin?: boolean
          joining_date?: string
          last_name?: string
          status?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          campus_id: string
          client_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          campus_id: string
          client_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          campus_id?: string
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facilities_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facilities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          campus_id: string
          client_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          campus_id: string
          client_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          campus_id?: string
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_categories: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_categories_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_priorities: {
        Row: {
          client_id: string | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          client_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          client_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_priorities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_report_types: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_report_types_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_status: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      incident_subcategories: {
        Row: {
          category_id: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "incident_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_subcategories_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          category_id: string | null
          client_id: string | null
          created_at: string
          created_by: string
          date: string
          description: string | null
          documents: Json | null
          facility_id: string | null
          id: string
          location_id: string | null
          people_involved: Json
          priority_id: string | null
          status_id: string
          subcategory_id: string | null
          ticket_id: string
          type_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          documents?: Json | null
          facility_id?: string | null
          id?: string
          location_id?: string | null
          people_involved?: Json
          priority_id?: string | null
          status_id: string
          subcategory_id?: string | null
          ticket_id: string
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          documents?: Json | null
          facility_id?: string | null
          id?: string
          location_id?: string | null
          people_involved?: Json
          priority_id?: string | null
          status_id?: string
          subcategory_id?: string | null
          ticket_id?: string
          type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_incident_status"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "incident_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "incident_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "incident_priorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "incident_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "incident_report_types"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          level: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          level: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          level?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          active: boolean
          description: string | null
          id: string
          key: string
          name: string
        }
        Insert: {
          active?: boolean
          description?: string | null
          id?: string
          key: string
          name: string
        }
        Update: {
          active?: boolean
          description?: string | null
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          campus_id: string | null
          client_id: string
          created_at: string
          grade_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          campus_id?: string | null
          client_id: string
          created_at?: string
          grade_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          campus_id?: string | null
          client_id?: string
          created_at?: string
          grade_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          campus: string
          client_id: string | null
          created_at: string
          grade: string
          id: string
          name: string
          section: string
          student_id: string
          updated_at: string
        }
        Insert: {
          campus: string
          client_id?: string | null
          created_at?: string
          grade: string
          id?: string
          name: string
          section: string
          student_id: string
          updated_at?: string
        }
        Update: {
          campus?: string
          client_id?: string | null
          created_at?: string
          grade?: string
          id?: string
          name?: string
          section?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_documents: {
        Row: {
          created_at: string
          documents: Json
          id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          documents?: Json
          id?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          documents?: Json
          id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number | null
          client_id: string | null
          created_at: string
          driver: string
          id: string
          make: string
          model: string
          registration_number: string
          route: string
          status: string
          type: string
          updated_at: string
          verification_data: Json | null
          verification_date: string | null
          verification_status: string | null
          year: number
        }
        Insert: {
          capacity?: number | null
          client_id?: string | null
          created_at?: string
          driver: string
          id?: string
          make: string
          model: string
          registration_number: string
          route: string
          status?: string
          type: string
          updated_at?: string
          verification_data?: Json | null
          verification_date?: string | null
          verification_status?: string | null
          year: number
        }
        Update: {
          capacity?: number | null
          client_id?: string | null
          created_at?: string
          driver?: string
          id?: string
          make?: string
          model?: string
          registration_number?: string
          route?: string
          status?: string
          type?: string
          updated_at?: string
          verification_data?: Json | null
          verification_date?: string | null
          verification_status?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrypt_document_number: {
        Args: { encrypted_doc_number: string }
        Returns: string
      }
      drop_module_key_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      encrypt_document_number: {
        Args: { doc_number: string }
        Returns: string
      }
      get_masked_document_number: {
        Args: { encrypted_doc_number: string }
        Returns: string
      }
      hash_password: {
        Args: { password: string }
        Returns: string
      }
      verify_password: {
        Args: { email: string; password_attempt: string }
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
    Enums: {},
  },
} as const
