# Sprint 1F-b - Workout Patterns & Training Plan Templates

## Summary

Sprint 1F-b adds the missing cyclic planning layer:

`template -> plan patterns -> planned workouts -> scheduled event -> prefilled workout session`

The trainer can define workout patterns such as A/B/C, fill each pattern once with exercises and planned sets, assign patterns to weekdays, and materialize those patterns into planned workouts. Templates are reusable sources only; once a client plan is created, it is independent from the template.

## Scope

Included:

- workout patterns inside a client training plan;
- pattern exercises and pattern sets;
- weekday-to-pattern assignment;
- materialized copy from pattern to planned workouts;
- explicit apply-to-planned-workouts action;
- custom training plan templates;
- create plan from template;
- save client plan as template.

Not included:

- drag-and-drop;
- automatic progression;
- AI generation;
- advanced periodization;
- analytics or plan-vs-actual charts;
- nutrition, body logs, client portal;
- Google Calendar integration;
- 1RM percentage calculation.

## Database Model

New planned pattern tables:

- `training_plan_patterns`;
- `pattern_exercises`;
- `pattern_sets`.

New template tables:

- `training_plan_templates`;
- `template_patterns`;
- `template_exercises`;
- `template_sets`.

`planned_workouts` gets:

- `pattern_id uuid null references public.training_plan_patterns(id) on delete set null`.

Pattern/template exercises and sets mirror the planned layer closely enough that data can travel:

`template -> pattern -> planned -> session`

## Materialized Copy

CoachOS uses materialized copy, not live references:

- pattern data is copied into `planned_exercises` / `planned_sets`;
- planned workouts can be tweaked independently;
- changing a pattern does not silently rewrite existing planned workouts;
- trainer must explicitly apply a pattern again.

Sprint 1F-b only applies patterns to eligible `planned` workouts. Started/completed workouts are protected from overwrite.

## Templates

Templates support:

- `system` source type, `trainer_id = null`;
- `custom` source type, `trainer_id = auth.uid()`.

Trainers can read active system templates and their own custom templates. Trainers can create/update/archive only their own custom templates. System template content should be seeded only after product approval.

## UX

Plan detail includes:

- A/B/C pattern list;
- create pattern form;
- weekday-to-pattern assignment;
- save plan as template;
- planned workout list.

Pattern detail includes:

- pattern metadata;
- exercise selector from CoachOS exercise base;
- planned set editor;
- apply pattern to planned workouts.

Template flow:

- open client plans;
- choose `Create from template`;
- select template, start date, duration and weekdays;
- app copies template patterns into the client plan and generates planned workouts.

## RLS

RLS is enabled on all new tables.

Pattern tables use `trainer_id = auth.uid()` plus parent ownership checks.

Template tables allow:

- select active system templates;
- select own custom templates;
- insert/update only own custom templates.

Physical delete is not part of the UI.

## Manual QA

1. Create a client plan.
2. Create patterns A, B, C.
3. Add exercises and planned sets to each pattern.
4. Assign Monday/Wednesday/Friday to A/B/C.
5. Verify planned workouts receive copied exercises and sets.
6. Edit a pattern and apply it to planned workouts.
7. Verify started/completed workouts are not overwritten.
8. Save plan as a custom template.
9. Create another plan from that template.
10. Schedule a planned workout and verify one calendar event is created.
11. Start workout and verify the session is prefilled.
12. Verify Sprint 1C calendar, Sprint 1D exercise base and private preview auth still work.

## Known Limitations

- System templates are supported by schema/RLS but not broadly seeded with approved exercise content yet.
- Pattern apply currently targets eligible planned workouts and intentionally avoids scheduled/in-progress/completed workouts.
- No drag-and-drop order editing; ordering is position-based.
