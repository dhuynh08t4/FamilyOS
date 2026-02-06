export type UserRole = 'admin' | 'member' | 'kid';

export interface Profile {
  id: string;
  full_name: string;
  nice_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  note: string;
  image_url: string | null;
  date: string;
  type: 'income' | 'expense';
  budget_plan_id?: string | null;
  created_at: string;
}

export interface BudgetPlan {
  id: string;
  user_id: string;
  name: string;
  planned_amount: number;
  category?: string;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  content: string;
  type: 'text' | 'image';
  image_url: string | null;
  created_at: string;
}
