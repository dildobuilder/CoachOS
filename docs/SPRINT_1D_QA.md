# Sprint 1D QA

## Local Checks

Run:

```bash
pnpm typecheck
pnpm lint
```

## Migration Check

Apply migrations to Supabase.

Verify:

```sql
select to_regclass('public.exercises');

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'session_exercises'
  and column_name in ('exercise_id', 'name_snapshot');
```

## Seed Count Check

Expected active system exercises: 82.

```sql
select count(*)
from public.exercises
where source_type = 'system'
  and status = 'active';
```

## RLS Check

Verify RLS is enabled:

```sql
select relname, relrowsecurity
from pg_class
where relname = 'exercises';
```

Verify policies:

```sql
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'exercises'
order by policyname;
```

Manual RLS expectations:

- trainer can see active system exercises;
- trainer can create custom exercise;
- trainer can see own custom exercises;
- trainer cannot update system exercises;
- trainer can archive own custom exercise.

## Active Session Flow

1. Create or open a scheduled client training event.
2. Start workout.
3. On active session page, find `Добавить упражнение`.
4. Select a category.
5. Search for an exercise.
6. Click `Добавить`.
7. Verify exercise appears in the session.

Expected database result:

```sql
select exercise_id, name, name_snapshot, intensity_type
from public.session_exercises
order by created_at desc
limit 5;
```

For library exercises:

- `exercise_id` is not null;
- `name_snapshot` is filled;
- `intensity_type` comes from `exercises.default_intensity_type`.

## Custom Exercise Flow

1. Open active session.
2. Click `Добавить своё упражнение`.
3. Fill name, category, optional fields.
4. Click `Создать и добавить`.
5. Verify custom exercise appears in current session.

Expected database result:

```sql
select source_type, trainer_id, name, status
from public.exercises
where source_type = 'custom'
order by created_at desc
limit 5;
```

## Old History Compatibility

Open a completed session created before Sprint 1D.

Expected:

- exercise names still render;
- readonly mode still works;
- sets and intensity labels still render.

Database backfill check:

```sql
select count(*)
from public.session_exercises
where name_snapshot is null;
```

Expected result: `0`.

## Known Limitations

- `/exercises` management page is not part of Sprint 1D.
- System exercise base is seeded from draft-reviewed Excel rows.
- Custom exercise archive action exists in domain layer, but there is no full management UI yet.
- No exercise images, videos, advanced anatomy, analytics, or templates.
