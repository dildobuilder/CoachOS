import Link from "next/link";
import { EmptyState } from "@/components/empty-states/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CalendarEventWithClient } from "@/features/calendar/queries";

type TodayEventsListProps = {
  events: CalendarEventWithClient[];
  error?: string | null;
};

export function TodayEventsList({ events, error }: TodayEventsListProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="Сегодня нет событий"
        description="Запланируйте тренировку в календаре, чтобы начать рабочий день."
        action={{ label: "Открыть календарь", href: "/calendar" }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Card key={event.id}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(event.starts_at)}
                {event.clients ? ` · ${event.clients.preferred_name || event.clients.name}` : ""}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/calendar">Открыть</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
