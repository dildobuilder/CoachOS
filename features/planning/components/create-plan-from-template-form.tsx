import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createPlanFromTemplate } from "@/features/planning/actions";
import type { TrainingPlanTemplateRow } from "@/features/planning/queries";

type CreatePlanFromTemplateFormProps = {
  clientId: string;
  templates: TrainingPlanTemplateRow[];
  defaultStartDate: string;
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

export function CreatePlanFromTemplateForm({
  clientId,
  templates,
  defaultStartDate
}: CreatePlanFromTemplateFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Создать план из шаблона</CardTitle>
      </CardHeader>
      <CardContent>
        {templates.length > 0 ? (
          <form action={createPlanFromTemplate.bind(null, clientId)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template_id">Шаблон</Label>
                <Select id="template_id" name="template_id" required>
                  <option value="">Выберите шаблон</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.source_type === "system" ? "CoachOS" : "свой"})
                    </option>
                  ))}
                </Select>
              </div>
              <Field label="Название плана" name="name" placeholder="Можно оставить пустым" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Дата старта" name="starts_on" type="date" defaultValue={defaultStartDate} required />
              <div className="space-y-2">
                <Label htmlFor="duration_weeks">Срок действия, недель</Label>
                <Input id="duration_weeks" name="duration_weeks" type="number" min={1} max={156} defaultValue={4} required />
                <p className="text-xs text-muted-foreground">По умолчанию 4 недели. Минимум 1 неделя.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Тренировочные дни</Label>
              <div className="flex flex-wrap gap-2">
                {weekdays.map((day) => (
                  <label key={day.value} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <input type="checkbox" name="training_weekdays" value={day.value} />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <SubmitButton>Создать из шаблона</SubmitButton>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Шаблонов пока нет. Сохраните готовый клиентский план как custom template.
          </p>
        )}
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
