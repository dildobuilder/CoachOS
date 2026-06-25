# Sprint 1J - Client Progress Dashboard

## Goal

Add a read-only client progress dashboard that helps a coach quickly understand client state: weight, completed sessions, planned workout adherence, active plan, next planned workout, latest completed workout, and recent plan-vs-actual deviations.

## Strict Scope

- No new tables.
- No migrations.
- No RLS changes.
- No server actions.
- No database writes.
- No separate analytics model.
- No tonnage, PR tracking, recommendations, AI insights, nutrition recommendations, body measurements, volume charts, or strength charts.

## Data Sources

- `clients.starting_weight` for starting weight.
- `client_daily_logs.body_weight` for current weight and trend.
- `training_plans` for active plan.
- `planned_workouts` for next planned workout and adherence.
- `workout_sessions` for completed session counts and latest completed workout.
- Sprint 1I plan-vs-actual review for recent deviations.

## Dashboard Model

`features/client-progress/queries.ts` exposes:

- `getClientProgressDashboard(clientId, { range })`
- `ProgressRange = "30" | "90" | "all"`
- `ClientProgressDashboard`
- `WeightTrendPoint`
- `WeightSummary`
- `SessionSummary`
- `AdherenceSummary`
- `RecentPlanActualHighlight`

The model is normalized for UI and does not expose raw DB rows directly.

## Range Behavior

- `30`: last 30 days.
- `90`: last 90 days.
- `all`: all available client data.
- Default: `30`.
- Recent plan-vs-actual highlights are always limited to the latest 5 linked completed sessions.

## Metrics

### Weight

- Starting weight comes from `clients.starting_weight`.
- Current weight is the latest non-null `client_daily_logs.body_weight`.
- Delta is `current - starting`.
- Trend uses body weight logs in selected range.

### Sessions

- Completed session count uses only `workout_sessions.status = completed`.
- Latest completed workout uses the newest completed session.
- No volume, tonnage, PR, or strength analytics.

### Adherence

Due planned workout:

- belongs to the client;
- is inside selected range;
- `planned_date <= today`;
- status is not `cancelled`.

Completed planned workout:

- `planned_workouts.status = completed`; or
- linked `workout_session.status = completed`.

Missed planned workout:

- `planned_date < today`;
- status is not `completed`;
- status is not `cancelled`;
- no linked completed workout session.

Today’s uncompleted planned workout is not counted as missed.

## UI

- Client overview shows compact progress summary.
- Full page lives at `/clients/[clientId]/progress`.
- Client profile navigation includes `Прогресс`.
- Full page includes range switcher, metric cards, SVG weight chart, active plan block, adherence block, latest completed workout, and recent deviations.
- Weight chart is lightweight SVG with no new dependency.

## Empty States

- `Данных по весу пока нет`
- `Стартовый вес не указан`
- `Завершенных тренировок пока нет`
- `Плановых тренировок пока нет`
- `Активный план не назначен`
- `Пока нет плановых тренировок для расчета выполнения`
- `Заметных отклонений пока нет`

## Known Limitations

- No tonnage.
- No PR tracking.
- No recommendations.
- No advanced charts.
- No nutrition recommendations.
- Missed statuses are computed only; data is not mutated.
- Plan-vs-actual highlights use only existing planned IDs.
- Legacy sessions may have limited highlights.

## QA Checklist

1. Open a client with no daily logs and no completed sessions.
2. Confirm dashboard renders empty states.
3. Add daily logs with body weight.
4. Confirm current weight is latest non-null body weight.
5. Confirm weight delta from starting weight is correct.
6. Confirm SVG weight trend renders.
7. Test `range=30`.
8. Test `range=90`.
9. Test `range=all`.
10. Confirm metrics and chart change with selected range.
11. Open a client with active plan.
12. Confirm active plan summary appears.
13. Confirm next planned workout appears.
14. Confirm due/completed/missed/adherence are correct.
15. Confirm today’s not-completed planned workout is not shown as missed.
16. Confirm yesterday’s not-completed planned workout is shown as missed.
17. Confirm linked completed session counts as completed planned workout.
18. Confirm denominator zero shows neutral state, not `0%`.
19. Confirm latest completed workout appears.
20. Confirm recent plan-vs-actual highlights show changed/added/missed items.
21. Confirm highlights are limited to 5 sessions.
22. Confirm client profile compact summary appears.
23. Confirm `Прогресс` navigation works.
24. Confirm desktop and mobile layouts are readable.
25. Confirm Sprint 1C calendar, Sprint 1D exercise flow, Sprint 1H plan edit, Sprint 1I review, and private preview auth still work.
