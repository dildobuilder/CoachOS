import Link from "next/link";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArchiveTrainingPlanButton } from "@/features/planning/components/archive-training-plan-button";
import type { TrainingPlanRow } from "@/features/planning/queries";

type TrainingPlanListProps = {
  clientId: string;
  plans: TrainingPlanRow[];
};

export function TrainingPlanList({ clientId, plans }: TrainingPlanListProps) {
  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Планов пока нет.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {plans.map((plan) => (
        <Card key={plan.id} className="transition-colors hover:bg-secondary/30">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/clients/${clientId}/plans/${plan.id}`} className="min-w-0 flex-1 space-y-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{plan.name}</h3>
                <Badge variant={plan.status === "active" ? "default" : "outline"}>{statusLabel(plan.status)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(plan.starts_on)} - {formatDate(plan.ends_on)} · {plan.sessions_per_week} трен./нед.
              </p>
            </Link>

            <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
              {plan.status !== "archived" ? (
                <Button asChild variant="outline" size="icon" aria-label="Редактировать план" title="Редактировать план">
                  <Link href={`/clients/${clientId}/plans/${plan.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              {plan.status !== "archived" ? <ArchiveTrainingPlanButton planId={plan.id} compact /> : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function statusLabel(status: TrainingPlanRow["status"]) {
  if (status === "completed") {
    return "Завершен";
  }

  if (status === "archived") {
    return "Архив";
  }

  if (status === "inactive") {
    return "Неактивен";
  }

  return "Активен";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short"
  }).format(parseDate(value));
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}
