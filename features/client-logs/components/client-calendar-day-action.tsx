"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCalendarEvent } from "@/features/calendar/actions";
import { upsertClientDailyLog } from "@/features/client-logs/actions";
import type { ClientCalendarDay } from "@/features/client-logs/queries";

type ClientCalendarDayActionProps = {
  clientId: string;
  startDate: string;
  dayDate: string;
  log: ClientCalendarDay["log"];
};

type ActivePanel = "schedule" | "log" | null;

export function ClientCalendarDayAction({ clientId, startDate, dayDate, log }: ClientCalendarDayActionProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  function openPanel(panel: ActivePanel) {
    setIsMenuOpen(false);
    setActivePanel(panel);
  }

  return (
    <div className="relative flex justify-end">
      <Button type="button" variant={log ? "outline" : "default"} size="sm" onClick={() => setIsMenuOpen((value) => !value)}>
        {log ? "Редактировать" : "Заполнить"}
      </Button>

      {isMenuOpen ? (
        <div className="absolute right-0 top-10 z-30 w-64 rounded-lg border bg-card p-2 shadow-lg">
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-secondary"
            onClick={() => openPanel("schedule")}
          >
            Запланировать тренировку
          </button>
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-secondary"
            onClick={() => openPanel("log")}
          >
            {log ? "Редактировать дневник" : "Заполнить дневник"}
          </button>
        </div>
      ) : null}

      {activePanel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-3 py-4 backdrop-blur-sm">
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto">
            {activePanel === "schedule" ? (
              <SchedulePanel clientId={clientId} startDate={startDate} selectedDate={dayDate} onClose={() => setActivePanel(null)} />
            ) : (
              <DailyLogPanel clientId={clientId} startDate={startDate} selectedDate={dayDate} log={log} onClose={() => setActivePanel(null)} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SchedulePanel({
  clientId,
  startDate,
  selectedDate,
  onClose
}: {
  clientId: string;
  startDate: string;
  selectedDate: string;
  onClose: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Запланировать тренировку</CardTitle>
        <Button type="button" variant="ghost" size="icon" aria-label="Закрыть" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form action={createCalendarEvent} className="grid gap-4">
          <input type="hidden" name="type" value="client_training" />
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="return_to_start" value={startDate} />
          <input type="hidden" name="return_to_path" value={`/clients/${clientId}/calendar`} />

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Дата" name="date" type="date" defaultValue={selectedDate} required />
            <div className="space-y-2">
              <Label htmlFor={`starts_at_time_${selectedDate}`}>Начало</Label>
              <Select id={`starts_at_time_${selectedDate}`} name="starts_at_time" defaultValue="10:00">
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
              <Label htmlFor={`duration_hours_${selectedDate}`}>Длительность</Label>
              <Select id={`duration_hours_${selectedDate}`} name="duration_hours" defaultValue="1">
                <option value="1">1 час</option>
                <option value="2">2 часа</option>
                <option value="3">3 часа</option>
                <option value="4">4 часа</option>
              </Select>
            </div>
          </div>

          <Field label="Название" name="title" placeholder="Можно оставить пустым" />
          <div className="space-y-2">
            <Label htmlFor={`schedule_notes_${selectedDate}`}>Заметки</Label>
            <Textarea id={`schedule_notes_${selectedDate}`} name="notes" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <SubmitButton>Создать событие</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DailyLogPanel({
  clientId,
  startDate,
  selectedDate,
  log,
  onClose
}: {
  clientId: string;
  startDate: string;
  selectedDate: string;
  log: ClientCalendarDay["log"];
  onClose: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{log ? "Редактировать дневник" : "Заполнить дневник"}</CardTitle>
        <Button type="button" variant="ghost" size="icon" aria-label="Закрыть" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
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
            <Label htmlFor={`daily_notes_${selectedDate}`}>Заметка</Label>
            <Textarea id={`daily_notes_${selectedDate}`} name="notes" defaultValue={log?.notes ?? ""} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
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
  placeholder,
  required
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
}) {
  const inputId = useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        name={name}
        type={type}
        min={type === "number" ? "0" : undefined}
        step={step}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
