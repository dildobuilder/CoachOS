import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StartingWeightForm } from "@/features/client-logs/components/starting-weight-form";

type ClientWeightSummaryProps = {
  clientId: string;
  startingWeight?: number | null;
  currentWeight?: number | null;
  returnToPath: string;
};

export function ClientWeightSummary({
  clientId,
  startingWeight,
  currentWeight,
  returnToPath
}: ClientWeightSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Вес клиента</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Стартовый" value={formatWeight(startingWeight)} />
          <Metric label="Текущий" value={formatWeight(currentWeight)} />
        </div>
        <StartingWeightForm clientId={clientId} startingWeight={startingWeight} returnToPath={returnToPath} />
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

function formatWeight(value?: number | null) {
  return value ? `${value} кг` : "Нет данных";
}
