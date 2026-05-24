create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  type text not null check (type in ('client_training', 'personal', 'other')),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'started', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_events_trainer_starts_at_idx on public.calendar_events(trainer_id, starts_at);
create index if not exists calendar_events_trainer_status_idx on public.calendar_events(trainer_id, status);
create index if not exists calendar_events_client_id_idx on public.calendar_events(client_id);

drop trigger if exists set_calendar_events_updated_at on public.calendar_events;
create trigger set_calendar_events_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

alter table public.calendar_events enable row level security;

create policy "calendar_events_select_own"
on public.calendar_events for select
using (trainer_id = auth.uid());

create policy "calendar_events_insert_own"
on public.calendar_events for insert
with check (trainer_id = auth.uid());

create policy "calendar_events_update_own"
on public.calendar_events for update
using (trainer_id = auth.uid())
with check (trainer_id = auth.uid());

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  calendar_event_id uuid references public.calendar_events(id) on delete set null,
  status text not null default 'started' check (status in ('started', 'completed', 'cancelled')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer,
  coach_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_sessions_trainer_started_at_idx on public.workout_sessions(trainer_id, started_at);
create index if not exists workout_sessions_client_started_at_idx on public.workout_sessions(client_id, started_at);
create index if not exists workout_sessions_calendar_event_id_idx on public.workout_sessions(calendar_event_id);
create unique index if not exists workout_sessions_calendar_event_id_unique
on public.workout_sessions(calendar_event_id)
where calendar_event_id is not null;

drop trigger if exists set_workout_sessions_updated_at on public.workout_sessions;
create trigger set_workout_sessions_updated_at
before update on public.workout_sessions
for each row execute function public.set_updated_at();

alter table public.workout_sessions enable row level security;

create policy "workout_sessions_select_own"
on public.workout_sessions for select
using (trainer_id = auth.uid());

create policy "workout_sessions_insert_own"
on public.workout_sessions for insert
with check (trainer_id = auth.uid());

create policy "workout_sessions_update_own"
on public.workout_sessions for update
using (trainer_id = auth.uid())
with check (trainer_id = auth.uid());

create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  intensity_type text not null default 'none' check (intensity_type in ('none', 'rpe', 'rir', 'percent')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists session_exercises_session_position_idx on public.session_exercises(session_id, position);
create index if not exists session_exercises_trainer_id_idx on public.session_exercises(trainer_id);

drop trigger if exists set_session_exercises_updated_at on public.session_exercises;
create trigger set_session_exercises_updated_at
before update on public.session_exercises
for each row execute function public.set_updated_at();

alter table public.session_exercises enable row level security;

create policy "session_exercises_select_own"
on public.session_exercises for select
using (trainer_id = auth.uid());

create policy "session_exercises_insert_own"
on public.session_exercises for insert
with check (trainer_id = auth.uid());

create policy "session_exercises_update_own"
on public.session_exercises for update
using (trainer_id = auth.uid())
with check (trainer_id = auth.uid());

create policy "session_exercises_delete_own"
on public.session_exercises for delete
using (trainer_id = auth.uid());

create table if not exists public.session_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  position integer not null default 0,
  weight numeric,
  reps integer,
  intensity_value numeric check (intensity_value is null or (intensity_value >= 0 and intensity_value <= 100)),
  is_completed boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists session_sets_exercise_position_idx on public.session_sets(session_exercise_id, position);
create index if not exists session_sets_trainer_id_idx on public.session_sets(trainer_id);

drop trigger if exists set_session_sets_updated_at on public.session_sets;
create trigger set_session_sets_updated_at
before update on public.session_sets
for each row execute function public.set_updated_at();

alter table public.session_sets enable row level security;

create policy "session_sets_select_own"
on public.session_sets for select
using (trainer_id = auth.uid());

create policy "session_sets_insert_own"
on public.session_sets for insert
with check (trainer_id = auth.uid());

create policy "session_sets_update_own"
on public.session_sets for update
using (trainer_id = auth.uid())
with check (trainer_id = auth.uid());

create policy "session_sets_delete_own"
on public.session_sets for delete
using (trainer_id = auth.uid());
