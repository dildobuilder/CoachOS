alter table public.clients
add column if not exists starting_weight numeric;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clients_starting_weight_check'
  ) then
    alter table public.clients
    add constraint clients_starting_weight_check
    check (starting_weight is null or starting_weight > 0);
  end if;
end $$;

create table if not exists public.client_daily_logs (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  log_date date not null,
  body_weight numeric check (body_weight is null or body_weight > 0),
  calories integer check (calories is null or calories >= 0),
  protein integer check (protein is null or protein >= 0),
  fat integer check (fat is null or fat >= 0),
  carbs integer check (carbs is null or carbs >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, log_date)
);

create index if not exists client_daily_logs_trainer_client_date_idx
on public.client_daily_logs(trainer_id, client_id, log_date);

create index if not exists client_daily_logs_client_date_idx
on public.client_daily_logs(client_id, log_date);

drop trigger if exists set_client_daily_logs_updated_at on public.client_daily_logs;
create trigger set_client_daily_logs_updated_at
before update on public.client_daily_logs
for each row execute function public.set_updated_at();

alter table public.client_daily_logs enable row level security;

drop policy if exists "client_daily_logs_select_own" on public.client_daily_logs;
create policy "client_daily_logs_select_own"
on public.client_daily_logs for select
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients
    where clients.id = client_daily_logs.client_id
      and clients.trainer_id = auth.uid()
  )
);

drop policy if exists "client_daily_logs_insert_own" on public.client_daily_logs;
create policy "client_daily_logs_insert_own"
on public.client_daily_logs for insert
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients
    where clients.id = client_daily_logs.client_id
      and clients.trainer_id = auth.uid()
  )
);

drop policy if exists "client_daily_logs_update_own" on public.client_daily_logs;
create policy "client_daily_logs_update_own"
on public.client_daily_logs for update
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients
    where clients.id = client_daily_logs.client_id
      and clients.trainer_id = auth.uid()
  )
)
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients
    where clients.id = client_daily_logs.client_id
      and clients.trainer_id = auth.uid()
  )
);
