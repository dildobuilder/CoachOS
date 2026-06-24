import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTrainingPlan, updateTrainingPlan } from "@/features/planning/actions";
import type { TrainingPlanRow } from "@/features/planning/queries";

type TrainingPlanFormProps = {
  clientId: string;
  defaultStartDate: string;
  plan?: TrainingPlanRow;
};

const weekdays = [
  { value: 1, label: "Пн" },
  { value: 2, label: "Вт" },
  { value: 3, label: "Ср" },
  { value: 4, label: "Чт" },
  { value: 5, label: "Пт" },
  { value: 6, label: "Сб" },
  { value: 7, label: "Вс" }
];

export function TrainingPlanForm({ clientId, defaultStartDate, plan }: TrainingPlanFormProps) {
  const isEdit = Boolean(plan);
  const action = plan ? updateTrainingPlan.bind(null, plan.id) : createTrainingPlan.bind(null, clientId);
  const selectedWeekdays = new Set(plan?.training_weekdays ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Редактировать тренировочный план" : "Создать тренировочный план"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Название" name="name" placeholder="4 недели силы" defaultValue={plan?.name} required />
            <Field label="Дата старта" name="starts_on" type="date" defaultValue={plan?.starts_on ?? defaultStartDate} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration_weeks">Длительность</Label>
              <Select id="duration_weeks" name="duration_weeks" defaultValue={String(plan?.duration_weeks ?? 4)}>
                <option value="4">4 недели</option>
                <option value="6">6 недель</option>
                <option value="8">8 недель</option>
                <option value="12">12 недель</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="split_type">Тип сплита</Label>
              <Select id="split_type" name="split_type" defaultValue={plan?.split_type ?? "custom"}>
                <option value="full_body">Full body</option>
                <option value="upper_lower">Upper / Lower</option>
                <option value="push_pull_legs">Push / Pull / Legs</option>
                <option value="powerlifting">Powerlifting</option>
                <option value="custom">Custom</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Тренировочные дни</Label>
            <div className="flex flex-wrap gap-2">
              {weekdays.map((day) => (
                <label key={day.value} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    name="training_weekdays"
                    value={day.value}
                    defaultChecked={selectedWeekdays.has(day.value)}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Заметки</Label>
            <Textarea id="notes" name="notes" defaultValue={plan?.notes ?? ""} />
          </div>

          <div className="flex justify-end">
            <SubmitButton>{isEdit ? "Сохранить план" : "Создать план"}</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} />
    </div>
  );
}
