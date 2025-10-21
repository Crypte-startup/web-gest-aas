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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          adresse_ecole: string | null
          classe: string | null
          created_at: string
          created_by: string | null
          date_naissance: string | null
          domicile: string | null
          ecole: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          postnom: string | null
          prenom: string | null
          trajet: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          adresse_ecole?: string | null
          classe?: string | null
          created_at?: string
          created_by?: string | null
          date_naissance?: string | null
          domicile?: string | null
          ecole?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          postnom?: string | null
          prenom?: string | null
          trajet?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          adresse_ecole?: string | null
          classe?: string | null
          created_at?: string
          created_by?: string | null
          date_naissance?: string | null
          domicile?: string | null
          ecole?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          postnom?: string | null
          prenom?: string | null
          trajet?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      commercial_clients: {
        Row: {
          adresse: string | null
          created_at: string
          created_by: string | null
          date_naissance: string | null
          email: string | null
          id: string
          lieu_naissance: string | null
          nom: string
          postnom: string | null
          prenom: string | null
          sexe: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          created_by?: string | null
          date_naissance?: string | null
          email?: string | null
          id?: string
          lieu_naissance?: string | null
          nom: string
          postnom?: string | null
          prenom?: string | null
          sexe?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          created_by?: string | null
          date_naissance?: string | null
          email?: string | null
          id?: string
          lieu_naissance?: string | null
          nom?: string
          postnom?: string | null
          prenom?: string | null
          sexe?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      devis: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string
          created_by: string | null
          devise: string
          id: string
          montant: number
          motif: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          client_name: string
          created_at?: string
          created_by?: string | null
          devise: string
          id?: string
          montant: number
          motif?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          devise?: string
          id?: string
          montant?: number
          motif?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          adresse: string | null
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency"]
          date_naissance: string | null
          department: string | null
          email: string | null
          full_name: string | null
          hire_date: string | null
          id: string
          nom: string | null
          phone: string | null
          position: string | null
          postnom: string | null
          prenom: string | null
          salary: number | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency"]
          date_naissance?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          hire_date?: string | null
          id?: string
          nom?: string | null
          phone?: string | null
          position?: string | null
          postnom?: string | null
          prenom?: string | null
          salary?: number | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency"]
          date_naissance?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          hire_date?: string | null
          id?: string
          nom?: string | null
          phone?: string | null
          position?: string | null
          postnom?: string | null
          prenom?: string | null
          salary?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      facture: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string
          created_by: string | null
          devise: string
          id: string
          montant: number
          motif: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          client_name: string
          created_at?: string
          created_by?: string | null
          devise: string
          id?: string
          montant: number
          motif?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          devise?: string
          id?: string
          montant?: number
          motif?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facture_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger: {
        Row: {
          account_owner: string | null
          amount: number
          client_name: string | null
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency"]
          entry_id: string
          entry_kind: string
          id: string
          motif: string | null
          status: Database["public"]["Enums"]["entry_status"]
          updated_at: string
        }
        Insert: {
          account_owner?: string | null
          amount: number
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          currency: Database["public"]["Enums"]["currency"]
          entry_id: string
          entry_kind: string
          id?: string
          motif?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          updated_at?: string
        }
        Update: {
          account_owner?: string | null
          amount?: number
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency"]
          entry_id?: string
          entry_kind?: string
          id?: string
          motif?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      starting_balances: {
        Row: {
          account: string
          amount: number
          created_at: string
          currency: Database["public"]["Enums"]["currency"]
          id: string
          user_id: string | null
        }
        Insert: {
          account: string
          amount?: number
          created_at?: string
          currency: Database["public"]["Enums"]["currency"]
          id?: string
          user_id?: string | null
        }
        Update: {
          account?: string
          amount?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency"]
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_manager: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "resp_compta"
        | "caissier"
        | "prepose_clientele"
        | "resp_clientele"
        | "prepose_log"
        | "resp_log"
        | "prepose_rh"
        | "resp_rh"
        | "prepose_comm"
        | "resp_comm"
        | "caissier1"
        | "caissier2"
        | "caissier3"
        | "caissier4"
        | "caissier5"
      currency: "USD" | "CDF"
      entry_status:
        | "ENREGISTRE"
        | "VALIDE"
        | "APPROUVE"
        | "PENDING_RESP"
        | "PENDING_ADMIN"
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
      app_role: [
        "admin",
        "resp_compta",
        "caissier",
        "prepose_clientele",
        "resp_clientele",
        "prepose_log",
        "resp_log",
        "prepose_rh",
        "resp_rh",
        "prepose_comm",
        "resp_comm",
        "caissier1",
        "caissier2",
        "caissier3",
        "caissier4",
        "caissier5",
      ],
      currency: ["USD", "CDF"],
      entry_status: [
        "ENREGISTRE",
        "VALIDE",
        "APPROUVE",
        "PENDING_RESP",
        "PENDING_ADMIN",
      ],
    },
  },
} as const
