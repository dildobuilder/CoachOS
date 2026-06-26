# Sprint 1K - Planning UX Acceleration & Series 1 Polish

## Goal

Speed up CoachOS planning workflows without changing the planning architecture. Trainers should quickly see whether a plan is filled, assign A/B/C patterns to all training weekdays in one batch, and find future planned workouts that still need attention.

## Strict Scope

- No new tables.
- No migrations.
- No RLS changes.
- No drag-and-drop.
- No new scheduling engine.
- No calendar drag scheduling.
- No analytics, AI, auto-progression, PR, tonnage, or volume charts.
- No mutation of `calendar_events`.
- No mutation of `workout_sessions`.
- No mutation of scheduled, started, completed, or cancelled planned workout content.

## UX Changes

- Plan detail shows a compact `План заполнен?` summary:
  - patterns count;
  - assigned weekdays;
  - planned workouts without pattern;
  - planned workouts without exercises;
  - future unscheduled workouts;
  - scheduled, completed, cancelled counts.
- `PlanPatternsPanel` includes a batch weekday-to-pattern form:
  - one select per `training_plans.training_weekdays`;
  - submit: `Применить расписание patterns`;
  - warning explains that scheduled, started, and completed workouts are protected.
- Pattern editor shows:
  - exercise count;
  - planned set count;
  - clearer `Применить к будущим тренировкам` CTA.
- Planned workout list includes:
  - badges: `Без pattern`, `Пустая`, `Заполнена`, `В календаре`, `Завершена`, `Отменена`;
  - UI-only filters: `Все`, `Без pattern`, `Пустые`, `Будущие без времени`;
  - more visible `Назначить время` CTA for unscheduled planned workouts.

## Batch Assignment Behavior

Server action:

```ts
assignPatternsToWeekdays(planId: string, formData: FormData)
```

Rules:

- weekday convention remains `1 = Monday ... 7 = Sunday`;
- every plan training weekday must have a selected pattern;
- clearing/unassigning pattern is out of scope;
- every selected pattern must belong to the target plan;
- trainer must own the plan and client;
- client-side data is never trusted.

## Eligible Planned Workouts

A planned workout can be changed only if all are true:

- belongs to the target plan;
- belongs to the current trainer;
- `planned_date >= today`;
- `status = planned`;
- no `calendar_event_id`;
- no linked `workout_session`;
- weekday matches the submitted assignment.

Protected planned workouts are not changed:

- scheduled;
- in progress;
- completed;
- cancelled;
- linked to `calendar_events`;
- linked to `workout_sessions`.

## Materialization And Idempotency

For eligible planned workouts only:

- old `planned_exercises` are deleted using the existing project style;
- new `planned_exercises` and `planned_sets` are copied from the selected pattern;
- `planned_workouts.pattern_id` and `planned_workouts.name` are updated;
- repeating the same batch submit produces the same final content and does not duplicate exercises or sets.

## Known Limitations

- No drag-and-drop.
- No calendar drag scheduling.
- No bulk date selection.
- No new scheduling engine.
- No unassign/clear pattern behavior.
- No transaction/RPC was added; the mutation remains server-side and scoped.
- No analytics or plan generation logic.

## QA Checklist

1. Open a plan with Monday/Wednesday/Friday training days.
2. Create patterns A/B/C.
3. Confirm `План заполнен?` summary appears.
4. Confirm patterns count is correct.
5. Confirm assigned weekdays count is correct.
6. Confirm planned workouts without pattern are highlighted.
7. Confirm empty planned workouts without exercises are highlighted.
8. Assign A/B/C through one batch form.
9. Submit `Применить расписание patterns`.
10. Confirm future unscheduled planned workouts received correct pattern names.
11. Confirm planned exercises were copied from patterns.
12. Confirm planned sets were copied from patterns.
13. Submit the same batch form again.
14. Confirm duplicate planned exercises were not created.
15. Confirm duplicate planned sets were not created.
16. Confirm scheduled planned workout was not changed.
17. Confirm completed planned workout was not changed.
18. Confirm planned workout with linked session was not changed.
19. Confirm no `calendar_events` were changed.
20. Confirm no `workout_sessions` were changed.
21. Confirm status badges work.
22. Confirm UI-only filters work.
23. Confirm mobile layout remains readable.
24. Confirm existing scheduling CTA still works.
25. Confirm `startWorkoutFromEvent` still works.
26. Confirm completed history still works.
27. Confirm Sprint 1H safe edit still works.
28. Confirm Sprint 1I review still works.
29. Confirm Sprint 1J dashboard still works.
30. Confirm private preview auth still works.
