import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertClientDailyLog } from "@/features/client-logs/actions";
import type { ClientDailyLogRow } from "@/features/client-logs/queries";

type DailyLogFormProps = {
  clientId: string;
  startDate: string;
  selectedDate: string;
  log?: ClientDailyLogRow | null;
};

export function DailyLogForm({ clientId, startDate, selectedDate, log }: DailyLogFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Дневник</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={upsertClientDailyLog.bind(null, clientId)} className="grid gap-4">
          <input type="hidden" name="return_to_start" value={startDate} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Дата" name="log_date" type="date" defaultValue={selectedDate} required />
            <Field label="Вес, кг" name="body_weight" type="number" step="0.1" defaultValue={log?.body_weight} />
            <Field label="Калории" name="calories" type="number" defaultValue={log?.calories} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Белки, г" name="protein" type="number" defaultValue={log?.protein} />
            <Field label="Жиры, г" name="fat" type="number" defaultValue={log?.fat} />
            <Field label="Углеводы, г" name="carbs" type="number" defaultValue={log?.carbs} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Заметка</Label>
            <Textarea id="notes" name="notes" defaultValue={log?.notes ?? ""} />
          </div>
          <div className="flex justify-end">
            <SubmitButton>{log ? "Сохранить дневник" : "Заполнить дневник"}</SubmitButton>
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
  step,
  defaultValue,
  required
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  defaultValue?: string | number | null;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        min={type === "number" ? "0" : undefined}
        step={step}
        defaultValue={defaultValue ?? ""}
        required={required}
      />
    </div>
  );
}
