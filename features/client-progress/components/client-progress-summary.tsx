import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientProgressDashboard } from "@/features/client-progress/queries";

type ClientProgressSummaryProps = {
  dashboard: ClientProgressDashboard;
};

export function ClientProgressSummary({ dashboard }: ClientProgressSummaryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Прогресс</CardTitle>
        <Button asChild size="sm" variant="outline">
          <Link href={`/clients/${dashboard.client.id}/progress`}>Открыть прогресс</Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Текущий вес" value={formatWeight(dashboard.weight.currentWeight)} />
        <Metric label="Дельта от старта" value={formatDelta(dashboard.weight.deltaFromStart)} />
        <Metric label="Тренировок за 30 дней" value={String(dashboard.sessions.completedCount)} />
        <Metric label="Выполнение плана" value={formatAdherence(dashboard.adherence.adherencePercent)} />
        <div className="rounded-md border bg-background p-3 sm:col-span-2">
          <div className="text-xs font-medium uppercase text-muted-foreground">Активный план</div>
          <div className="mt-1 font-semibold">{dashboard.activePlan?.name ?? "Активный план не назначен"}</div>
        </div>
        <div className="rounded-md border bg-background p-3 sm:col-span-2">
          <div className="text-xs font-medium uppercase text-muted-foreground">Следующая тренировка</div>
          <div className="mt-1 font-semibold">
            {dashboard.nextPlannedWorkout
              ? `${dashboard.nextPlannedWorkout.title} · ${formatDate(dashboard.nextPlannedWorkout.plannedDate)}`
              : "Плановых тренировок пока нет"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
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

function formatAdherence(value: number | null) {
  return value === null ? "Нет данных" : `${value}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long"
  }).format(new Date(`${value}T00:00:00.000Z`));
}
