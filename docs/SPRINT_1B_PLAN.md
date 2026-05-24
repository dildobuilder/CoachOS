# Sprint 1B Plan: Workout Session Vertical Slice

## Summary

Sprint 1B implements the minimum working training cycle:

`Calendar Event -> Start Workout Session -> Add Exercise -> Add Set -> Complete Session -> Client History`

Sprint 1B must stay focused on the vertical slice. It must not expand into advanced calendar UX, program templates, AI, nutrition, analytics, body weight logs, rest timers, client portal, repeated events, week/month views, or drag-and-drop.

## Goal

Build the first real CoachOS trainer workflow:

- create a client training event;
- start a workout from that event;
- record exercises and sets;
- complete the session;
- see the completed workout in client history.

## Pre-Implementation Checklist

Before implementation starts:

- Sprint 1A is green:
  - `pnpm typecheck` passes;
  - `pnpm lint` passes;
  - local QA passed.
- Sprint 1A migrations are already applied.
- `.env.local` is configured.
- Supabase project is available.
- Git branch is created for Sprint 1B.
- Current branch has no uncommitted critical Sprint 1A changes.
- Sprint 1B does not start until this plan is committed or explicitly accepted.

## Scope

### In Sprint 1B

- `calendar_events`
- `workout_sessions`
- `session_exercises`
- `session_sets`
- Simple day calendar view.
- Today dashboard events.
- Start workout from calendar event.
- Active workout session editor.
- Free-text exercises.
- Minimal strength-style sets.
- Exercise-level intensity method.
- Completed session readonly view.
- Client workout history.
- Placeholder for previous completed workout.

### Not In Sprint 1B

- 1RM tables or 1RM calculations.
- Automatic percent calculation.
- Exercise library.
- Intensity analytics.
- Program templates.
- Nutrition.
- Body weight logs.
- Rest timer.
- AI.
- Client portal.
- Sprint 1C features.
- Week view.
- Month view.
- Drag-and-drop calendar.
- Repeated events.

## Database Migrations

Add four new SQL migrations after Sprint 1A migrations.

### `calendar_events`

Fields:

- `id uuid primary key default gen_random_uuid()`
- `trainer_id uuid not null references public.trainer_profiles(id) on delete cascade`
- `client_id uuid references public.clients(id) on delete set null`
- `type text not null check (type in ('client_training', 'personal', 'other'))`
- `title text not null`
- `starts_at timestamptz not null`
- `ends_at timestamptz not null`
- `status text not null default 'scheduled' check (status in ('scheduled', 'started', 'completed', 'cancelled'))`
- `notes text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `calendar_events_trainer_starts_at_idx on (trainer_id, starts_at)`
- `calendar_events_trainer_status_idx on (trainer_id, status)`
- `calendar_events_client_id_idx on (client_id)`

Important decision:

- Do not add `calendar_events.workout_session_id`.
- The relationship is one-way through `workout_sessions.calendar_event_id`.
- Existing sessions are found by querying `workout_sessions.calendar_event_id`.

### `workout_sessions`

Fields:

- `id uuid primary key default gen_random_uuid()`
- `trainer_id uuid not null references public.trainer_profiles(id) on delete cascade`
- `client_id uuid not null references public.clients(id) on delete cascade`
- `calendar_event_id uuid references public.calendar_events(id) on delete set null`
- `status text not null default 'started' check (status in ('started', 'completed', 'cancelled'))`
- `started_at timestamptz not null default now()`
- `completed_at timestamptz`
- `duration_seconds integer`
- `coach_notes text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `workout_sessions_trainer_started_at_idx on (trainer_id, started_at)`
- `workout_sessions_client_started_at_idx on (client_id, started_at)`
- `workout_sessions_calendar_event_id_idx on (calendar_event_id)`

Database-level duplicate protection:

```sql
create unique index workout_sessions_calendar_event_id_unique
on public.workout_sessions(calendar_event_id)
where calendar_event_id is not null;
```

Purpose:

- repeated start of the same event must not create a second session;
- protection exists both in server action logic and at database level.

### `session_exercises`

Fields:

