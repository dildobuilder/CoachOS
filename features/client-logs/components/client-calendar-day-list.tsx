import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StartWorkoutButton } from "@/features/calendar/components/start-workout-button";
import type { ClientCalendarDay } from "@/features/client-logs/queries";

type ClientCalendarDayListProps = {
  clientId: string;
  startDate: string;
  days: ClientCalendarDay[];
};

export function ClientCalendarDayList({ clientId, startDate, days }: ClientCalendarDayListProps) {
  return (
    <div className="grid gap-3">
      {days.map((day) => (
        <Card key={day.date}>
          <CardContent className="grid gap-4 p-4 lg:grid-cols-[180px_1fr_1fr_auto] lg:items-start">
            <div>
              <div className="font-semibold">{formatDate(day.date)}</div>
              <div className="text-xs text-muted-foreground">{formatWeekday(day.date)}</div>
            </div>

            <div className="space-y-2">
              <SectionLabel>Тренировки</SectionLabel>
              {day.events.length > 0 ? (
                <div className="grid gap-2">
                  {day.events.map((event) => (
                    <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background p-2">
                      <div>
                        <div className="font-medium">{event.title || "Тренировка"}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(event.starts_at)} - {formatTime(event.ends_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{statusLabel(event.status)}</Badge>
                        {event.type === "client_training" && event.status !== "completed" ? (
                          <StartWorkoutButton eventId={event.id} status={event.status} compact compactSize="sm" />
                        ) : event.existing_session_id ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/sessions/${event.existing_session_id}`}>Открыть</Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Тренировок нет.</p>
              )}
              {day.plannedWorkouts.length > 0 ? (
                <div className="grid gap-2">
                  {day.plannedWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed bg-secondary/30 p-2"
                    >
                      <div>
                        <div className="font-medium">{workout.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {workout.training_plans?.name ?? "План"} · без времени
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">План</Badge>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/clients/${clientId}/planned-workouts/${workout.id}`}>Открыть план</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <SectionLabel>Дневник</SectionLabel>
              <div className="grid gap-1 text-sm">
                <div>Вес: {day.log?.body_weight ? `${day.log.body_weight} кг` : "нет данных"}</div>
                <div>
                  КБЖУ: {formatMacros(day.log)}
                </div>
                {day.log?.notes ? (
                  <div className="line-clamp-2 text-muted-foreground">Заметка: {day.log.notes}</div>
                ) : (
                  <div className="text-muted-foreground">Заметки нет.</div>
                )}
              </div>
            </div>

            <Button asChild variant={day.log ? "outline" : "default"} size="sm">
              <Link href={`/clients/${clientId}/calendar?start=${startDate}&log_date=${day.date}`}>
                {day.log ? "Редактировать" : "Заполнить"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-xs font-medium uppercase text-muted-foreground">{children}</div>;
}

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long"
  }).format(parseDate(dateValue));
}

function formatWeekday(dateValue: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    year: "numeric"
  }).format(parseDate(dateValue));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatMacros(log: ClientCalendarDay["log"]) {
  if (!log || (!log.calories && !log.protein && !log.fat && !log.carbs)) {
    return "нет данных";
  }

  return `${log.calories ?? "-"} ккал / Б ${log.protein ?? "-"} / Ж ${log.fat ?? "-"} / У ${log.carbs ?? "-"}`;
}

function statusLabel(status: string) {
  if (status === "started") {
    return "Идет";
  }

  if (status === "completed") {
    return "Завершено";
  }

  return "Запланировано";
}

function parseDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);

  return new Date(year, month - 1, day);
}
