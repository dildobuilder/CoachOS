alter table public.planned_workouts
add column if not exists pattern_id uuid;

create table if not exists public.training_plan_patterns (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  training_plan_id uuid not null references public.training_plans(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  position integer not null default 0,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.planned_workouts
drop constraint if exists planned_workouts_pattern_id_fkey;

alter table public.planned_workouts
add constraint planned_workouts_pattern_id_fkey
foreign key (pattern_id) references public.training_plan_patterns(id) on delete set null;

create index if not exists training_plan_patterns_plan_position_idx
on public.training_plan_patterns(training_plan_id, position);

create index if not exists training_plan_patterns_trainer_id_idx
on public.training_plan_patterns(trainer_id);

create index if not exists planned_workouts_pattern_id_idx
on public.planned_workouts(pattern_id);

drop trigger if exists set_training_plan_patterns_updated_at on public.training_plan_patterns;
create trigger set_training_plan_patterns_updated_at
before update on public.training_plan_patterns
for each row execute function public.set_updated_at();

alter table public.training_plan_patterns enable row level security;

drop policy if exists "training_plan_patterns_select_own" on public.training_plan_patterns;
create policy "training_plan_patterns_select_own"
on public.training_plan_patterns for select
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.training_plans
    where training_plans.id = training_plan_patterns.training_plan_id
      and training_plans.trainer_id = auth.uid()
  )
);

drop policy if exists "training_plan_patterns_insert_own" on public.training_plan_patterns;
create policy "training_plan_patterns_insert_own"
on public.training_plan_patterns for insert
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.training_plans
    where training_plans.id = training_plan_patterns.training_plan_id
      and training_plans.trainer_id = auth.uid()
  )
);

drop policy if exists "training_plan_patterns_update_own" on public.training_plan_patterns;
create policy "training_plan_patterns_update_own"
on public.training_plan_patterns for update
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.training_plans
    where training_plans.id = training_plan_patterns.training_plan_id
      and training_plans.trainer_id = auth.uid()
  )
)
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.training_plans
    where training_plans.id = training_plan_patterns.training_plan_id
      and training_plans.trainer_id = auth.uid()
  )
);

create table if not exists public.pattern_exercises (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  pattern_id uuid not null references public.training_plan_patterns(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  name_snapshot text not null,
  position integer not null default 0,
  intensity_type text not null default 'none' check (intensity_type in ('none', 'rpe', 'rir', 'percent', 'time')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pattern_exercises_pattern_position_idx
on public.pattern_exercises(pattern_id, position);

create index if not exists pattern_exercises_trainer_id_idx
on public.pattern_exercises(trainer_id);

drop trigger if exists set_pattern_exercises_updated_at on public.pattern_exercises;
create trigger set_pattern_exercises_updated_at
before update on public.pattern_exercises
for each row execute function public.set_updated_at();

alter table public.pattern_exercises enable row level security;

drop policy if exists "pattern_exercises_select_own" on public.pattern_exercises;
create policy "pattern_exercises_select_own"
on public.pattern_exercises for select
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.training_plan_patterns
    where training_plan_patterns.id = pattern_exercises.pattern_id
      and training_plan_patterns.trainer_id = auth.uid()
  )
);

drop policy if exists "pattern_exercises_insert_own" on public.pattern_exercises;
create policy "pattern_exercises_insert_own"
on public.pattern_exercises for insert
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.training_plan_patterns
    where training_plan_patterns.id = pattern_exercises.pattern_id
      and training_plan_patterns.trainer_id = auth.uid()
  )
);

drop policy if exists "pattern_exercises_update_own" on public.pattern_exercises;
create policy "pattern_exercises_update_own"
on public.pattern_exercises for update
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.training_plan_patterns
    where training_plan_patterns.id = pattern_exercises.pattern_id
      and training_plan_patterns.trainer_id = auth.uid()
  )
)
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.training_plan_patterns
    where training_plan_patterns.id = pattern_exercises.pattern_id
      and training_plan_patterns.trainer_id = auth.uid()
  )
);

