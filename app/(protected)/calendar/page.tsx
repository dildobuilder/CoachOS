import { FormError } from "@/components/feedback/form-error";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarToolbar } from "@/features/calendar/components/calendar-toolbar";
import { WeeklyCalendar } from "@/features/calendar/components/weekly-calendar";
import { getEventsForWeekResult } from "@/features/calendar/queries";
import { getClients } from "@/features/clients/queries";

type CalendarPageProps = {
  searchParams?: {
    start?: string;
    error?: string;
  };
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const [eventsResult, clients] = await Promise.all([
    getEventsForWeekResult(searchParams?.start),
    getClients()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Календарь"
        description="Недельная сетка тренера: планируйте события, проверяйте занятость и запускайте тренировки."
      />
      <FormError message={searchParams?.error} />
      <CalendarToolbar startDate={eventsResult.startDate} timezone={eventsResult.timezone} />
      <WeeklyCalendar
        events={eventsResult.events}
        clients={clients}
        startDate={eventsResult.startDate}
        timezone={eventsResult.timezone}
        error={eventsResult.error}
      />
    </div>
  );
}
