import { FormError } from "@/components/feedback/form-error";
import { PageHeader } from "@/components/layout/page-header";
import { DayCalendar } from "@/features/calendar/components/day-calendar";
import { EventForm } from "@/features/calendar/components/event-form";
import { formatDateValue, getEventsForDayResult } from "@/features/calendar/queries";
import { getClients } from "@/features/clients/queries";

type CalendarPageProps = {
  searchParams?: {
    date?: string;
    error?: string;
  };
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const date = searchParams?.date || formatDateValue(new Date());
  const [eventsResult, clients] = await Promise.all([
    getEventsForDayResult(date),
    getClients()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Календарь"
        description="Простой день: создайте тренировку клиента и запустите сессию."
      />
      <FormError message={searchParams?.error} />
      <EventForm clients={clients} />
      <DayCalendar events={eventsResult.events} error={eventsResult.error} />
    </div>
  );
}