drop policy if exists "pattern_exercises_delete_own" on public.pattern_exercises;
create policy "pattern_exercises_delete_own"
on public.pattern_exercises for delete
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.training_plan_patterns
    where training_plan_patterns.id = pattern_exercises.pattern_id
      and training_plan_patterns.trainer_id = auth.uid()
  )
);

create table if not exists public.pattern_sets (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainer_profiles(id) on delete cascade,
  pattern_exercise_id uuid not null references public.pattern_exercises(id) on delete cascade,
  position integer not null default 0,
  weight numeric,
  reps integer,
  intensity_value numeric check (intensity_value is null or intensity_value >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pattern_sets_exercise_position_idx
on public.pattern_sets(pattern_exercise_id, position);

create index if not exists pattern_sets_trainer_id_idx
on public.pattern_sets(trainer_id);

drop trigger if exists set_pattern_sets_updated_at on public.pattern_sets;
create trigger set_pattern_sets_updated_at
before update on public.pattern_sets
for each row execute function public.set_updated_at();

alter table public.pattern_sets enable row level security;

drop policy if exists "pattern_sets_select_own" on public.pattern_sets;
create policy "pattern_sets_select_own"
on public.pattern_sets for select
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.pattern_exercises
    where pattern_exercises.id = pattern_sets.pattern_exercise_id
      and pattern_exercises.trainer_id = auth.uid()
  )
);

drop policy if exists "pattern_sets_insert_own" on public.pattern_sets;
create policy "pattern_sets_insert_own"
on public.pattern_sets for insert
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.pattern_exercises
    where pattern_exercises.id = pattern_sets.pattern_exercise_id
      and pattern_exercises.trainer_id = auth.uid()
  )
);

drop policy if exists "pattern_sets_update_own" on public.pattern_sets;
create policy "pattern_sets_update_own"
on public.pattern_sets for update
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.pattern_exercises
    where pattern_exercises.id = pattern_sets.pattern_exercise_id
      and pattern_exercises.trainer_id = auth.uid()
  )
)
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.pattern_exercises
    where pattern_exercises.id = pattern_sets.pattern_exercise_id
      and pattern_exercises.trainer_id = auth.uid()
  )
);

drop policy if exists "pattern_sets_delete_own" on public.pattern_sets;
create policy "pattern_sets_delete_own"
on public.pattern_sets for delete
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.pattern_exercises
    where pattern_exercises.id = pattern_sets.pattern_exercise_id
      and pattern_exercises.trainer_id = auth.uid()
  )
);

create table if not exists public.training_plan_templates (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.trainer_profiles(id) on delete cascade,
  source_type text not null check (source_type in ('system', 'custom')),
  name text not null,
  description text,
  duration_weeks integer not null default 4 check (duration_weeks > 0 and duration_weeks <= 52),
  sessions_per_week integer not null check (sessions_per_week > 0 and sessions_per_week <= 14),
  split_type text not null check (split_type in ('full_body', 'upper_lower', 'push_pull_legs', 'powerlifting', 'custom')),
  suggested_weekdays integer[],
  category text,
  use_case text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source_type = 'system' and trainer_id is null)
    or (source_type = 'custom' and trainer_id is not null)
  )
);

create index if not exists training_plan_templates_source_status_idx
on public.training_plan_templates(source_type, status);

create index if not exists training_plan_templates_trainer_status_idx
on public.training_plan_templates(trainer_id, status);

drop trigger if exists set_training_plan_templates_updated_at on public.training_plan_templates;
create trigger set_training_plan_templates_updated_at
before update on public.training_plan_templates
for each row execute function public.set_updated_at();

alter table public.training_plan_templates enable row level security;

