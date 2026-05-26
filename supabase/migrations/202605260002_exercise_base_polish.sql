alter table public.exercises
drop constraint if exists exercises_default_intensity_type_check;

alter table public.exercises
add constraint exercises_default_intensity_type_check
check (default_intensity_type in ('none', 'rpe', 'rir', 'percent', 'time'));

alter table public.session_exercises
drop constraint if exists session_exercises_intensity_type_check;

alter table public.session_exercises
add constraint session_exercises_intensity_type_check
check (intensity_type in ('none', 'rpe', 'rir', 'percent', 'time'));

alter table public.session_sets
drop constraint if exists session_sets_intensity_value_check;

alter table public.session_sets
add constraint session_sets_intensity_value_check
check (intensity_value is null or intensity_value >= 0);

update public.exercises
set
  secondary_categories = case
    when primary_category in ('Кардио', 'Мобилити', 'ОФП / Плиометрика') then array[]::text[]
    else secondary_categories
  end,
  default_intensity_type = case
    when exercise_key in (
      'prised_so_shtangoy_na_spine',
      'frontalnyy_prised',
      'stanovaya_tyaga_klassicheskaya',
      'stanovaya_tyaga_sumo',
      'zhim_shtangi_lezha'
    ) then 'rpe'
    when primary_category = 'Мобилити' then 'none'
    when primary_category in ('Кардио', 'ОФП / Плиометрика') then 'time'
    else 'rir'
  end,
  updated_at = now()
where source_type = 'system';

update public.session_exercises
set
  intensity_type = 'none',
  updated_at = now()
from public.exercises
where session_exercises.exercise_id = exercises.id
  and exercises.primary_category = 'Мобилити';

update public.session_sets
set
  weight = null,
  reps = null,
  intensity_value = null,
  updated_at = now()
from public.session_exercises
join public.exercises on exercises.id = session_exercises.exercise_id
where session_sets.session_exercise_id = session_exercises.id
  and exercises.primary_category = 'Мобилити';

insert into public.session_sets (
  session_exercise_id,
  trainer_id,
  position,
  weight,
  reps,
  intensity_value,
  is_completed,
  notes
)
select
  session_exercises.id,
  session_exercises.trainer_id,
  1,
  null,
  null,
  null,
  true,
  null
from public.session_exercises
join public.exercises on exercises.id = session_exercises.exercise_id
where exercises.primary_category = 'Мобилити'
  and not exists (
    select 1
    from public.session_sets
    where session_sets.session_exercise_id = session_exercises.id
  );
