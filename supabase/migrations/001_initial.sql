-- ═══════════════════════════════════════════════════════════════
-- HORIZON FINANCIAL PLATFORM — DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── User Profiles ───────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  country_code text default 'NL',
  currency_code text default 'EUR',
  current_age integer default 30,
  retire_spend numeric default 3000,
  life_expectancy integer default 90,
  inflation_rate numeric default 2.0,
  tax_rate numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Budget Items ────────────────────────────────────────────
create table public.budget_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  section text not null check (section in ('income', 'expense')),
  name text not null,
  amount numeric default 0,
  category text default 'lifestyle' check (category in ('housing', 'essentials', 'lifestyle', 'savings')),
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_budget_items_user on public.budget_items(user_id);

-- ─── Investments ─────────────────────────────────────────────
create table public.investments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  ticker text default '',
  balance numeric default 0,
  monthly_contribution numeric default 0,
  annual_return numeric default 7.0,
  type text default 'stocks' check (type in ('stocks', 'bonds', 'crypto', 'realestate', 'savings', 'other')),
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_investments_user on public.investments(user_id);

-- ─── Assets (non-investment) ─────────────────────────────────
create table public.assets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  value numeric default 0,
  category text default 'other' check (category in ('property', 'vehicle', 'cash', 'other')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_assets_user on public.assets(user_id);

-- ─── Liabilities ─────────────────────────────────────────────
create table public.liabilities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  value numeric default 0,
  monthly_payment numeric default 0,
  interest_rate numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_liabilities_user on public.liabilities(user_id);

-- ─── Goals ───────────────────────────────────────────────────
create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  icon text default '🎯',
  target numeric default 0,
  saved numeric default 0,
  deadline date,
  linked_investment_id uuid references public.investments(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_goals_user on public.goals(user_id);

-- ─── Budget Actuals (monthly category totals) ────────────────
create table public.actuals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  month text not null, -- 'YYYY-MM'
  category text not null check (category in ('housing', 'essentials', 'lifestyle', 'savings', 'income')),
  amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, month, category)
);

create index idx_actuals_user_month on public.actuals(user_id, month);

-- ─── Transactions (parsed from uploads) ──────────────────────
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  description text,
  amount numeric not null,
  category text default 'lifestyle' check (category in ('housing', 'essentials', 'lifestyle', 'savings', 'income')),
  source text default 'manual', -- 'manual' | 'upload' | 'bank_sync'
  created_at timestamptz default now()
);

create index idx_transactions_user_date on public.transactions(user_id, date);

-- ─── Net Worth Snapshots (monthly) ───────────────────────────
create table public.net_worth_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  month text not null, -- 'YYYY-MM'
  total_assets numeric default 0,
  total_liabilities numeric default 0,
  net_worth numeric default 0,
  portfolio_value numeric default 0,
  created_at timestamptz default now(),
  unique(user_id, month)
);

create index idx_nw_history_user on public.net_worth_history(user_id, month);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — users can only access their own data
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.budget_items enable row level security;
alter table public.investments enable row level security;
alter table public.assets enable row level security;
alter table public.liabilities enable row level security;
alter table public.goals enable row level security;
alter table public.actuals enable row level security;
alter table public.transactions enable row level security;
alter table public.net_worth_history enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Generic policy function for user-owned tables
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['budget_items','investments','assets','liabilities','goals','actuals','transactions','net_worth_history'])
  loop
    execute format('create policy "Users can view own %1$s" on public.%1$s for select using (auth.uid() = user_id)', tbl);
    execute format('create policy "Users can insert own %1$s" on public.%1$s for insert with check (auth.uid() = user_id)', tbl);
    execute format('create policy "Users can update own %1$s" on public.%1$s for update using (auth.uid() = user_id)', tbl);
    execute format('create policy "Users can delete own %1$s" on public.%1$s for delete using (auth.uid() = user_id)', tbl);
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS — auto-create profile on signup, auto-update timestamps
-- ═══════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply timestamp trigger to all tables
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['profiles','budget_items','investments','assets','liabilities','goals','actuals'])
  loop
    execute format('create trigger update_%1$s_timestamp before update on public.%1$s for each row execute procedure public.update_timestamp()', tbl);
  end loop;
end $$;
