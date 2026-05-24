import { EmptyState } from "@/components/empty-states/empty-state";
import { EventCard } from "@/features/calendar/components/event-card";
import type { CalendarEventWithClient } from "@/features/calendar/queries";

type DayCalendarProps = {
  events: CalendarEventWithClient[];
  error?: string | null;
};

export function DayCalendar({ events, error }: DayCalendarProps) {
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
        title="На этот день нет событий"
        description="Создайте тренировку клиента, чтобы запустить первую сессию из календаря."
      />
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
