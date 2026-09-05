-- =============================================================================
-- Admin profiles table
-- Optional — creates a queryable table that mirrors the signup details
-- (full name, phone, email) captured when an admin signs up via the app.
-- The auth flow itself stores these in auth.users.user_metadata, so everything
-- works even without this table. Run this from the Supabase SQL Editor or via
-- `supabase db push`.
-- =============================================================================

create table if not exists public.admin_profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  email      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Keep the profile in sync with auth.users (insert/update)
-- ---------------------------------------------------------------------------
create or replace function public.sync_admin_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.admin_profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do update set
    full_name  = excluded.full_name,
    email      = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.sync_admin_profile();

-- ---------------------------------------------------------------------------
-- Row Level Security: a signed-in admin can view/update their own profile row
-- ---------------------------------------------------------------------------
alter table public.admin_profiles enable row level security;

drop policy if exists "users can view own profile" on public.admin_profiles;
create policy "users can view own profile"
  on public.admin_profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "users can update own profile" on public.admin_profiles;
create policy "users can update own profile"
  on public.admin_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);