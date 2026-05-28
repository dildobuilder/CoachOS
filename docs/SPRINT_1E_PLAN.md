# Sprint 1E - Client Calendar & Daily Logs

## Summary

Sprint 1E adds client-specific calendar context and daily logs without creating a second calendar source. `calendar_events` remains the single source of truth: `/calendar` shows the trainer-wide schedule, while `/clients/[clientId]/calendar` shows a 30-day client projection with that client's events, body weight, macros, and notes.

## Key Changes

- Add `public.client_daily_logs` with one log per client/date.
- Add `clients.starting_weight`.
- Add client log queries/actions for daily log upsert, latest weight, and 30-day calendar data.
- Add `/clients/[clientId]/calendar`.
- Add client profile navigation: overview, calendar, history.
- Add a profile/overview starting weight editor.
- Schedule client training from the client calendar using existing `createCalendarEvent` logic.
- Keep daily log editing separate from training scheduling.

## Database

- `client_daily_logs` fields:
  - `id uuid primary key default gen_random_uuid()`
  - `trainer_id uuid not null references public.trainer_profiles(id) on delete cascade`
  - `client_id uuid not null references public.clients(id) on delete cascade`
  - `log_date date not null`
  - `body_weight numeric`
  - `calories integer`
  - `protein integer`
  - `fat integer`
  - `carbs integer`
  - `notes text`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- Constraints:
  - `unique (client_id, log_date)`
  - nullable positive/non-negative metric checks.
- `clients.starting_weight numeric` with positive-or-null check.
- RLS:
  - trainer can select/insert/update only logs where `trainer_id = auth.uid()`;
  - `client_id` must also belong to the same trainer through `public.clients`.
- No physical delete UI for daily logs.

## UI

- `/clients/[clientId]` remains overview and shows starting/current weight.
- `/clients/[clientId]/calendar` contains three separate sections:
  - schedule training form;
  - daily log editor;
  - 30-day client calendar list.
- 30-day navigation:
  - previous 30 days;
  - today;
  - next 30 days;
  - date input / `?start=YYYY-MM-DD`.
- Each day row/card shows:
  - date;
  - client training events;
  - body weight;
  - calories/protein/fat/carbs;
  - note preview;
  - fill/edit action.

## Out Of Scope

- Training templates.
- Planned sets/workouts.
- Drag-and-drop.
- Charts.
- Nutrition analytics or recommendations.
- Body measurements/photos.
- Client portal.
- Sprint 1F features.

## Acceptance Criteria

- Migration applies successfully.
- `client_daily_logs` exists.
- `clients.starting_weight` exists.
- RLS protects client logs.
- Client calendar shows only this client's non-cancelled events.
- Created client event appears in both client calendar and trainer calendar.
- Existing conflict detection works for client profile scheduling.
- Daily log upsert does not create duplicates for one client/date.
- Current weight is latest non-null `body_weight`.
- Starting weight is editable from overview.
- Existing Sprint 1C/1D/private preview flows remain intact.
- `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass.

## Future Backlog

Next candidate: `Sprint 1F - Training Planning & Workout Templates`.

- Planned workouts.
- Workout templates.
- Planned exercises.
- Planned sets.
- Generate workout session from plan.
- Planned vs actual comparison.
