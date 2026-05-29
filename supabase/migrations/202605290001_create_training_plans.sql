create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  duration_weeks integer not null default 4 check (duration_weeks > 0 and duration_weeks <= 52),
  starts_on date not null,
  ends_on date not null,
  sessions_per_week integer not null check (sessions_per_week > 0 and sessions_per_week <= 14),
  training_weekdays integer[] not null,
  split_type text not null check (split_type in ('full_body', 'upper_lower', 'push_pull_legs', 'powerlifting', 'custom')),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  check (array_length(training_weekdays, 1) > 0)
);

create index if not exists training_plans_trainer_client_idx
on public.training_plans(trainer_id, client_id);

create index if not exists training_plans_client_status_idx
on public.training_plans(client_id, status);

drop trigger if exists set_training_plans_updated_at on public.training_plans;
create trigger set_training_plans_updated_at
before update on public.training_plans
for each row execute function public.set_updated_at();

alter table public.training_plans enable row level security;

drop policy if exists "training_plans_select_own" on public.training_plans;
create policy "training_plans_select_own"
on public.training_plans for select
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients
    where clients.id = training_plans.client_id
      and clients.trainer_id = auth.uid()
  )
);

drop policy if exists "training_plans_insert_own" on public.training_plans;
create policy "training_plans_insert_own"
on public.training_plans for insert
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients
    where clients.id = training_plans.client_id
      and clients.trainer_id = auth.uid()
  )
);

drop policy if exists "training_plans_update_own" on public.training_plans;
create policy "training_plans_update_own"
on public.training_plans for update
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients
    where clients.id = training_plans.client_id
      and clients.trainer_id = auth.uid()
  )
)
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients
    where clients.id = training_plans.client_id
      and clients.trainer_id = auth.uid()
  )
);

create table if not exists public.planned_workouts (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  training_plan_id uuid not null references public.training_plans(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  calendar_event_id uuid references public.calendar_events(id) on delete set null,
  name text not null,
  planned_date date not null,
  week_number integer not null check (week_number > 0),
  day_number integer not null check (day_number > 0),
  status text not null default 'planned' check (status in ('planned', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists planned_workouts_trainer_client_date_idx
on public.planned_workouts(trainer_id, client_id, planned_date);

create index if not exists planned_workouts_plan_position_idx
on public.planned_workouts(training_plan_id, week_number, day_number);

create index if not exists planned_workouts_calendar_event_id_idx
on public.planned_workouts(calendar_event_id);

create unique index if not exists planned_workouts_calendar_event_id_unique
on public.planned_workouts(calendar_event_id)
where calendar_event_id is not null;

drop trigger if exists set_planned_workouts_updated_at on public.planned_workouts;
create trigger set_planned_workouts_updated_at
before update on public.planned_workouts
for each row execute function public.set_updated_at();

alter table public.planned_workouts enable row level security;

drop policy if exists "planned_workouts_select_own" on public.planned_workouts;
create policy "planned_workouts_select_own"
on public.planned_workouts for select
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients
    where clients.id = planned_workouts.client_id
      and clients.trainer_id = auth.uid()
  )
);

drop policy if exists "planned_workouts_insert_own" on public.planned_workouts;
create policy "planned_workouts_insert_own"
on public.planned_workouts for insert
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients
    where clients.id = planned_workouts.client_id
      and clients.trainer_id = auth.uid()
  )
);

drop policy if exists "planned_workouts_update_own" on public.planned_workouts;
create policy "planned_workouts_update_own"
on public.planned_workouts for update
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients
    where clients.id = planned_workouts.client_id
      and clients.trainer_id = auth.uid()
  )
)
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.clients
    where clients.id = planned_workouts.client_id
      and clients.trainer_id = auth.uid()
  )
);

