-- Create budget_plans table
create table public.budget_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  planned_amount numeric not null default 0,
  start_date date,
  end_date date,
  status text default 'active', -- active, completed, archived
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add budget_plan_id to transactions
alter table public.transactions 
add column budget_plan_id uuid references public.budget_plans(id) on delete set null;

-- RLS for budget_plans
alter table public.budget_plans enable row level security;

create policy "Users can view own budget plans"
  on public.budget_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own budget plans"
  on public.budget_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budget plans"
  on public.budget_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own budget plans"
  on public.budget_plans for delete
  using (auth.uid() = user_id);
