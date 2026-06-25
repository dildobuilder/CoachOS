import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRangeSwitcher } from "@/features/client-progress/components/progress-range-switcher";
import { WeightTrendChart } from "@/features/client-progress/components/weight-trend-chart";
import type { ClientProgressDashboard as ClientProgressDashboardModel } from "@/features/client-progress/queries";

type ClientProgressDashboardProps = {
  dashboard: ClientProgressDashboardModel;
};

export function ClientProgressDashboard({ dashboard }: ClientProgressDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Период</h2>
          <p className="text-sm text-muted-foreground">Вес, тренировки и выполнение плана.</p>
        </div>
        <ProgressRangeSwitcher clientId={dashboard.client.id} activeRange={dashboard.range} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Стартовый вес" value={formatWeight(dashboard.weight.startingWeight)} />
        <MetricCard title="Текущий вес" value={formatWeight(dashboard.weight.currentWeight)} />
        <MetricCard title="Дельта" value={formatDelta(dashboard.weight.deltaFromStart)} />
        <MetricCard title="Завершено тренировок" value={String(dashboard.sessions.completedCount)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Динамика веса</CardTitle>
          </CardHeader>
          <CardContent>
            <WeightTrendChart points={dashboard.weight.trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Активный план</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {dashboard.activePlan ? (
              <>
                <div>
                  <div className="font-semibold">{dashboard.activePlan.name}</div>
                  <div className="text-muted-foreground">
                    {formatDate(dashboard.activePlan.startsOn)} - {formatDate(dashboard.activePlan.endsOn)}
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/clients/${dashboard.client.id}/plans/${dashboard.activePlan.id}`}>Открыть план</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Активный план не назначен</p>
            )}
            <div className="rounded-md border bg-background p-3">
              <div className="text-xs font-medium uppercase text-muted-foreground">Следующая тренировка</div>
              <div className="mt-1 font-semibold">
                {dashboard.nextPlannedWorkout?.title ?? "Плановых тренировок пока нет"}
              </div>
              {dashboard.nextPlannedWorkout ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatDate(dashboard.nextPlannedWorkout.plannedDate)}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdherenceCard dashboard={dashboard} />
        <LatestWorkoutCard dashboard={dashboard} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Последние отклонения от плана</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.recentHighlights.length === 0 ? (
            <p className="text-sm text-muted-foreground">Заметных отклонений пока нет</p>
          ) : (
            <div className="space-y-3">
              {dashboard.recentHighlights.map((highlight) => (
                <div key={highlight.sessionId} className="rounded-md border bg-background p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{highlight.title}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(highlight.completedAt)}</div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/sessions/${highlight.sessionId}`}>Открыть</Link>
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {highlight.changedExercises > 0 ? <Badge variant="secondary">Изменено: {highlight.changedExercises}</Badge> : null}
                    {highlight.addedExercises > 0 ? <Badge variant="secondary">Добавлено: {highlight.addedExercises}</Badge> : null}
                    {highlight.missedExercises > 0 ? <Badge variant="destructive">Не выполнено: {highlight.missedExercises}</Badge> : null}
                    {highlight.missedSets > 0 ? <Badge variant="outline">Пропущено подходов: {highlight.missedSets}</Badge> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium uppercase text-muted-foreground">{title}</div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function AdherenceCard({ dashboard }: ClientProgressDashboardProps) {
  const adherence = dashboard.adherence;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Выполнение плана</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {adherence.duePlannedCount === 0 ? (
          <p className="text-muted-foreground">Пока нет плановых тренировок для расчета выполнения</p>
        ) : (
          <>
            <div className="text-3xl font-semibold">{adherence.adherencePercent}%</div>
            <div className="grid gap-2 sm:grid-cols-3">
              <MiniMetric label="Плановых" value={adherence.duePlannedCount} />
              <MiniMetric label="Выполнено" value={adherence.completedPlannedCount} />
              <MiniMetric label="Пропущено" value={adherence.missedPlannedCount} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LatestWorkoutCard({ dashboard }: ClientProgressDashboardProps) {
  const workout = dashboard.sessions.latestCompletedWorkout;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последняя тренировка</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {workout ? (
          <>
            <div>
              <div className="font-semibold">{workout.title}</div>
              <div className="text-muted-foreground">{formatDateTime(workout.completedAt)}</div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/sessions/${workout.id}`}>Открыть</Link>
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground">Завершенных тренировок пока нет</p>
        )}
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function formatWeight(value: number | null) {
  return value === null ? "Нет данных" : `${value} кг`;
}

function formatDelta(value: number | null) {
  if (value === null) {
    return "Стартовый вес не указан";
  }

  return `${value > 0 ? "+" : ""}${value} кг`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}
