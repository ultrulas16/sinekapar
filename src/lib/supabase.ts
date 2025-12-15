// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'dealer' | 'operator' | 'customer' | 'customer_branch' | 'end_user';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  dealer_id?: string;
  can_access_crm: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dealer {
  id: string;
  user_id: string;
  company_name: string;
  tax_number?: string;
  address?: string;
  city?: string;
  phone: string;
  email: string;
  status: 'pending' | 'active' | 'suspended';
  tier: number;
  discount_rate: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  specifications?: string;
  base_price: number;
  dealer_tier1_price: number;
  dealer_tier2_price: number;
  dealer_tier3_price: number;
  stock_quantity: number;
  sku?: string;
  is_active: boolean;
  category?: string;
  vat_rate: number;
  vat_included: boolean;
  shipping_option: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  is_main: boolean;
  created_at: string;
}

export interface DealerTierLimit {
  tier: number;
  max_customers: number;
  max_operators: number;
  max_visits_per_month: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  dealer_id: string;
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  tax_number?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerBranch {
  id: string;
  customer_id: string;
  branch_name: string;
  address: string;
  city?: string;
  contact_person?: string;
  phone?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Operator {
  id: string;
  dealer_id: string;
  user_id?: string;
  full_name: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  dealer_id: string;
  customer_id: string;
  customer_branch_id?: string;
  operator_id?: string;
  visit_date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  service_type?: string;
  notes?: string;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
}

// YENİ EKLENEN SEPET ARATÜZLERİ
export interface CartItem {
  id: string; // Sepet öğesi ID'si (cart tablosunun primary key'i)
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

export interface CartItemWithProduct extends CartItem {
  // Sepet sayfasında kullanmak için Product bilgisini içerir
  product: Product; 
}