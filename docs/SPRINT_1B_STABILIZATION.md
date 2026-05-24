# Sprint 1B Stabilization

## Observed Problems

- Periodic page hangs during Supabase requests.
- `TypeError: fetch failed`.
- `read ECONNRESET`.
- `TypeError: terminated`.
- Some POST requests took 20-70 seconds.
- Raw crash overlay from `features/calendar/queries.ts` / `getEventsForDay`.
- Network failures were sometimes perceived as interrupted auth sessions.

## Likely Cause

Sprint 1B initially treated Supabase query failures as hard server errors:

- server component queries threw errors directly;
- some network failures happened before Supabase returned a normal `{ error }` object;
- `Promise.all` on dashboard meant a failed events query could break the whole page;
- server actions did not consistently convert transient network failures into user-facing form/page errors;
- start workout did not have a pending submit state, which made double-clicks more likely on slow network.

## Files Changed

- `lib/errors.ts`
- `features/calendar/queries.ts`
- `features/calendar/actions.ts`
- `features/calendar/components/day-calendar.tsx`
- `features/calendar/components/today-events-list.tsx`
- `features/calendar/components/start-workout-button.tsx`
- `features/workouts/actions.ts`
- `features/workouts/components/add-set-form.tsx`
- `features/workouts/components/session-exercise-card.tsx`
- `app/(protected)/calendar/page.tsx`
- `app/(protected)/dashboard/page.tsx`

## What Was Fixed

- Added a small shared error helper for readable transient network errors.
- `getEventsForDay` now has a safe result wrapper for page rendering.
- `/calendar` can render the event form even if event loading fails.
- `/dashboard` can render the clients block even if today's events fail.
- Calendar event list and dashboard event list show a warning instead of crashing.
- Calendar server actions convert transient failures into readable `?error=` messages.
- Workout server actions convert transient failures into readable session-page errors.
- Auth errors now distinguish network failure from actual missing user session in Sprint 1B actions.
- Start workout button disables while pending and shows loading text.
- Workout set/exercise actions receive `sessionId` so they can return to the current session after deep lookup failures.

## Manual QA

1. Open `/dashboard`.
2. Confirm today's events render when Supabase is healthy.
3. Temporarily interrupt network or Supabase availability and refresh `/dashboard`.
4. Confirm the dashboard page still renders and shows an events warning.
5. Open `/calendar`.
6. Confirm event form remains visible even if event loading fails.
7. Create a client training event.
8. Click start workout once and confirm button enters pending state.
9. Double-click start workout during slow network and confirm only one session is used.
10. Add an exercise.
11. Add a set.
12. Complete session.
13. Open client history and completed session readonly view.
14. Confirm completed session mutation controls are not available.

## SQL Checks

Foreign keys:

```sql
select
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in (
    'calendar_events',
    'workout_sessions',
    'session_exercises',
    'session_sets'
  )
order by tc.table_name, tc.constraint_name;
```

Indexes:

```sql
select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'calendar_events',
    'workout_sessions',
    'session_exercises',
    'session_sets'
  )
order by tablename, indexname;
```

RLS policies:

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'calendar_events',
    'workout_sessions',
    'session_exercises',
    'session_sets'
  )
order by tablename, policyname;
```

Duplicate session protection:

```sql
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'workout_sessions'
  and indexname = 'workout_sessions_calendar_event_id_unique';
```

## Known Limitations

- This pass does not add retry logic or background request queues.
- Supabase outages can still prevent mutations from completing.
- Completed session event-status update is still best-effort within the existing server action flow.
- No product scope was added: no exercise library, templates, analytics, rest timer, AI, nutrition, body weight logs, repeated events, drag-and-drop, week view, month view, or client portal.
