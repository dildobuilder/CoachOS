create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  name text not null,
  preferred_name text,
  phone text,
  email text,
  birth_date date,
  sex text,
  goal text,
  level text,
  limitations text,
  injuries text,
  notes text,
  training_frequency text,
  training_split text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  started_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_trainer_id_idx on public.clients(trainer_id);
create index if not exists clients_status_idx on public.clients(status);

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

create policy "clients_select_own"
on public.clients for select
using (trainer_id = auth.uid());

create policy "clients_insert_own"
on public.clients for insert
with check (trainer_id = auth.uid());

create policy "clients_update_own"
on public.clients for update
using (trainer_id = auth.uid())
with check (trainer_id = auth.uid());
