import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCalendarEvent } from "@/features/calendar/actions";

type ClientScheduleTrainingFormProps = {
  clientId: string;
  startDate: string;
};

export function ClientScheduleTrainingForm({ clientId, startDate }: ClientScheduleTrainingFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Запланировать тренировку</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createCalendarEvent} className="grid gap-4">
          <input type="hidden" name="type" value="client_training" />
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="return_to_start" value={startDate} />
          <input type="hidden" name="return_to_path" value={`/clients/${clientId}/calendar`} />

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Дата" name="date" type="date" defaultValue={startDate} required />
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

          <Field label="Название" name="title" placeholder="Можно оставить пустым" />
          <div className="space-y-2">
            <Label htmlFor="notes">Заметки</Label>
            <Textarea id="notes" name="notes" />
          </div>
          <div className="flex justify-end">
            <SubmitButton>Создать событие</SubmitButton>
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