drop policy if exists "training_plan_templates_select_available" on public.training_plan_templates;
create policy "training_plan_templates_select_available"
on public.training_plan_templates for select
using (
  (source_type = 'system' and status = 'active')
  or (source_type = 'custom' and trainer_id = auth.uid())
);

drop policy if exists "training_plan_templates_insert_custom" on public.training_plan_templates;
create policy "training_plan_templates_insert_custom"
on public.training_plan_templates for insert
with check (
  source_type = 'custom'
  and trainer_id = auth.uid()
);

drop policy if exists "training_plan_templates_update_custom" on public.training_plan_templates;
create policy "training_plan_templates_update_custom"
on public.training_plan_templates for update
using (
  source_type = 'custom'
  and trainer_id = auth.uid()
)
with check (
  source_type = 'custom'
  and trainer_id = auth.uid()
);

create table if not exists public.template_patterns (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.trainer_profiles(id) on delete cascade,
  template_id uuid not null references public.training_plan_templates(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists template_patterns_template_position_idx
on public.template_patterns(template_id, position);

create index if not exists template_patterns_trainer_id_idx
on public.template_patterns(trainer_id);

drop trigger if exists set_template_patterns_updated_at on public.template_patterns;
create trigger set_template_patterns_updated_at
before update on public.template_patterns
for each row execute function public.set_updated_at();

alter table public.template_patterns enable row level security;

drop policy if exists "template_patterns_select_available" on public.template_patterns;
create policy "template_patterns_select_available"
on public.template_patterns for select
using (
  exists (
    select 1
    from public.training_plan_templates
    where training_plan_templates.id = template_patterns.template_id
      and (
        (training_plan_templates.source_type = 'system' and training_plan_templates.status = 'active')
        or (training_plan_templates.source_type = 'custom' and training_plan_templates.trainer_id = auth.uid())
      )
  )
);

drop policy if exists "template_patterns_insert_custom" on public.template_patterns;
create policy "template_patterns_insert_custom"
on public.template_patterns for insert
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.training_plan_templates
    where training_plan_templates.id = template_patterns.template_id
      and training_plan_templates.source_type = 'custom'
      and training_plan_templates.trainer_id = auth.uid()
  )
);

drop policy if exists "template_patterns_update_custom" on public.template_patterns;
create policy "template_patterns_update_custom"
on public.template_patterns for update
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.training_plan_templates
    where training_plan_templates.id = template_patterns.template_id
      and training_plan_templates.source_type = 'custom'
      and training_plan_templates.trainer_id = auth.uid()
  )
)
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.training_plan_templates
    where training_plan_templates.id = template_patterns.template_id
      and training_plan_templates.source_type = 'custom'
      and training_plan_templates.trainer_id = auth.uid()
  )
);

create table if not exists public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.trainer_profiles(id) on delete cascade,
  template_pattern_id uuid not null references public.template_patterns(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  name_snapshot text not null,
  position integer not null default 0,
  intensity_type text not null default 'none' check (intensity_type in ('none', 'rpe', 'rir', 'percent', 'time')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists template_exercises_pattern_position_idx
on public.template_exercises(template_pattern_id, position);

create index if not exists template_exercises_trainer_id_idx
on public.template_exercises(trainer_id);

drop trigger if exists set_template_exercises_updated_at on public.template_exercises;
create trigger set_template_exercises_updated_at
before update on public.template_exercises
for each row execute function public.set_updated_at();

alter table public.template_exercises enable row level security;

drop policy if exists "template_exercises_select_available" on public.template_exercises;
create policy "template_exercises_select_available"
on public.template_exercises for select
using (
  exists (
    select 1
    from public.template_patterns
    join public.training_plan_templates
      on training_plan_templates.id = template_patterns.template_id
    where template_patterns.id = template_exercises.template_pattern_id
      and (
        (training_plan_templates.source_type = 'system' and training_plan_templates.status = 'active')
        or (training_plan_templates.source_type = 'custom' and training_plan_templates.trainer_id = auth.uid())
      )
  )
);

drop policy if exists "template_exercises_insert_custom" on public.template_exercises;
create policy "template_exercises_insert_custom"
on public.template_exercises for insert
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.template_patterns
    join public.training_plan_templates
      on training_plan_templates.id = template_patterns.template_id
    where template_patterns.id = template_exercises.template_pattern_id
      and training_plan_templates.source_type = 'custom'
      and training_plan_templates.trainer_id = auth.uid()
  )
);

