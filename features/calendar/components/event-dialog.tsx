"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCalendarEvent, updateCalendarEvent } from "@/features/calendar/actions";
import { StartWorkoutButton } from "@/features/calendar/components/start-workout-button";
import type { CalendarEventType } from "@/features/calendar/schemas";
import type { CalendarEventWithClient } from "@/features/calendar/queries";
import type { ClientRow } from "@/features/clients/queries";

export type EventDraft = {
  date: string;
  starts_at_time: string;
};

type EventDialogProps = {
  clients: ClientRow[];
  event?: CalendarEventWithClient | null;
  draft?: EventDraft | null;
  startDate: string;
  timezone: string;
  returnToPath?: string;
  onClose: () => void;
};

const eventTypeLabels: Record<CalendarEventType, string> = {
  client_training: "Тренировка клиента",
  personal: "Личная тренировка",
  break: "Перерыв",
  other: "Другое"
};

export function EventDialog({
  clients,
  event,
  draft,
  startDate,
  timezone,
  returnToPath,
  onClose
}: EventDialogProps) {
  const initial = useMemo(() => getInitialValues({ event, draft, timezone }), [draft, event, timezone]);
  const [type, setType] = useState<CalendarEventType>(initial.type);
  const action = event ? updateCalendarEvent.bind(null, event.id) : createCalendarEvent;
  const title = event ? "Событие" : "Новое событие";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/20 px-3 py-2 sm:px-4 sm:py-6">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-lg border bg-background shadow-xl sm:max-h-[90dvh]">
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-2.5 sm:py-3">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">Заполните детали календаря тренера.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="return_to_start" value={startDate} />
          {returnToPath ? <input type="hidden" name="return_to_path" value={returnToPath} /> : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2.5 sm:py-3">
            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
              <div className="space-y-1">
                <Label htmlFor="type">Тип</Label>
                <Select
                  id="type"
                  name="type"
                  value={type}
                  onChange={(event) => setType(event.target.value as CalendarEventType)}
                >
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="duration_hours">Длительность</Label>
                <Select id="duration_hours" name="duration_hours" defaultValue={String(initial.duration_hours)}>
                  <option value="1">1 час</option>
                  <option value="2">2 часа</option>
                  <option value="3">3 часа</option>
                  <option value="4">4 часа</option>
                </Select>
              </div>

              {type === "client_training" ? (
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="client_id">Клиент</Label>
                  <Select id="client_id" name="client_id" required defaultValue={initial.client_id}>
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
              ) : null}

              <div className="space-y-1">
                <Label htmlFor="date">Дата</Label>
                <Input id="date" name="date" type="date" required defaultValue={initial.date} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="starts_at_time">Начало</Label>
                <Select id="starts_at_time" name="starts_at_time" defaultValue={initial.starts_at_time}>
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

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="title">Название</Label>
                <Input id="title" name="title" defaultValue={initial.title} placeholder="Можно оставить пустым" />
              </div>

              {event ? (
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="status">Статус</Label>
                  <Select id="status" name="status" defaultValue={event.status}>
                    <option value="scheduled">Запланировано</option>
                    <option value="started">Идет</option>
                    <option value="completed">Завершено</option>
                    <option value="cancelled">Отменено</option>
                  </Select>
                </div>
              ) : null}
            </div>

            {!event ? <input type="hidden" name="status" value="scheduled" /> : null}

            <div className="mt-2.5 space-y-1 sm:mt-3 sm:space-y-1">
              <Label htmlFor="notes">Заметки</Label>
              <Textarea id="notes" name="notes" defaultValue={initial.notes} className="min-h-16 sm:min-h-20" />
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2.5 border-t bg-background px-4 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-3">
            <div>
              {event?.type === "client_training" && event.status === "scheduled" ? (
                <StartWorkoutButton eventId={event.id} status={event.status} labelOverride="Начать" />
              ) : null}
              {event?.type === "client_training" && event.status === "started" ? (
                <StartWorkoutButton eventId={event.id} status={event.status} labelOverride="Продолжить" />
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <SubmitButton disabled={type === "client_training" && clients.length === 0}>
                {event ? "Сохранить" : "Создать событие"}
              </SubmitButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function getInitialValues({
  event,
  draft,
  timezone
}: {
  event?: CalendarEventWithClient | null;
  draft?: EventDraft | null;
  timezone: string;
}) {
  if (!event) {
    return {
      type: "client_training" as CalendarEventType,
      client_id: "",
      date: draft?.date ?? "",
      starts_at_time: draft?.starts_at_time ?? "10:00",
      duration_hours: 1,
      title: "",
      notes: ""
    };
  }

  return {
    type: event.type as CalendarEventType,
    client_id: event.client_id ?? "",
    date: getDateValue(event.starts_at, timezone),
    starts_at_time: `${String(getHourValue(event.starts_at, timezone)).padStart(2, "0")}:00`,
    duration_hours: getDurationHours(event.starts_at, event.ends_at),
    title: event.title,
    notes: event.notes ?? ""
  };
}

function getDurationHours(startsAt: string, endsAt: string) {
  const duration = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 3_600_000);

  return Math.min(4, Math.max(1, duration));
}

function getDateValue(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(value));

  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

function getHourValue(value: string, timezone: string) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false
  }).format(new Date(value));

  return Number(hour);
}
