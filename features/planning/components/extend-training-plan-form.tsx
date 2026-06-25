import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extendTrainingPlan } from "@/features/planning/actions";
import type { TrainingPlanRow } from "@/features/planning/queries";

type ExtendTrainingPlanFormProps = {
  plan: TrainingPlanRow;
};

export function ExtendTrainingPlanForm({ plan }: ExtendTrainingPlanFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Продление плана</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={extendTrainingPlan.bind(null, plan.id)} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="extend_weeks">Добавить недель</Label>
            <Input id="extend_weeks" name="extend_weeks" type="number" min={1} max={52} defaultValue={1} required />
            <p className="text-xs text-muted-foreground">
              Будут созданы только новые будущие тренировки после текущего конца плана. История и тренировки в календаре не изменятся.
            </p>
          </div>
          <SubmitButton>Продлить</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
