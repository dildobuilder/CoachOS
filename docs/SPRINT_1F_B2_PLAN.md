# Sprint 1F-b2 - Reusable Templates, Pattern History & Plan Management

## Summary

Sprint 1F-b2 stabilizes the planning layer added in Sprint 1F/1F-b.

Current-state check:

- Template migration already exists: `supabase/migrations/202605300001_create_workout_patterns_templates.sql`.
- Template tables already exist: `training_plan_templates`, `template_patterns`, `template_exercises`, `template_sets`.
- Pattern tables already exist: `training_plan_patterns`, `pattern_exercises`, `pattern_sets`.
- `planned_workouts.pattern_id` already exists.
- Template actions already exist: `createPlanFromTemplate`, `saveTrainingPlanAsTemplate`, `archiveTrainingPlanTemplate`.
- Route `/clients/[clientId]/plans/templates` already exists.

This pass does not create duplicate tables, duplicate migrations, or parallel template actions.

## Template Source Behavior

Templates are source objects only.

- `system` templates have `trainer_id = null`.
- `custom` templates belong to the current trainer.
- Trainers can read active system templates and their own custom templates.
- Trainers cannot edit system templates.
- A client plan created from a template becomes independent from that template.
- Changing a template later does not mutate existing client plans.

No complex system template seed is added in this pass.

## Create Plan From Template

`createPlanFromTemplate` must create an independent client plan:

1. Create `training_plan`.
2. Copy `template_patterns` into `training_plan_patterns`.
3. Copy `template_exercises` into `pattern_exercises`.
4. Copy `template_sets` into `pattern_sets`.
5. Generate `planned_workouts`.
6. Assign copied pattern ids to planned workouts.
7. Materialize copied pattern content into `planned_exercises` and `planned_sets`.

The resulting client plan can be edited without changing the original template.

## Save Plan As Template

`saveTrainingPlanAsTemplate` copies plan structure only:

- plan metadata;
- plan patterns;
- pattern exercises;
- pattern sets.

It must not copy:

- `workout_sessions`;
- `session_exercises`;
- `session_sets`;
- completed workout history.

Saved templates are trainer-owned custom templates.

## Previous Same-Pattern Workout

Active workout sessions should show previous workout context by pattern when possible.

Query behavior:

1. Load current `workout_sessions` row.
2. Read `client_id`, `started_at`, and `planned_workout_id`.
3. Load linked `planned_workouts.pattern_id`.
4. If there is no `pattern_id`, use the existing generic fallback.
5. If `pattern_id` exists, find the latest previous completed workout session where:
   - same `client_id`;
   - `workout_sessions.status = completed`;
   - `workout_sessions.started_at < current.started_at`;
   - linked `planned_workouts.pattern_id` equals current pattern id.
6. Fetch exercises and sets for that previous session.

Display behavior:

- If same-pattern history exists, show `Прошлая тренировка по паттерну A - Ноги`.
- Show date, exercises, set rows, weight, reps, intensity, and compact notes.
- If current session has a pattern but no previous completed session with the same pattern, show `Предыдущих завершённых тренировок по этому паттерну пока нет.`
- Do not show unrelated completed workouts as same-pattern history.
- This block is read-only. No copy-from-previous action is added.

## Archive/Delete Plan Behavior

The UI uses destructive wording (`Удалить`) but the action archives instead of physically deleting.

`archiveTrainingPlan(planId)`:

- sets `training_plans.status = archived`;
- sets unscheduled planned workouts with `status = planned` to `cancelled`;
- leaves `scheduled`, `in_progress`, and `completed` planned workouts untouched;
- does not delete workout sessions;
- does not delete completed calendar events;
- does not delete completed history.

The default plans list hides archived plans.

Confirmation text:

`Удалить тренировочный план? История завершённых тренировок сохранится. Тренировки с назначенным временем останутся в календаре.`

## QA Checklist

1. Open a client plan with A/B/C patterns.
2. Save the plan as a custom template.
3. Create another client plan from that custom template.
4. Verify patterns are copied.
5. Verify exercises and planned sets are copied.
6. Verify planned workouts are generated with copied content.
7. Schedule one planned workout.
8. Start and complete it.
9. Start the next workout with the same pattern.
10. Verify the previous workout block shows only previous completed workout with the same pattern.
11. Verify unrelated previous workout is not shown as same-pattern history.
12. Archive a training plan from the client plans list.
13. Verify the plan disappears from the active plans list.
14. Verify completed workout history still opens.
15. Verify calendar scheduling, exercise base, prefilled session start, completed readonly mode, and private preview auth still work.

## Known Limitations

- Pattern history is informational only; copying previous results into the current workout is intentionally out of scope.
- Scheduled planned workouts are not removed from the trainer calendar when a plan is archived.
- System template content remains minimal until product-approved template seeds are provided.
- Template edits do not propagate to already-created client plans.
