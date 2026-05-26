"use client";

import { useState } from "react";
import { EmptyState } from "@/components/empty-states/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventDialog } from "@/features/calendar/components/event-dialog";
import { StartWorkoutButton } from "@/features/calendar/components/start-workout-button";
import type { CalendarEventWithClient } from "@/features/calendar/queries";
import type { ClientRow } from "@/features/clients/queries";

type TodayEventsListProps = {
  events: CalendarEventWithClient[];
  clients: ClientRow[];
  startDate: string;
  timezone: string;
  error?: string | null;
};

export function TodayEventsList({
  events,
  clients,
  startDate,
  timezone,
  error
}: TodayEventsListProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventWithClient | null>(null);

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
    <>
      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-medium">
                  {event.type === "client_training" && event.clients
                    ? event.clients.preferred_name || event.clients.name
                    : event.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatTimeRange(event.starts_at, event.ends_at)}
                  {event.type === "client_training" && event.clients && event.title ? ` · ${event.title}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {event.type === "client_training" && event.status === "scheduled" ? (
                  <StartWorkoutButton eventId={event.id} status={event.status} compact compactSize="sm" />
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>
                  Открыть
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedEvent ? (
        <EventDialog
          clients={clients}
          event={selectedEvent}
          startDate={startDate}
          timezone={timezone}
          returnToPath="/dashboard"
          onClose={() => setSelectedEvent(null)}
        />
      ) : null}
    </>
  );
}

function formatTimeRange(startsAt: string, endsAt: string) {
  return `${formatTime(startsAt)} - ${formatTime(endsAt)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