- `id uuid primary key default gen_random_uuid()`
- `session_id uuid not null references public.workout_sessions(id) on delete cascade`
- `trainer_id uuid not null references public.trainer_profiles(id) on delete cascade`
- `name text not null`
- `position integer not null default 0`
- `intensity_type text not null default 'none' check (intensity_type in ('none', 'rpe', 'rir', 'percent'))`
- `notes text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `session_exercises_session_position_idx on (session_id, position)`
- `session_exercises_trainer_id_idx on (trainer_id)`

Decision:

- Intensity method is selected at exercise level.
- All sets under one exercise use the same intensity method.

### `session_sets`

Fields:

- `id uuid primary key default gen_random_uuid()`
- `session_exercise_id uuid not null references public.session_exercises(id) on delete cascade`
- `trainer_id uuid not null references public.trainer_profiles(id) on delete cascade`
- `position integer not null default 0`
- `weight numeric`
- `reps integer`
- `intensity_value numeric check (intensity_value is null or (intensity_value >= 0 and intensity_value <= 100))`
- `is_completed boolean not null default true`
- `notes text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `session_sets_exercise_position_idx on (session_exercise_id, position)`
- `session_sets_trainer_id_idx on (trainer_id)`

Do not add in Sprint 1B:

- `rpe`
- `rir`
- `percent`
- `duration_seconds`
- `distance_meters`
- `tempo`
- cardio-specific fields
- advanced analytics fields

## RLS Policies

Enable RLS on every new table.

### `calendar_events`

- `select`: `trainer_id = auth.uid()`
- `insert`: `trainer_id = auth.uid()`
- `update`: `trainer_id = auth.uid()`
- No physical delete policy in Sprint 1B.

### `workout_sessions`

- `select`: `trainer_id = auth.uid()`
- `insert`: `trainer_id = auth.uid()`
- `update`: `trainer_id = auth.uid()`
- No physical delete policy in Sprint 1B.

### `session_exercises`

- `select`: `trainer_id = auth.uid()`
- `insert`: `trainer_id = auth.uid()`
- `update`: `trainer_id = auth.uid()`
- `delete`: `trainer_id = auth.uid()`

### `session_sets`

- `select`: `trainer_id = auth.uid()`
- `insert`: `trainer_id = auth.uid()`
- `update`: `trainer_id = auth.uid()`
- `delete`: `trainer_id = auth.uid()`

Delete is allowed only for draft-like exercise/set editing in active sessions.

## Validation

### Zod / Server Actions

Validate:

- event type/status;
- required client training event fields;
- session status transitions;
- exercise name;
- exercise `intensity_type`;
- set `weight`, `reps`, `intensity_value`;
- readonly mode must reject mutations for completed sessions.

Intensity validation:

- `rpe`: allowed values `5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10`
- `rir`: integer `1-10`
- `percent`: integer `0-100`
- `none`: `intensity_value` should be `null`

### UI Restrictions

- RPE: select/stepper with fixed values from `5` to `10`, step `0.5`.
- RIR: integer select/input from `1` to `10`.
- Percent: integer select/input from `0` to `100`.
- None: no intensity input is shown.

### DB Validation

Keep DB validation basic in Sprint 1B:

- `session_exercises.intensity_type` check constraint.
- `session_sets.intensity_value` nullable and constrained to `0-100`.
- Do not implement cross-table DB validation between `intensity_type` and `intensity_value`.

## Timezone

- Store event dates as `timestamptz`.
- Day query calculates day boundaries using trainer profile timezone.
- Fallback timezone: `Europe/Moscow`.
- No advanced timezone UX in Sprint 1B.
- No timezone switchers, city settings, or complex timezone controls.

## Server Actions

### Calendar

Create in `features/calendar/actions.ts`:

- `createCalendarEvent(formData)`
- `updateCalendarEvent(eventId, formData)`
- `cancelCalendarEvent(eventId)`
- `startWorkoutFromEvent(eventId)`

`startWorkoutFromEvent` behavior:

- authenticate trainer;
- load event by `eventId`;
- allow start only for `type = 'client_training'` with existing `client_id`;
- query `workout_sessions` by `calendar_event_id`;
- if existing session has `status = 'started'` or `status = 'completed'`, redirect to `/sessions/[sessionId]`;
- if no session exists, create one;
- update event status to `started`;
- redirect to `/sessions/[sessionId]`;
- rely on the partial unique index as final duplicate protection.

### Workouts

Create in `features/workouts/actions.ts`:

- `addExerciseToSession(sessionId, formData)`
- `updateSessionExercise(exerciseId, formData)`
- `deleteSessionExercise(exerciseId)`
- `addSetToExercise(exerciseId, formData)`
- `updateSessionSet(setId, formData)`
- `deleteSessionSet(setId)`
- `completeWorkoutSession(sessionId, formData)`

Readonly rule:

- every mutation action must verify the parent `workout_sessions.status`;
- if status is `completed`, reject the mutation.

`completeWorkoutSession` behavior:

