export interface AppSettings {
  allow_signups: string;
  [key: string]: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  force_password_change: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TestDefinition {
  id: number;
  test_key: string;
  display_name: string;
  category: string;
  category_order: number;
  description: string | null;
  unit: string | null;
  default_ref_min: number | null;
  default_ref_max: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
