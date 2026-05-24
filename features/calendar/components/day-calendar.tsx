import { EmptyState } from "@/components/empty-states/empty-state";
import { EventCard } from "@/features/calendar/components/event-card";
import type { CalendarEventWithClient } from "@/features/calendar/queries";

type DayCalendarProps = {
  events: CalendarEventWithClient[];
};

export function DayCalendar({ events }: DayCalendarProps) {
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
