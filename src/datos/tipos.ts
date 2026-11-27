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
          telefono: string | null;
          email: string | null;
          direccion: string | null;
          web: string | null;
          creado_en: string;
          borrado_en: string | null;
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
          telefono?: string | null;
          email?: string | null;
          direccion?: string | null;
          web?: string | null;
          creado_en?: string;
          borrado_en?: string | null;
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
          telefono?: string | null;
          email?: string | null;
          direccion?: string | null;
          web?: string | null;
          creado_en?: string;
          borrado_en?: string | null;
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
      club_deporte: {
        Row: {
          club_id: string;
          deporte_id: string;
          condicion: Json;
          creado_en: string;
        };
        Insert: {
          club_id: string;
          deporte_id: string;
          condicion?: Json;
          creado_en?: string;
        };
        Update: {
          club_id?: string;
          deporte_id?: string;
          condicion?: Json;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_deporte_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "club";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_deporte_deporte_id_fkey";
            columns: ["deporte_id"];
            isOneToOne: false;
            referencedRelation: "deporte";
            referencedColumns: ["id"];
          },
        ];
      };
      club_red_social: {
        Row: {
          id: string;
          club_id: string;
          red: string;
          etiqueta: string | null;
          valor: string;
          orden: number;
          creado_en: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          red: string;
          etiqueta?: string | null;
          valor: string;
          orden?: number;
          creado_en?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          red?: string;
          etiqueta?: string | null;
          valor?: string;
          orden?: number;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_red_social_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "club";
            referencedColumns: ["id"];
          },
        ];
      };
      sede: {
        Row: {
          id: string;
          club_id: string;
          nombre: string;
          direccion: string | null;
          maps_url: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          nombre: string;
          direccion?: string | null;
          maps_url?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          nombre?: string;
          direccion?: string | null;
          maps_url?: string | null;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sede_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "club";
            referencedColumns: ["id"];
          },
        ];
      };
      predio: {
        Row: {
          id: string;
          sede_id: string;
          origen_lat: number;
          origen_lng: number;
          area: Json;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          id?: string;
          sede_id: string;
          origen_lat: number;
          origen_lng: number;
          area?: Json;
          creado_en?: string;
          actualizado_en?: string;
        };
        Update: {
          id?: string;
          sede_id?: string;
          origen_lat?: number;
          origen_lng?: number;
          area?: Json;
          creado_en?: string;
          actualizado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: "predio_sede_id_fkey";
            columns: ["sede_id"];
            isOneToOne: true;
            referencedRelation: "sede";
            referencedColumns: ["id"];
          },
        ];
      };
      deporte: {
        Row: {
          id: string;
          nombre: string;
          icono: string;
          descripcion: string | null;
          condicion: Json;
          borrado_en: string | null;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          icono: string;
          descripcion?: string | null;
          condicion?: Json;
          borrado_en?: string | null;
          creado_en?: string;
          actualizado_en?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          icono?: string;
          descripcion?: string | null;
          condicion?: Json;
          borrado_en?: string | null;
          creado_en?: string;
          actualizado_en?: string;
        };
        Relationships: [];
      };
      elemento_predio: {
        Row: {
          id: string;
          predio_id: string;
          instalacion_id: string | null;
          tipo_referencia: string | null;
          nombre: string | null;
          este: number | null;
          norte: number | null;
          rotacion: number | null;
          puntos: Json | null;
          medidas: Json;
          descripcion: string | null;
          orden_leyenda: number | null;
          en_leyenda: boolean;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          id?: string;
          predio_id: string;
          instalacion_id?: string | null;
          tipo_referencia?: string | null;
          nombre?: string | null;
          este?: number | null;
          norte?: number | null;
          rotacion?: number | null;
          puntos?: Json | null;
          medidas?: Json;
          descripcion?: string | null;
          orden_leyenda?: number | null;
          en_leyenda?: never;
          creado_en?: string;
          actualizado_en?: string;
        };
        Update: {
          id?: string;
          predio_id?: string;
          instalacion_id?: string | null;
          tipo_referencia?: string | null;
          nombre?: string | null;
          este?: number | null;
          norte?: number | null;
          rotacion?: number | null;
          puntos?: Json | null;
          medidas?: Json;
          descripcion?: string | null;
          orden_leyenda?: number | null;
          en_leyenda?: never;
          creado_en?: string;
          actualizado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: "elemento_predio_predio_id_fkey";
            columns: ["predio_id"];
            isOneToOne: false;
            referencedRelation: "predio";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "elemento_predio_instalacion_id_fkey";
            columns: ["instalacion_id"];
            isOneToOne: true;
            referencedRelation: "instalacion";
            referencedColumns: ["id"];
          },
        ];
      };
      instalacion: {
        Row: {
          id: string;
          sede_id: string;
          tipo: string;
          nombre: string;
          notas: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          sede_id: string;
          tipo: string;
          nombre: string;
          notas?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          sede_id?: string;
          tipo?: string;
          nombre?: string;
          notas?: string | null;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instalacion_sede_id_fkey";
            columns: ["sede_id"];
            isOneToOne: false;
            referencedRelation: "sede";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      aplicar_invitaciones_al_entrar: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      guardar_contacto_club: {
        Args: {
          p_club_id: string;
          p_telefono: string | null;
          p_email: string | null;
          p_direccion: string | null;
          p_web: string | null;
          p_redes: Json;
        };
        Returns: undefined;
      };
      guardar_predio: {
        Args: {
          p_sede_id: string;
          p_origen_lat: number;
          p_origen_lng: number;
          p_area: Json;
          p_instalaciones: Json;
          p_referencias: Json;
        };
        Returns: undefined;
      };
      puede_solicitar_ingreso_email: {
        Args: { p_email: string };
        Returns: boolean;
      };
      marca_publica_del_club: {
        Args: { p_slug?: string | null; p_dominio_base?: string | null };
        Returns: {
          slug: string;
          nombre: string;
          escudo_ruta: string | null;
          color_principal: string;
          color_claro: string;
          color_2: string | null;
          color_3: string | null;
        }[];
      };
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

export type ClubRedSocial = Database["public"]["Tables"]["club_red_social"]["Row"];
export type Sede = Database["public"]["Tables"]["sede"]["Row"];
export type Instalacion = Database["public"]["Tables"]["instalacion"]["Row"];
export type Predio = Database["public"]["Tables"]["predio"]["Row"];
