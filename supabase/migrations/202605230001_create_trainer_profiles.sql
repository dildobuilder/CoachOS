create table if not exists public.trainer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  timezone text not null default 'Europe/Moscow',
  specialization text,
  onboarding_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_trainer_profiles_updated_at on public.trainer_profiles;
create trigger set_trainer_profiles_updated_at
before update on public.trainer_profiles
for each row execute function public.set_updated_at();

alter table public.trainer_profiles enable row level security;

create policy "trainer_profiles_select_own"
on public.trainer_profiles for select
using (id = auth.uid());

create policy "trainer_profiles_insert_own"
on public.trainer_profiles for insert
with check (id = auth.uid());

create policy "trainer_profiles_update_own"
on public.trainer_profiles for update
using (id = auth.uid())
with check (id = auth.uid());