- authenticate trainer;
- set `status = 'completed'`;
- set `completed_at = now()`;
- calculate `duration_seconds` when possible;
- save `coach_notes` if provided;
- update linked calendar event status to `completed`;
- redirect to `/clients/[clientId]/history`.

## Pages / Routes

Use existing routes:

- `/dashboard`
  - show today date and today events;
- `/calendar`
  - simple day view;
  - event creation form;
  - event cards;
  - start workout action;
- `/sessions/[sessionId]`
  - active editor for started sessions;
  - readonly view for completed sessions;
- `/clients/[clientId]/history`
  - completed workout sessions for the client.

No external API route handlers are required in Sprint 1B unless server actions are insufficient.

## Components

### Calendar Components

Create in `features/calendar/components/`:

- `day-calendar.tsx`
- `event-form.tsx`
- `event-card.tsx`
- `start-workout-button.tsx`
- `today-events-list.tsx`

### Workout Components

Create in `features/workouts/components/`:

- `session-editor.tsx`
- `session-exercise-card.tsx`
- `add-exercise-form.tsx`
- `add-set-form.tsx`
- `complete-session-button.tsx`
- `client-session-history.tsx`
- `previous-workout-placeholder.tsx`
- `intensity-type-selector.tsx`
- `intensity-value-input.tsx`

Use current local UI primitives and avoid new dependencies.

## Main Flow

### Create Client Training Event

1. Trainer opens `/calendar`.
2. Trainer selects an active client.
3. Trainer chooses date/time and optional notes.
4. App creates `calendar_events` with:
   - `type = 'client_training'`;
   - `status = 'scheduled'`;
   - `client_id`;
   - `starts_at`;
   - `ends_at`.

### Open Event / Repeat Start

- Event card shows event details and action buttons.
- There is no separate event detail route in Sprint 1B.
- If trainer starts the same event twice, app must find existing session by `calendar_event_id`.
- Existing `started` or `completed` session redirects to `/sessions/[sessionId]`.

### Start Workout

1. Trainer clicks `Start workout`.
2. App creates `workout_sessions` if none exists.
3. App sets event status to `started`.
4. Trainer lands on `/sessions/[sessionId]`.

### Add Exercise

1. Trainer enters exercise name.
2. Trainer selects one intensity method:
   - `RPE`;
   - `RIR`;
   - `%`;
   - `Без оценки`.
3. App creates `session_exercises`.
4. Method is saved as `session_exercises.intensity_type`.

Only one intensity method is allowed per exercise.

### Add Set

1. Trainer adds set under an exercise.
2. UI shows only fields relevant to that exercise.
3. Base fields:
   - weight;
   - reps;
   - notes.
4. Intensity field:
   - RPE selector if `intensity_type = 'rpe'`;
   - RIR selector/input if `intensity_type = 'rir'`;
   - percent selector/input if `intensity_type = 'percent'`;
   - no intensity field if `intensity_type = 'none'`.
5. App saves value into `session_sets.intensity_value`.

### Complete Session

1. Trainer clicks complete.
2. Session status becomes `completed`.
3. Event status becomes `completed`.
4. Trainer is redirected to client history.
5. Completed session becomes readonly.

## Completed Session Readonly Mode

If `workout_sessions.status = 'completed'`, `/sessions/[sessionId]` must use readonly mode.

Readonly mode rules:

- cannot add exercises;
- cannot edit exercises;
- cannot delete exercises;
- cannot add sets;
- cannot edit sets;
- cannot delete sets;
- cannot complete the session again;
- can only view workout data.

Active and completed sessions use the same route but different UI mode based on status.

## Completed Session Intensity Display

Display intensity in human-readable format:

- `intensity_type = 'rpe'` -> `@ RPE 8`
- `intensity_type = 'rir'` -> `@ RIR 2`
- `intensity_type = 'percent'` -> `@ 75%`
- `intensity_type = 'none'` -> show no intensity label

## Previous Workout Placeholder

Do not build full similar-workout logic in Sprint 1B.

Minimal behavior:

- show block `Прошлая тренировка клиента` on active session page;
- if client has a previous completed session, show:
  - date;
  - exercises;
  - number of sets per exercise;
  - text: `Полное сравнение появится позже.`;
- if no history exists, show empty state;
- do not match exercises by name;
- do not calculate volume, PRs, or progress.

## Acceptance Criteria

Sprint 1B is accepted when:

