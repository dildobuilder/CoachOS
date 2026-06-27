# Sprint 2A - UI Simplification & Navigation Cleanup

## Goal

Sprint 2A simplifies the main CoachOS workflow screens without changing database schema, RLS, server actions, or domain behavior.

The UI principle is:

- pages show state first;
- actions appear only when the trainer intends to act;
- tabs are the single navigation system inside a client;
- each screen has one clear primary action.

## Touched Screens

- Global calendar: `/calendar`
- Client overview: `/clients/[clientId]`
- Client calendar: `/clients/[clientId]/calendar`
- Client plans list: `/clients/[clientId]/plans`
- New plan flow: `/clients/[clientId]/plans/new`
- Plan detail: `/clients/[clientId]/plans/[planId]`

## Before / After

### Global Calendar

Before:

- `/calendar` opened from the selected/current date.
- `Сегодня` moved to today's date as the visible start.

After:

- `/calendar` without `start` opens the current calendar week starting Monday.
- `Эта неделя` returns to the current Monday-start week.
- `Предыдущая неделя` and `Следующая неделя` shift visible start by 7 days.
- Date input keeps the selected date as visible start.
- `К началу недели` normalizes the current visible date to Monday.

### Client Overview

Before:

- The client page had tabs and duplicate navigation buttons for calendar/plans.

After:

- `ClientProfileNav` is the only client section navigation.
- `Редактировать клиента` remains as a secondary contextual action.

### Client Calendar

Before:

- Training scheduling and daily log forms were permanently visible.
- Day action changed query params and moved the user back to the top forms.

After:

- Forms are hidden by default.
- Each day card has a contextual action menu.
- Scheduling and daily log forms open in a local modal/panel with the selected day prefilled.
- Existing `createCalendarEvent` and `upsertClientDailyLog` actions are reused.

### Client Plans

Before:

- Plans page had multiple top-level actions.
- Plan cards had several visible buttons.

After:

- Plans page has one primary action: `Создать тренировочный план`.
- Create flow offers `С нуля` and `Из шаблона` inside `/plans/new`.
- Plan cards are clickable.
- Cards keep only compact edit/archive icon buttons.
- `Сделать активным` lives on the plan detail page.

## Navigation Rules

- Client tabs are the only client section navigation.
- Do not duplicate tab destinations as standalone buttons.
- Entity cards can navigate to their detail page when the behavior is clear.

## Button Hierarchy

- Use one primary button per screen for the main action.
- Secondary or contextual actions use outline/secondary styles.
- Destructive actions stay visually destructive and keep confirmation.
- Icon buttons must include accessible labels.

## Form Visibility

- Calendar/list/overview pages should not show large forms by default.
- Forms open from contextual actions.
- Existing server actions remain the only source of mutations.

## Calendar Week Behavior

- Week starts on Monday.
- Global weekly calendar defaults to the current Monday-start calendar week.
- Date picker selection remains explicit and is not auto-normalized until the trainer clicks `К началу недели`.

## QA Checklist

### Global Calendar

- Open `/calendar` and verify Monday-Sunday current week.
- Verify `Эта неделя`, previous/next week, date input, and `К началу недели`.
- Create an event and verify conflict detection still works.
- Start a workout from a calendar event.

### Client Overview

- Verify client tabs remain.
- Verify duplicate calendar/plans buttons are gone.
- Verify client edit still works.

### Client Calendar

- Verify scheduling and daily log forms are hidden by default.
- Open day action menu.
- Schedule a training from a selected day.
- Save/edit a daily log from a selected day.
- Verify selected range is preserved after submit.
- Verify mobile layout remains readable.

### Client Plans

- Verify only `Создать тренировочный план` appears as top primary action.
- Verify `/plans/new` supports `С нуля` and `Из шаблона`.
- Verify plan cards navigate to plan detail.
- Verify edit/archive icon buttons do not trigger card navigation.
- Verify plan activation is available on plan detail when applicable.

### Regression

- Sprint 1C calendar flow.
- Sprint 1D exercise flow.
- Sprint 1F planning/start flow.
- Sprint 1G active plan logic.
- Sprint 1H safe edit.
- Sprint 1I plan-vs-actual review.
- Sprint 1J progress dashboard.
- Sprint 1K planning UX.
- Private preview auth.

## Non-goals

- No migrations.
- No schema changes.
- No RLS changes.
- No new domain entities.
- No changes to `calendar_events`, `planned_workouts`, `workout_sessions`, or `client_daily_logs` behavior.
- No drag-and-drop.
- No Command Center.
- No analytics expansion.
- No redesign of pattern editor or planned set editing internals.
