import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientStatusBadge } from "@/features/clients/components/client-status-badge";
import type { TrainingPlanRow } from "@/features/planning/queries";
import { formatDate } from "@/lib/dates";
import type { Database } from "@/lib/database.types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export function ClientProfileSummary({
  client,
  activePlan
}: {
  client: Client;
  activePlan?: TrainingPlanRow | null;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{client.preferred_name || client.name}</CardTitle>
            <ClientStatusBadge status={client.status} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <Info label="Цель" value={client.goal} />
          <Info label="Уровень" value={client.level} />
          <Info label="Телефон" value={client.phone} />
          <Info label="Email" value={client.email} />
          <Info label="Начало работы" value={formatDate(client.started_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Тренировочный контекст</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <Info label="Частота" value={activePlan ? `${activePlan.sessions_per_week} трен./нед.` : client.training_frequency} />
          <Info label="Сплит" value={activePlan ? splitLabel(activePlan.split_type) : client.training_split} />
          <Info label="Ограничения" value={client.limitations} />
          <Info label="Травмы" value={client.injuries} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Заметки</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {client.notes || "Заметок пока нет."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value || "Не указано"}</dd>
    </div>
  );
}

function splitLabel(splitType: TrainingPlanRow["split_type"]) {
  const labels: Record<TrainingPlanRow["split_type"], string> = {
    full_body: "Full body",
    upper_lower: "Upper / Lower",
    push_pull_legs: "Push / Pull / Legs",
    powerlifting: "Powerlifting",
    custom: "Custom"
  };

  return labels[splitType];
}
