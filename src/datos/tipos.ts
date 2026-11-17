// Tipos de la base. Cuando haya un Supabase local, se regeneran con `npm run tipos`.
// Hasta entonces se mantienen a mano, alineados con las migraciones.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RolClub = "admin";

export type Database = {
  public: {
    Tables: {
      club: {
        Row: {
          id: string;
          slug: string;
          nombre: string;
          dominio_base: string | null;
          escudo_ruta: string | null;
          color_principal: string;
          color_claro: string;
          color_2: string | null;
          color_3: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nombre: string;
          dominio_base?: string | null;
          escudo_ruta?: string | null;
          color_principal: string;
          color_claro?: string;
          color_2?: string | null;
          color_3?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          nombre?: string;
          dominio_base?: string | null;
          escudo_ruta?: string | null;
          color_principal?: string;
          color_claro?: string;
          color_2?: string | null;
          color_3?: string | null;
          creado_en?: string;
        };
        Relationships: [];
      };
      usuario: {
        Row: {
          id: string;
          nombre: string;
          email: string;
          creado_en: string;
        };
        Insert: {
          id: string;
          nombre: string;
          email: string;
          creado_en?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          email?: string;
          creado_en?: string;
        };
        Relationships: [];
      };
      super_admin: {
        Row: {
          usuario_id: string;
          creado_en: string;
        };
        Insert: {
          usuario_id: string;
          creado_en?: string;
        };
        Update: {
          usuario_id?: string;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: "super_admin_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: true;
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
        ];
      };
      super_admin_invitacion: {
        Row: {
          id: string;
          email: string;
          creado_en: string;
        };
        Insert: {
          id?: string;
          email: string;
          creado_en?: string;
        };
        Update: {
          id?: string;
          email?: string;
          creado_en?: string;
        };
        Relationships: [];
      };
      club_miembro: {
        Row: {
          id: string;
          club_id: string;
          usuario_id: string;
          rol: RolClub;
          creado_en: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          usuario_id: string;
          rol?: RolClub;
          creado_en?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          usuario_id?: string;
          rol?: RolClub;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_miembro_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "club";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_miembro_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
        ];
      };
      club_invitacion: {
        Row: {
          id: string;
          club_id: string;
          email: string;
          rol: RolClub;
          creado_en: string;
          aceptada_en: string | null;
        };
        Insert: {
          id?: string;
          club_id: string;
          email: string;
          rol?: RolClub;
          creado_en?: string;
          aceptada_en?: string | null;
        };
        Update: {
          id?: string;
          club_id?: string;
          email?: string;
          rol?: RolClub;
          creado_en?: string;
          aceptada_en?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "club_invitacion_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "club";
            referencedColumns: ["id"];
          },
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
      rol_club: RolClub;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Club = Database["public"]["Tables"]["club"]["Row"];
export type Usuario = Database["public"]["Tables"]["usuario"]["Row"];
export type ClubMiembro = Database["public"]["Tables"]["club_miembro"]["Row"];
export type ClubInvitacion =
  Database["public"]["Tables"]["club_invitacion"]["Row"];
