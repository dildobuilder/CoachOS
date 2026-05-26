import { DatePickerInput } from "@/components/forms/date-picker-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCalendarEvent } from "@/features/calendar/actions";
import type { ClientRow } from "@/features/clients/queries";

type EventFormProps = {
  clients: ClientRow[];
};

export function EventForm({ clients }: EventFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Новая тренировка</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createCalendarEvent} className="grid gap-4">
          <input type="hidden" name="type" value="client_training" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_id">Клиент</Label>
              <Select id="client_id" name="client_id" required defaultValue="">
                <option value="" disabled>
                  Выберите клиента
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.preferred_name || client.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input id="title" name="title" placeholder="По умолчанию имя клиента" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Дата</Label>
              <DatePickerInput id="date" name="date" mode="started_at" defaultToToday />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="starts_at_time">Начало</Label>
                <Input id="starts_at_time" name="starts_at_time" type="time" required defaultValue="10:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_hours">Часы</Label>
                <Select id="duration_hours" name="duration_hours" defaultValue="1">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Заметки</Label>
            <Textarea id="notes" name="notes" />
          </div>
          <div className="flex justify-end">
            <SubmitButton disabled={clients.length === 0}>Создать событие</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