create table if not exists public.planned_exercises (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  planned_workout_id uuid not null references public.planned_workouts(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  name_snapshot text not null,
  position integer not null default 0,
  intensity_type text not null default 'none' check (intensity_type in ('none', 'rpe', 'rir', 'percent', 'time')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists planned_exercises_workout_position_idx
on public.planned_exercises(planned_workout_id, position);

create index if not exists planned_exercises_trainer_id_idx
on public.planned_exercises(trainer_id);

drop trigger if exists set_planned_exercises_updated_at on public.planned_exercises;
create trigger set_planned_exercises_updated_at
before update on public.planned_exercises
for each row execute function public.set_updated_at();

alter table public.planned_exercises enable row level security;

drop policy if exists "planned_exercises_select_own" on public.planned_exercises;
create policy "planned_exercises_select_own"
on public.planned_exercises for select
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.planned_workouts
    where planned_workouts.id = planned_exercises.planned_workout_id
      and planned_workouts.trainer_id = auth.uid()
  )
);

drop policy if exists "planned_exercises_insert_own" on public.planned_exercises;
create policy "planned_exercises_insert_own"
on public.planned_exercises for insert
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.planned_workouts
    where planned_workouts.id = planned_exercises.planned_workout_id
      and planned_workouts.trainer_id = auth.uid()
  )
);

drop policy if exists "planned_exercises_update_own" on public.planned_exercises;
create policy "planned_exercises_update_own"
on public.planned_exercises for update
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.planned_workouts
    where planned_workouts.id = planned_exercises.planned_workout_id
      and planned_workouts.trainer_id = auth.uid()
  )
)
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.planned_workouts
    where planned_workouts.id = planned_exercises.planned_workout_id
      and planned_workouts.trainer_id = auth.uid()
  )
);

drop policy if exists "planned_exercises_delete_own" on public.planned_exercises;
create policy "planned_exercises_delete_own"
on public.planned_exercises for delete
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.planned_workouts
    where planned_workouts.id = planned_exercises.planned_workout_id
      and planned_workouts.trainer_id = auth.uid()
  )
);

create table if not exists public.planned_sets (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  planned_exercise_id uuid not null references public.planned_exercises(id) on delete cascade,
  position integer not null default 0,
  weight numeric,
  reps integer,
  intensity_value numeric check (intensity_value is null or intensity_value >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists planned_sets_exercise_position_idx
on public.planned_sets(planned_exercise_id, position);

create index if not exists planned_sets_trainer_id_idx
on public.planned_sets(trainer_id);

drop trigger if exists set_planned_sets_updated_at on public.planned_sets;
create trigger set_planned_sets_updated_at
before update on public.planned_sets
for each row execute function public.set_updated_at();

alter table public.planned_sets enable row level security;

drop policy if exists "planned_sets_select_own" on public.planned_sets;
create policy "planned_sets_select_own"
on public.planned_sets for select
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.planned_exercises
    where planned_exercises.id = planned_sets.planned_exercise_id
      and planned_exercises.trainer_id = auth.uid()
  )
);

drop policy if exists "planned_sets_insert_own" on public.planned_sets;
create policy "planned_sets_insert_own"
on public.planned_sets for insert
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.planned_exercises
    where planned_exercises.id = planned_sets.planned_exercise_id
      and planned_exercises.trainer_id = auth.uid()
  )
);

drop policy if exists "planned_sets_update_own" on public.planned_sets;
create policy "planned_sets_update_own"
on public.planned_sets for update
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.planned_exercises
    where planned_exercises.id = planned_sets.planned_exercise_id
      and planned_exercises.trainer_id = auth.uid()
  )
)
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.planned_exercises
    where planned_exercises.id = planned_sets.planned_exercise_id
      and planned_exercises.trainer_id = auth.uid()
  )
);

drop policy if exists "planned_sets_delete_own" on public.planned_sets;
create policy "planned_sets_delete_own"
on public.planned_sets for delete
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.planned_exercises
    where planned_exercises.id = planned_sets.planned_exercise_id
      and planned_exercises.trainer_id = auth.uid()
  )
);

alter table public.workout_sessions
add column if not exists planned_workout_id uuid references public.planned_workouts(id) on delete set null;

create index if not exists workout_sessions_planned_workout_id_idx
on public.workout_sessions(planned_workout_id);

alter table public.session_exercises
add column if not exists planned_exercise_id uuid references public.planned_exercises(id) on delete set null;

create index if not exists session_exercises_planned_exercise_id_idx
on public.session_exercises(planned_exercise_id);

alter table public.session_sets
add column if not exists planned_set_id uuid references public.planned_sets(id) on delete set null;

create index if not exists session_sets_planned_set_id_idx
on public.session_sets(planned_set_id);
