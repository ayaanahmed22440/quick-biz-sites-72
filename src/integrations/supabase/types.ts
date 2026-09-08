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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          business_id: string | null
          created_at: string
          id: string
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          business_id: string | null
          created_at: string
          error: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          status: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          error?: string | null
          event_id: string
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          status?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          error?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          business_id: string
          closes_at: string | null
          day_of_week: number
          id: string
          is_closed: boolean
          opens_at: string | null
        }
        Insert: {
          business_id: string
          closes_at?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean
          opens_at?: string | null
        }
        Update: {
          business_id?: string
          closes_at?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean
          opens_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address_line1: string | null
          city: string | null
          country: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          niche: string
          onboarding_completed: boolean
          owner_id: string
          phone: string | null
          postal_code: string | null
          primary_color: string
          primary_service: string | null
          secondary_color: string
          slug: string
          state: string | null
          suspended: boolean
          tagline: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          city?: string | null
          country?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          niche?: string
          onboarding_completed?: boolean
          owner_id: string
          phone?: string | null
          postal_code?: string | null
          primary_color?: string
          primary_service?: string | null
          secondary_color?: string
          slug: string
          state?: string | null
          suspended?: boolean
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          city?: string | null
          country?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          niche?: string
          onboarding_completed?: boolean
          owner_id?: string
          phone?: string | null
          postal_code?: string | null
          primary_color?: string
          primary_service?: string | null
          secondary_color?: string
          slug?: string
          state?: string | null
          suspended?: boolean
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      checkout_sessions: {
        Row: {
          business_id: string
          checkout_url: string | null
          completed_at: string | null
          created_at: string
          id: string
          plan_id: string
          return_path: string
          status: string
          updated_at: string
          user_id: string
          whop_plan_id: string
        }
        Insert: {
          business_id: string
          checkout_url?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          plan_id: string
          return_path?: string
          status?: string
          updated_at?: string
          user_id: string
          whop_plan_id: string
        }
        Update: {
          business_id?: string
          checkout_url?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          plan_id?: string
          return_path?: string
          status?: string
          updated_at?: string
          user_id?: string
          whop_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          business_name: string | null
          created_at: string
          email: string
          handled: boolean
          id: string
          message: string
          name: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email: string
          handled?: boolean
          id?: string
          message: string
          name: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string
          handled?: boolean
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      domains: {
        Row: {
          business_id: string
          created_at: string
          dns_notes: string | null
          domain: string
          expires_at: string | null
          id: string
          kind: Database["public"]["Enums"]["domain_kind"]
          ssl_active: boolean
          status: Database["public"]["Enums"]["domain_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          dns_notes?: string | null
          domain: string
          expires_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["domain_kind"]
          ssl_active?: boolean
          status?: Database["public"]["Enums"]["domain_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          dns_notes?: string | null
          domain?: string
          expires_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["domain_kind"]
          ssl_active?: boolean
          status?: Database["public"]["Enums"]["domain_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "domains_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          business_id: string
          config: Json
          created_at: string
          id: string
          provider: string
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          config?: Json
          created_at?: string
          id?: string
          provider: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          config?: Json
          created_at?: string
          id?: string
          provider?: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          preferred_time: string | null
          service: string | null
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          preferred_time?: string | null
          service?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          preferred_time?: string | null
          service?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string | null
          business_id: string
          created_at: string
          id: string
          kind: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          business_id: string
          created_at?: string
          id?: string
          kind?: string
          url: string
        }
        Update: {
          alt_text?: string | null
          business_id?: string
          created_at?: string
          id?: string
          kind?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          business_id: string | null
          created_at: string
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          entitlements: Json
          id: string
          is_active: boolean
          name: string
          price_cents: number
          sort_order: number
          tagline: string | null
          updated_at: string
          whop_plan_id: string | null
        }
        Insert: {
          created_at?: string
          entitlements?: Json
          id: string
          is_active?: boolean
          name: string
          price_cents: number
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          whop_plan_id?: string | null
        }
        Update: {
          created_at?: string
          entitlements?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          whop_plan_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          business_id: string
          id: string
          indexing_enabled: boolean
          localbusiness_schema: boolean
          meta_description: string | null
          meta_title: string | null
          primary_city: string | null
          primary_keyword: string | null
          robots_enabled: boolean
          service_schema: boolean
          sitemap_enabled: boolean
          updated_at: string
        }
        Insert: {
          business_id: string
          id?: string
          indexing_enabled?: boolean
          localbusiness_schema?: boolean
          meta_description?: string | null
          meta_title?: string | null
          primary_city?: string | null
          primary_keyword?: string | null
          robots_enabled?: boolean
          service_schema?: boolean
          sitemap_enabled?: boolean
          updated_at?: string
        }
        Update: {
          business_id?: string
          id?: string
          indexing_enabled?: boolean
          localbusiness_schema?: boolean
          meta_description?: string | null
          meta_title?: string | null
          primary_city?: string | null
          primary_keyword?: string | null
          robots_enabled?: boolean
          service_schema?: boolean
          sitemap_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_targets: {
        Row: {
          business_id: string
          created_at: string
          id: string
          keyword: string
          location: string | null
          page_path: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          keyword: string
          location?: string | null
          page_path?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          keyword?: string
          location?: string | null
          page_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_targets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          business_id: string
          city: string
          created_at: string
          id: string
          is_primary: boolean
          state: string | null
        }
        Insert: {
          business_id: string
          city: string
          created_at?: string
          id?: string
          is_primary?: boolean
          state?: string | null
        }
        Update: {
          business_id?: string
          city?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_areas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          price_note: string | null
          sort_order: number
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price_note?: string | null
          sort_order?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price_note?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          business_id: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          last_payment_failed_at: string | null
          plan_id: string
          provider: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          whop_membership_id: string | null
          whop_plan_id: string | null
          whop_user_id: string | null
        }
        Insert: {
          business_id: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_payment_failed_at?: string | null
          plan_id: string
          provider?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          whop_membership_id?: string | null
          whop_plan_id?: string | null
          whop_user_id?: string | null
        }
        Update: {
          business_id?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_payment_failed_at?: string | null
          plan_id?: string
          provider?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          whop_membership_id?: string | null
          whop_plan_id?: string | null
          whop_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          body: string
          business_id: string
          created_at: string
          created_by: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          body: string
          business_id: string
          created_at?: string
          created_by: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          body?: string
          business_id?: string
          created_at?: string
          created_by?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      template_versions: {
        Row: {
          config: Json
          created_at: string
          id: string
          status: Database["public"]["Enums"]["template_status"]
          template_id: string
          version: number
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["template_status"]
          template_id: string
          version: number
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["template_status"]
          template_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          created_by: string | null
          current_version: number
          description: string | null
          id: string
          name: string
          niche: string
          preview_image_url: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          status: Database["public"]["Enums"]["template_status"]
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_version?: number
          description?: string | null
          id?: string
          name: string
          niche?: string
          preview_image_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          status?: Database["public"]["Enums"]["template_status"]
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_version?: number
          description?: string | null
          id?: string
          name?: string
          niche?: string
          preview_image_url?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["template_status"]
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          author_id: string | null
          body: string
          business_id: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          business_id: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          business_id?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
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
      website_customizations: {
        Row: {
          business_id: string
          draft_content: Json
          id: string
          published_content: Json | null
          updated_at: string
          website_id: string
        }
        Insert: {
          business_id: string
          draft_content?: Json
          id?: string
          published_content?: Json | null
          updated_at?: string
          website_id: string
        }
        Update: {
          business_id?: string
          draft_content?: Json
          id?: string
          published_content?: Json | null
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_customizations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_customizations_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: true
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          business_id: string
          created_at: string
          id: string
          published_at: string | null
          status: Database["public"]["Enums"]["website_status"]
          subdomain: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["website_status"]
          subdomain?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["website_status"]
          subdomain?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "websites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "websites_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_published_site: { Args: { p_slug: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_business_member: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_staff: { Args: { _user_id: string }; Returns: boolean }
      list_published_site_slugs: {
        Args: never
        Returns: {
          published_at: string
          slug: string
        }[]
      }
      submit_website_lead: {
        Args: {
          p_email?: string
          p_message?: string
          p_name: string
          p_phone?: string
          p_preferred_time?: string
          p_service?: string
          p_slug: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer"
      domain_kind: "connected" | "purchased" | "subdomain"
      domain_status:
        | "pending"
        | "verifying"
        | "active"
        | "error"
        | "not_configured"
      integration_status: "not_connected" | "pending" | "connected" | "error"
      lead_status: "new" | "contacted" | "qualified" | "won" | "lost"
      member_role: "owner" | "manager" | "editor"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "expired"
      template_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "published"
        | "rejected"
        | "archived"
      ticket_priority: "normal" | "priority"
      ticket_status: "open" | "pending" | "resolved" | "closed"
      website_status: "draft" | "published" | "suspended"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "staff", "customer"],
      domain_kind: ["connected", "purchased", "subdomain"],
      domain_status: [
        "pending",
        "verifying",
        "active",
        "error",
        "not_configured",
      ],
      integration_status: ["not_connected", "pending", "connected", "error"],
      lead_status: ["new", "contacted", "qualified", "won", "lost"],
      member_role: ["owner", "manager", "editor"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "expired",
      ],
      template_status: [
        "draft",
        "pending_review",
        "approved",
        "published",
        "rejected",
        "archived",
      ],
      ticket_priority: ["normal", "priority"],
      ticket_status: ["open", "pending", "resolved", "closed"],
      website_status: ["draft", "published", "suspended"],
    },
  },
} as const
