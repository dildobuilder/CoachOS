# Sprint 1C - Calendar Core v2

## Summary

Sprint 1C turns `/calendar` from a simple day event list into a minimum usable weekly trainer calendar.

Goal: a trainer can see the next 7 days, create events on any date by clicking an hourly cell, see time conflicts, and start or open workout sessions from client training events without breaking the Sprint 1B workout flow.

Calendar work comes before the seeded exercise base because scheduling is the entry point for the trainer's workday. A better exercise base improves workout recording, but it does not solve client planning.

## Scope

In Sprint 1C:

- Weekly grid on `/calendar`: 7 days, rows `00:00-23:00`, 1 cell = 1 hour.
- Week start date from `?start=YYYY-MM-DD`.
- If query is missing, week start date is today in the trainer timezone.
- Fallback timezone: `Europe/Moscow`.
- Navigation: today, previous week, next week, start date picker.
- Create event by clicking an empty calendar cell.
- Event duration only in whole hours: `1`, `2`, `3`, `4`.
- Event types: `client_training`, `personal`, `break`, `other`.
- Calm event colors by type.
- Conflict detection before create/update.
- Open existing session for started/completed client training events.
- Dashboard remains today-focused.

Not in Sprint 1C:

- Drag-and-drop.
- Month view.
- Repeated events.
- 15/30-minute slots.
- Google Calendar integration.
- Notifications.
- Program templates.
- Exercise library.
- AI.
- Nutrition.
- Analytics.
- Rest timer.
- Client portal.

## Database Changes

No new tables are required.

Add a safe migration for `calendar_events.type`:

```sql
alter table public.calendar_events
drop constraint if exists calendar_events_type_check;

alter table public.calendar_events
add constraint calendar_events_type_check
check (type in ('client_training', 'personal', 'break', 'other'));
```

Keep existing `personal` values. Do not rename them to `personal_training`.

After migration, update `lib/database.types.ts`.

Event/session relation remains unchanged:

- `workout_sessions.calendar_event_id` is the only database relation.
- Do not add `calendar_events.workout_session_id`.
- Keep the Sprint 1B partial unique index on `workout_sessions(calendar_event_id)`.

## Backend Changes

Update `features/calendar/schemas.ts`:

- Event type: `client_training | personal | break | other`.
- Replace free `duration_minutes` form input with `duration_hours`.
- `duration_hours` accepts only `1 | 2 | 3 | 4`.
- User does not enter `ends_at`.
- Server computes `ends_at = starts_at + duration_hours`.
- Server validates that `ends_at` is after `starts_at`.

Update `features/calendar/queries.ts`:

- Add `getEventsForWeekResult(startDate)`.
- If `startDate` is missing, calculate today in trainer timezone.
- Week query uses a 7-day range in trainer timezone, fallback `Europe/Moscow`.
- Week query returns events with client data and optional derived `existing_session_id`.
- `existing_session_id` is computed from `workout_sessions.calendar_event_id`.
- `existing_session_id` is not a `calendar_events` column.
- Keep `getTodayEventsResult()` for dashboard.

Update `features/calendar/actions.ts`:

- `createCalendarEvent` supports all Sprint 1C event types.
- `client_training` requires `client_id`.
- `personal`, `break`, and `other` use `client_id = null`.
- `updateCalendarEvent` supports edit/reschedule from the calendar dialog.
- Conflict check:

```text
new.starts_at < existing.ends_at
and
new.ends_at > existing.starts_at
and
existing.status != 'cancelled'
```

For update, exclude the current event from the conflict query.

Conflict message:

```text
На это время уже запланировано событие. Выберите другое время.
```

## Frontend Changes

Replace the day list on `/calendar` with a weekly grid.

Main components:

- `weekly-calendar.tsx`: 7-day grid, hour rows, event placement.
- `calendar-toolbar.tsx`: today, previous week, next week, start date picker.
- `calendar-cell.tsx`: empty hourly cell, opens create dialog.
- `event-dialog.tsx`: create/edit form.
- `event-card.tsx`: type color, type label, status, client/title, time.
- `event-actions.tsx`: start/open session/cancel/edit.

Cell click behavior:

- Clicking an empty cell opens a dialog.
- Dialog receives `date` and `starts_at_time`.
- Duration default: `1 hour`.
- Type default: `client_training`.
- If type is not `client_training`, client field is not required.

Event click behavior:

- Scheduled `client_training`: show start action.
- Started/completed `client_training` with `existing_session_id`: link to `/sessions/[existing_session_id]`.
- `personal`, `break`, `other`: show details, edit, cancel.
- Cancelled events are displayed muted.

## Weekly Grid Logic

