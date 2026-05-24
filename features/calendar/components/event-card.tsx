import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StartWorkoutButton } from "@/features/calendar/components/start-workout-button";
import type { CalendarEventWithClient } from "@/features/calendar/queries";

const statusLabels = {
  scheduled: "Запланировано",
  started: "Идет",
  completed: "Завершено",
  cancelled: "Отменено"
};

const statusVariants = {
  scheduled: "secondary",
  started: "default",
  completed: "outline",
  cancelled: "destructive"
} as const;

export function EventCard({ event }: { event: CalendarEventWithClient }) {
  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);
  const clientName = event.clients?.preferred_name || event.clients?.name;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{event.title}</p>
            <Badge variant={statusVariants[event.status]}>{statusLabels[event.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatTime(startsAt)} - {formatTime(endsAt)}
            {clientName ? ` · ${clientName}` : ""}
          </p>
          {event.notes ? <p className="text-sm text-muted-foreground">{event.notes}</p> : null}
        </div>
        {event.type === "client_training" ? (
          <StartWorkoutButton eventId={event.id} status={event.status} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
