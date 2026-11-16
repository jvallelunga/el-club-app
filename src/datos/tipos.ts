// Tipos de la base. Cuando haya un Supabase local, se regeneran con `npm run tipos`.
// Hasta entonces se mantienen a mano, alineados con la migración inicial de `club`.

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
      club: {
        Row: {
          id: string;
          slug: string;
          nombre: string;
          creado_en: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nombre: string;
          creado_en?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          nombre?: string;
          creado_en?: string;
        };
        Relationships: [];
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