- `/calendar` without query: week starts from today in trainer timezone.
- `/calendar?start=YYYY-MM-DD`: week starts from that date.
- 24 rows: `00:00` through `23:00`.
- Event is placed by `starts_at` in trainer timezone.
- Event with duration `N` hours occupies `N` hourly cells.
- Sprint 1C creates events only at the beginning of an hour.
- Events crossing the visible week can be visually clipped; the create flow does not create such events.

## Dashboard vs Calendar

- `/dashboard` stays today-focused.
- `/dashboard` shows only today's events.
- `/calendar` is the weekly planning surface.
- Sprint 1B `startWorkoutFromEvent` and direct opening of existing sessions must keep working.

## Acceptance Criteria

- `/calendar` shows a 7-day grid.
- Default week start is today in trainer timezone.
- Today, previous week, next week, and date picker navigation work.
- Every cell represents one hour.
- Clicking an empty cell opens event creation with date and time prefilled.
- `duration_hours` accepts only `1 | 2 | 3 | 4`.
- `ends_at` is computed only on the server and is always after `starts_at`.
- Trainer can create client training events today, tomorrow, in the future, and in the past.
- Trainer can create `personal`, `break`, and `other` events.
- Event appears in the correct day/time.
- Duration `2/3/4` hours occupies the matching number of cells.
- Conflicting event is blocked with a clear error.
- Event card shows type, time, client/title, and status.
- Week query returns optional `existing_session_id` derived through `workout_sessions.calendar_event_id`.
- `calendar_events.workout_session_id` is not added.
- Client training event can start a workout session.
- Started/completed event opens the existing session.
- Sprint 1B duplicate session protection is preserved.
- `/dashboard` keeps showing only today's events.
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- Manual QA passes.

## Manual QA Checklist

- Open `/calendar` without query and verify the week starts today in trainer timezone.
- Open `/calendar?start=YYYY-MM-DD` and verify the selected 7-day range.
- Create a client training today for 1 hour.
- Create a client training tomorrow for 2 hours.
- Create a client training in the past.
- Create `personal`, `break`, and `other` events.
- Try to create an overlapping event and verify the conflict message.
- Start workout from a scheduled event.
- Open the started event again and verify it opens the existing session.
- Open a completed event and verify it opens readonly session.
- Verify `/dashboard` shows only today's events.
- Check mobile viewport: calendar should be horizontally scrollable without broken layout.

## Risks

- Weekly grid can become too heavy.
  - Mitigation: simple 24x7 CSS grid, no drag-and-drop.
- Timezone bugs.
  - Mitigation: compute default date and week boundaries through trainer timezone.
- Derived session id can be mistaken for a DB column.
  - Mitigation: name it `existing_session_id` and never add `calendar_events.workout_session_id`.
- Conflict detection can block cancelled events.
  - Mitigation: exclude `status = 'cancelled'`.
- Event type migration can break existing `personal` events.
  - Mitigation: keep `personal`, only add `break`.
- Sprint 1B session flow can regress.
  - Mitigation: started/completed events open direct links via `existing_session_id`.

## Implementation Order

1. Add migration for `break` event type.
2. Update `lib/database.types.ts`.
3. Update calendar schemas for event type and `duration_hours`.
4. Add timezone-aware default start date.
5. Add week query with derived `existing_session_id`.
6. Add conflict detection helper.
7. Update create/update calendar actions.
8. Implement toolbar navigation and `?start=YYYY-MM-DD`.
9. Implement weekly grid.
10. Implement create/edit dialog from cell click.
11. Update event cards/actions.
12. Verify dashboard remains today-focused.
13. Run `pnpm typecheck`.
14. Run `pnpm lint`.
15. Run manual QA.
16. Commit as `Sprint 1C - Calendar Core v2`.

## Planned Files

- `supabase/migrations/*_add_break_calendar_event_type.sql`
- `lib/database.types.ts`
- `features/calendar/schemas.ts`
- `features/calendar/queries.ts`
- `features/calendar/actions.ts`
- `features/calendar/components/*`
- `app/(protected)/calendar/page.tsx`
- `app/(protected)/dashboard/page.tsx` only if required to preserve today-focused behavior.

## Next Candidate: Sprint 1D - Seeded Exercise Base & Muscle Groups

Future idea, not implemented in Sprint 1C:

- Seeded exercise base.
- Exercise selection by muscle group.
- Groups: lower body, chest, back, shoulders, arms, core, cardio/GPP, mobility.
- Short exercise descriptions.
- Target muscles.
- Custom exercise if the needed movement is missing.
- Quick chips/icons by group.
- Add exercise from base to workout session.
- Agree on the initial exercise list with the product owner before seeding.
