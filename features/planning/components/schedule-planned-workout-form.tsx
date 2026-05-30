import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { schedulePlannedWorkout } from "@/features/planning/actions";
import type { PlannedWorkoutDetail } from "@/features/planning/queries";

type SchedulePlannedWorkoutFormProps = {
  workout: PlannedWorkoutDetail;
};

export function SchedulePlannedWorkoutForm({ workout }: SchedulePlannedWorkoutFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Назначить время</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={schedulePlannedWorkout.bind(null, workout.id)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Дата</Label>
              <Input id="date" name="date" type="date" defaultValue={workout.planned_date} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="starts_at_time">Начало</Label>
              <Select id="starts_at_time" name="starts_at_time" defaultValue="10:00">
                {Array.from({ length: 24 }, (_, hour) => {
                  const value = `${String(hour).padStart(2, "0")}:00`;

                  return (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  );
                })}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_hours">Длительность</Label>
              <Select id="duration_hours" name="duration_hours" defaultValue="1">
                <option value="1">1 час</option>
                <option value="2">2 часа</option>
                <option value="3">3 часа</option>
                <option value="4">4 часа</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Название события</Label>
            <Input id="title" name="title" defaultValue={plannedWorkoutTitle(workout)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Заметки</Label>
            <Textarea id="notes" name="notes" defaultValue={workout.notes ?? ""} />
          </div>
          <div className="flex justify-end">
            <SubmitButton>Назначить</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function plannedWorkoutTitle(workout: PlannedWorkoutDetail) {
  return workout.training_plan_patterns?.name || workout.training_plans?.name || workout.name;
}
