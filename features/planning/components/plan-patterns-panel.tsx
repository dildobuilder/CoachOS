import Link from "next/link";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  assignPatternToWeekday,
  createTrainingPlanPattern,
  saveTrainingPlanAsTemplate
} from "@/features/planning/actions";
import type { TrainingPlanPatternRow, TrainingPlanRow } from "@/features/planning/queries";

type PlanPatternsPanelProps = {
  clientId: string;
  plan: TrainingPlanRow;
  patterns: TrainingPlanPatternRow[];
};

const weekdayLabels: Record<number, string> = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  7: "Воскресенье"
};

export function PlanPatternsPanel({ clientId, plan, patterns }: PlanPatternsPanelProps) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>A/B/C patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={createTrainingPlanPattern.bind(null, plan.id)} className="grid gap-3 rounded-md bg-secondary/40 p-3 sm:grid-cols-[80px_1fr_1fr_auto] sm:items-end">
            <Field label="Код" name="code" placeholder="A" required />
            <Field label="Название" name="name" placeholder="Ноги" required />
            <Field label="Описание" name="description" placeholder="Фокус тренировки" />
            <SubmitButton>Создать</SubmitButton>
          </form>

          {patterns.length > 0 ? (
            <div className="grid gap-2">
              {patterns.map((pattern) => (
                <div key={pattern.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold">
                      {pattern.code} - {pattern.name}
                    </div>
                    {pattern.description ? <p className="text-sm text-muted-foreground">{pattern.description}</p> : null}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/clients/${clientId}/plans/${plan.id}/patterns/${pattern.id}`}>Открыть</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Patterns пока нет. Создайте A/B/C структуру перед назначением на дни.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Назначение на дни недели</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {plan.training_weekdays.map((weekday) => (
            <form key={weekday} action={assignPatternToWeekday.bind(null, plan.id)} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
              <input type="hidden" name="weekday" value={weekday} />
              <div className="font-medium">{weekdayLabels[weekday] ?? weekday}</div>
              <div className="flex flex-wrap gap-2">
                <Select name="pattern_id" required>
                  <option value="">Выберите pattern</option>
                  {patterns.map((pattern) => (
                    <option key={pattern.id} value={pattern.id}>
                      {pattern.code} - {pattern.name}
                    </option>
                  ))}
                </Select>
                <SubmitButton size="sm" disabled={patterns.length === 0}>
                  Применить
                </SubmitButton>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Сохранить как шаблон</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveTrainingPlanAsTemplate.bind(null, plan.id)} className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Название" name="name" defaultValue={plan.name} required />
              <Field label="Категория" name="category" placeholder="Сила / новичок" />
              <Field label="Use case" name="use_case" placeholder="3 раза в неделю" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Описание</Label>
              <Textarea id="template-description" name="description" defaultValue={plan.notes ?? ""} />
            </div>
            <div className="flex justify-end">
              <SubmitButton variant="outline">Сохранить шаблон</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} required={required} />
    </div>
  );
}
