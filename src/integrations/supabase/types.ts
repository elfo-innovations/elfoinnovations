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
      about_content: {
        Row: {
          created_at: string
          description: string | null
          eyebrow: string | null
          id: string
          image_url: string | null
          mission: string | null
          stats: Json
          title: string
          updated_at: string
          vision: string | null
          why_us: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          eyebrow?: string | null
          id?: string
          image_url?: string | null
          mission?: string | null
          stats?: Json
          title?: string
          updated_at?: string
          vision?: string | null
          why_us?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          eyebrow?: string | null
          id?: string
          image_url?: string | null
          mission?: string | null
          stats?: Json
          title?: string
          updated_at?: string
          vision?: string | null
          why_us?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      before_after_items: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author_name: string
          content_md: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_minutes: number | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          content_md?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_minutes?: number | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          content_md?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_minutes?: number | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_invoices: {
        Row: {
          amount: number | null
          client_id: string
          created_at: string
          currency: string | null
          file_name: string | null
          file_url: string | null
          id: string
          note: string | null
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          client_id: string
          created_at?: string
          currency?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          note?: string | null
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          client_id?: string
          created_at?: string
          currency?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          note?: string | null
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_reviews: {
        Row: {
          allow_public: boolean
          client_id: string | null
          client_name: string
          company: string | null
          created_at: string
          email: string | null
          id: string
          message: string
          project_id: string | null
          rating: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["review_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_public?: boolean
          client_id?: string | null
          client_name: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message: string
          project_id?: string | null
          rating: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_public?: boolean
          client_id?: string | null
          client_name?: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          project_id?: string | null
          rating?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          closed_at: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          source_lead_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          closed_at?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          source_lead_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          closed_at?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          source_lead_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_source_lead_id_fkey"
            columns: ["source_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string | null
          created_at: string
          developer_id: string | null
          id: string
          kind: string
          project_id: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          developer_id?: string | null
          id?: string
          kind?: string
          project_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          developer_id?: string | null
          id?: string
          kind?: string
          project_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_applications: {
        Row: {
          admin_notes: string | null
          bio: string
          city: string
          country: string
          created_at: string
          created_user_id: string | null
          current_status: string
          decision_message: string | null
          decision_subject: string | null
          email: string
          full_name: string
          github_url: string
          id: string
          linkedin_url: string | null
          motivation: string
          phone: string
          portfolio_url: string | null
          primary_role: string
          resume_name: string | null
          resume_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skills: string[]
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          years_experience: string
        }
        Insert: {
          admin_notes?: string | null
          bio: string
          city: string
          country: string
          created_at?: string
          created_user_id?: string | null
          current_status: string
          decision_message?: string | null
          decision_subject?: string | null
          email: string
          full_name: string
          github_url: string
          id?: string
          linkedin_url?: string | null
          motivation: string
          phone: string
          portfolio_url?: string | null
          primary_role: string
          resume_name?: string | null
          resume_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[]
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          years_experience: string
        }
        Update: {
          admin_notes?: string | null
          bio?: string
          city?: string
          country?: string
          created_at?: string
          created_user_id?: string | null
          current_status?: string
          decision_message?: string | null
          decision_subject?: string | null
          email?: string
          full_name?: string
          github_url?: string
          id?: string
          linkedin_url?: string | null
          motivation?: string
          phone?: string
          portfolio_url?: string | null
          primary_role?: string
          resume_name?: string | null
          resume_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[]
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          years_experience?: string
        }
        Relationships: []
      }
      developers: {
        Row: {
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          skills: string[] | null
          status: Database["public"]["Enums"]["developer_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["developer_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["developer_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      hero_content: {
        Row: {
          created_at: string
          description: string | null
          eyebrow: string | null
          heading: string
          heading_font: string | null
          highlight: string | null
          id: string
          image_url: string | null
          primary_cta_action: string | null
          primary_cta_label: string | null
          secondary_cta_href: string | null
          secondary_cta_label: string | null
          trust_items: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          eyebrow?: string | null
          heading?: string
          heading_font?: string | null
          highlight?: string | null
          id?: string
          image_url?: string | null
          primary_cta_action?: string | null
          primary_cta_label?: string | null
          secondary_cta_href?: string | null
          secondary_cta_label?: string | null
          trust_items?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          eyebrow?: string | null
          heading?: string
          heading_font?: string | null
          highlight?: string | null
          id?: string
          image_url?: string | null
          primary_cta_action?: string | null
          primary_cta_label?: string | null
          secondary_cta_href?: string | null
          secondary_cta_label?: string | null
          trust_items?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          budget_readiness: Database["public"]["Enums"]["budget_readiness"]
          company: string | null
          converted_client_id: string | null
          country: string | null
          country_code: string | null
          created_at: string
          email: string
          estimated_budget: string | null
          follow_up_at: string | null
          full_name: string
          id: string
          lead_code: string
          notes: string | null
          phone: string
          preferred_contact: string | null
          project_description: string
          status: Database["public"]["Enums"]["lead_status"]
          timeline: string | null
          updated_at: string
        }
        Insert: {
          budget_readiness: Database["public"]["Enums"]["budget_readiness"]
          company?: string | null
          converted_client_id?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          email: string
          estimated_budget?: string | null
          follow_up_at?: string | null
          full_name: string
          id?: string
          lead_code?: string
          notes?: string | null
          phone: string
          preferred_contact?: string | null
          project_description: string
          status?: Database["public"]["Enums"]["lead_status"]
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          budget_readiness?: Database["public"]["Enums"]["budget_readiness"]
          company?: string | null
          converted_client_id?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          email?: string
          estimated_budget?: string | null
          follow_up_at?: string | null
          full_name?: string
          id?: string
          lead_code?: string
          notes?: string | null
          phone?: string
          preferred_contact?: string | null
          project_description?: string
          status?: Database["public"]["Enums"]["lead_status"]
          timeline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      media_library: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          folder: string | null
          id: string
          public_url: string | null
          storage_path: string
          tags: string[]
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          id?: string
          public_url?: string | null
          storage_path: string
          tags?: string[]
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          id?: string
          public_url?: string | null
          storage_path?: string
          tags?: string[]
          uploaded_by?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          body: string | null
          conversation_id: string
          created_at: string
          delivered_at: string | null
          id: string
          read_at: string | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
          sender_role: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      nav_links: {
        Row: {
          created_at: string
          href: string
          id: string
          is_enabled: boolean
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          href: string
          id?: string
          is_enabled?: boolean
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          is_enabled?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          category: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          banner_image_url: string | null
          created_at: string
          cta_href: string | null
          cta_label: string | null
          description: string | null
          discount: string | null
          end_date: string | null
          id: string
          is_active: boolean
          show_popup: boolean
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          discount?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          show_popup?: boolean
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          discount?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          show_popup?: boolean
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          milestone: string
          notes: string | null
          paid_amount: number
          project_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          id?: string
          milestone: string
          notes?: string | null
          paid_amount?: number
          project_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          milestone?: string
          notes?: string | null
          paid_amount?: number
          project_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_projects: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          category: string | null
          client_name: string | null
          created_at: string
          description: string | null
          gallery: Json
          github_url: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          live_url: string | null
          project_name: string
          sort_order: number
          technologies: string[]
          updated_at: string
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          category?: string | null
          client_name?: string | null
          created_at?: string
          description?: string | null
          gallery?: Json
          github_url?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          live_url?: string | null
          project_name: string
          sort_order?: number
          technologies?: string[]
          updated_at?: string
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          category?: string | null
          client_name?: string | null
          created_at?: string
          description?: string | null
          gallery?: Json
          github_url?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          live_url?: string | null
          project_name?: string
          sort_order?: number
          technologies?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          created_at: string
          cta_label: string | null
          description: string | null
          features: string[]
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          price: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          description?: string | null
          features?: string[]
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          price: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          description?: string | null
          features?: string[]
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          project_id: string
          stage: Database["public"]["Enums"]["stage_key"] | null
          storage_path: string
          uploaded_by: string | null
          visible_to_client: boolean
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id: string
          stage?: Database["public"]["Enums"]["stage_key"] | null
          storage_path: string
          uploaded_by?: string | null
          visible_to_client?: boolean
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string
          stage?: Database["public"]["Enums"]["stage_key"] | null
          storage_path?: string
          uploaded_by?: string | null
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          admin_approved_at: string | null
          admin_comment: string | null
          client_approved_at: string | null
          client_comment: string | null
          created_at: string
          developer_comment: string | null
          id: string
          project_id: string
          sent_to_client_at: string | null
          stage: Database["public"]["Enums"]["stage_key"]
          status: Database["public"]["Enums"]["stage_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          admin_approved_at?: string | null
          admin_comment?: string | null
          client_approved_at?: string | null
          client_comment?: string | null
          created_at?: string
          developer_comment?: string | null
          id?: string
          project_id: string
          sent_to_client_at?: string | null
          stage: Database["public"]["Enums"]["stage_key"]
          status?: Database["public"]["Enums"]["stage_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          admin_approved_at?: string | null
          admin_comment?: string | null
          client_approved_at?: string | null
          client_comment?: string | null
          created_at?: string
          developer_comment?: string | null
          id?: string
          project_id?: string
          sent_to_client_at?: string | null
          stage?: Database["public"]["Enums"]["stage_key"]
          status?: Database["public"]["Enums"]["stage_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string | null
          closed_at: string | null
          created_at: string
          deadline: string | null
          developer_id: string | null
          id: string
          internal_notes: string | null
          name: string
          priority: string | null
          progress_percent: number
          project_code: string
          requirements: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          technologies: string[] | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          deadline?: string | null
          developer_id?: string | null
          id?: string
          internal_notes?: string | null
          name: string
          priority?: string | null
          progress_percent?: number
          project_code?: string
          requirements?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          technologies?: string[] | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          deadline?: string | null
          developer_id?: string | null
          id?: string
          internal_notes?: string | null
          name?: string
          priority?: string | null
          progress_percent?: number
          project_code?: string
          requirements?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          technologies?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_banners: {
        Row: {
          background_color: string | null
          created_at: string
          cta_href: string | null
          cta_label: string | null
          description: string | null
          end_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          position: string
          sort_order: number
          start_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          position: string
          sort_order?: number
          start_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          position?: string
          sort_order?: number
          start_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          cta_href: string | null
          cta_label: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          client_name: string
          company: string | null
          created_at: string
          id: string
          is_approved: boolean
          profile_image_url: string | null
          project_name: string | null
          rating: number
          review: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          client_name: string
          company?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          profile_image_url?: string | null
          project_name?: string | null
          rating?: number
          review: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          client_name?: string
          company?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          profile_image_url?: string | null
          project_name?: string | null
          rating?: number
          review?: string
          sort_order?: number
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
      website_sections: {
        Row: {
          content: Json
          id: string
          is_enabled: boolean
          section_key: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          is_enabled?: boolean
          section_key: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          is_enabled?: boolean
          section_key?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_is_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "developer" | "client"
      application_status: "pending" | "accepted" | "rejected"
      budget_readiness: "yes_approved" | "maybe_depends" | "not_yet_exploring"
      developer_status: "available" | "busy" | "on_leave" | "inactive"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal_sent"
        | "negotiation"
        | "won"
        | "lost"
        | "converted"
        | "meeting_scheduled"
      payment_status: "pending" | "partial" | "paid" | "overdue" | "cancelled"
      project_status:
        | "planning"
        | "in_progress"
        | "waiting_client"
        | "revision_required"
        | "completed"
        | "cancelled"
      review_status: "pending" | "approved" | "rejected"
      stage_key: "frontend" | "backend" | "database" | "hosting"
      stage_status:
        | "pending"
        | "delivered"
        | "admin_review"
        | "admin_approved"
        | "sent_to_client"
        | "client_approved"
        | "revision_requested"
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
      app_role: ["admin", "developer", "client"],
      application_status: ["pending", "accepted", "rejected"],
      budget_readiness: ["yes_approved", "maybe_depends", "not_yet_exploring"],
      developer_status: ["available", "busy", "on_leave", "inactive"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal_sent",
        "negotiation",
        "won",
        "lost",
        "converted",
        "meeting_scheduled",
      ],
      payment_status: ["pending", "partial", "paid", "overdue", "cancelled"],
      project_status: [
        "planning",
        "in_progress",
        "waiting_client",
        "revision_required",
        "completed",
        "cancelled",
      ],
      review_status: ["pending", "approved", "rejected"],
      stage_key: ["frontend", "backend", "database", "hosting"],
      stage_status: [
        "pending",
        "delivered",
        "admin_review",
        "admin_approved",
        "sent_to_client",
        "client_approved",
        "revision_requested",
      ],
    },
  },
} as const