- SQL migrations apply successfully.
- `lib/database.types.ts` is updated.
- RLS is enabled for all new tables.
- Cross-trainer access is blocked by RLS.
- `/dashboard` shows today events.
- `/calendar` shows day events and can create training events.
- Trainer can start workout from a calendar event.
- Repeated start of the same event does not create a second session.
- Partial unique index prevents duplicate sessions at DB level.
- `calendar_events.workout_session_id` is not added.
- Existing session is found via `workout_sessions.calendar_event_id`.
- Trainer can add exercise to active session.
- Trainer can choose exactly one intensity method per exercise.
- Supported methods are RPE, RIR, Percent, None.
- Add-set UI shows only the selected intensity field.
- RPE accepts only `5-10` with step `0.5`.
- RIR accepts only integers `1-10`.
- Percent accepts only integers `0-100`.
- `session_sets` does not use separate `rpe`, `rir`, `percent` fields.
- Intensity is stored as `session_exercises.intensity_type` plus `session_sets.intensity_value`.
- Trainer can add, edit, and delete sets before completion.
- Trainer can complete session.
- Completed session appears in client history.
- Completed session opens on `/sessions/[sessionId]`.
- Completed session displays intensity as `@ RPE 8`, `@ RIR 2`, or `@ 75%`.
- Completed session works in readonly mode.
- Completed readonly session blocks all edit/add/delete/complete actions.
- Previous workout placeholder appears on active session page.
- Mobile session page is usable.
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- Manual QA of the full vertical flow passes.

## Risks And Mitigations

- **Duplicate workout sessions**
  - Mitigation: query by `calendar_event_id` before insert and add partial unique index.
- **Calendar scope creep**
  - Mitigation: day view only, no drag-and-drop, no week/month views.
- **Intensity model becoming messy**
  - Mitigation: one `intensity_type` per exercise and one `intensity_value` per set.
- **Overbuilding DB validation**
  - Mitigation: keep DB checks basic; enforce detailed intensity rules in UI/server actions.
- **Readonly leakage**
  - Mitigation: block completed-session mutations both in UI and server actions.
- **Timezone bugs**
  - Mitigation: use trainer timezone for day boundaries, fallback `Europe/Moscow`.
- **Schema evolution**
  - Mitigation: keep Sprint 1B session data factual, not template-based.
- **Workout input speed**
  - Mitigation: free-text exercise names and minimal set fields.
- **RLS ownership bugs**
  - Mitigation: every new table has `trainer_id`, RLS from day one, manual cross-user QA.

## Implementation Order

1. Confirm pre-implementation checklist.
2. Create Sprint 1B branch.
3. Add SQL migrations for four tables, indexes, checks, triggers, RLS.
4. Add partial unique index for `workout_sessions.calendar_event_id`.
5. Update generated Supabase database types.
6. Implement calendar schemas, queries, and actions.
7. Implement workout schemas, queries, and actions.
8. Implement `/calendar` day view and event creation.
9. Update `/dashboard` today events.
10. Implement start workout from event.
11. Implement `/sessions/[sessionId]` active editor.
12. Implement exercise-level intensity method selection.
13. Implement set form with method-specific intensity field.
14. Implement completed session readonly mode.
15. Implement client history.
16. Implement previous workout placeholder.
17. Run `pnpm typecheck`.
18. Run `pnpm lint`.
19. Run manual QA.
20. Commit as `Sprint 1B - Workout session vertical slice`.

## Assumptions

- Sprint 1A remains untouched unless required for integration.
- Client remains trainer-owned and has no auth account.
- `calendar_events` and `workout_sessions` are linked only through `workout_sessions.calendar_event_id`.
- No `calendar_events.workout_session_id`.
- Exercise names are free-text in Sprint 1B.
- Intensity method is exercise-level, not set-level.
- Percent is manually entered and not calculated from 1RM.
- Latest completed session is enough for previous-workout placeholder.
- Advanced timezone UX is deferred.
- No new runtime dependencies unless implementation proves current primitives insufficient.

## Changelog For Plan Update

- Updated SQL migrations with one-way event/session relation and partial unique index.
- Replaced parallel `rpe`, `rir`, `percent` fields with `intensity_type` plus `intensity_value`.
- Added validation rules for RPE, RIR, Percent, and None.
- Added completed-session readonly mode rules.
- Added human-readable intensity display rules.
- Added explicit timezone policy.
- Added pre-implementation checklist.
- Expanded acceptance criteria around duplicate protection, intensity model, and readonly behavior.
- Reduced risks around duplicate sessions, intensity schema drift, and completed-session mutation leakage.
- Next step after approval: implement Sprint 1B in a separate execution pass.