drop policy if exists "template_exercises_update_custom" on public.template_exercises;
create policy "template_exercises_update_custom"
on public.template_exercises for update
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.template_patterns
    join public.training_plan_templates
      on training_plan_templates.id = template_patterns.template_id
    where template_patterns.id = template_exercises.template_pattern_id
      and training_plan_templates.source_type = 'custom'
      and training_plan_templates.trainer_id = auth.uid()
  )
)
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.template_patterns
    join public.training_plan_templates
      on training_plan_templates.id = template_patterns.template_id
    where template_patterns.id = template_exercises.template_pattern_id
      and training_plan_templates.source_type = 'custom'
      and training_plan_templates.trainer_id = auth.uid()
  )
);

create table if not exists public.template_sets (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.trainer_profiles(id) on delete cascade,
  template_exercise_id uuid not null references public.template_exercises(id) on delete cascade,
  position integer not null default 0,
  weight numeric,
  reps integer,
  intensity_value numeric check (intensity_value is null or intensity_value >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists template_sets_exercise_position_idx
on public.template_sets(template_exercise_id, position);

create index if not exists template_sets_trainer_id_idx
on public.template_sets(trainer_id);

drop trigger if exists set_template_sets_updated_at on public.template_sets;
create trigger set_template_sets_updated_at
before update on public.template_sets
for each row execute function public.set_updated_at();

alter table public.template_sets enable row level security;

drop policy if exists "template_sets_select_available" on public.template_sets;
create policy "template_sets_select_available"
on public.template_sets for select
using (
  exists (
    select 1
    from public.template_exercises
    join public.template_patterns
      on template_patterns.id = template_exercises.template_pattern_id
    join public.training_plan_templates
      on training_plan_templates.id = template_patterns.template_id
    where template_exercises.id = template_sets.template_exercise_id
      and (
        (training_plan_templates.source_type = 'system' and training_plan_templates.status = 'active')
        or (training_plan_templates.source_type = 'custom' and training_plan_templates.trainer_id = auth.uid())
      )
  )
);

drop policy if exists "template_sets_insert_custom" on public.template_sets;
create policy "template_sets_insert_custom"
on public.template_sets for insert
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.template_exercises
    join public.template_patterns
      on template_patterns.id = template_exercises.template_pattern_id
    join public.training_plan_templates
      on training_plan_templates.id = template_patterns.template_id
    where template_exercises.id = template_sets.template_exercise_id
      and training_plan_templates.source_type = 'custom'
      and training_plan_templates.trainer_id = auth.uid()
  )
);

drop policy if exists "template_sets_update_custom" on public.template_sets;
create policy "template_sets_update_custom"
on public.template_sets for update
using (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.template_exercises
    join public.template_patterns
      on template_patterns.id = template_exercises.template_pattern_id
    join public.training_plan_templates
      on training_plan_templates.id = template_patterns.template_id
    where template_exercises.id = template_sets.template_exercise_id
      and training_plan_templates.source_type = 'custom'
      and training_plan_templates.trainer_id = auth.uid()
  )
)
with check (
  trainer_id = auth.uid()
  and exists (
    select 1
    from public.template_exercises
    join public.template_patterns
      on template_patterns.id = template_exercises.template_pattern_id
    join public.training_plan_templates
      on training_plan_templates.id = template_patterns.template_id
    where template_exercises.id = template_sets.template_exercise_id
      and training_plan_templates.source_type = 'custom'
      and training_plan_templates.trainer_id = auth.uid()
  )
);
