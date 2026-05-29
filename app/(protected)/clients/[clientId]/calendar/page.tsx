import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ClientCalendarDayList } from "@/features/client-logs/components/client-calendar-day-list";
import { ClientCalendarToolbar } from "@/features/client-logs/components/client-calendar-toolbar";
import { ClientScheduleTrainingForm } from "@/features/client-logs/components/client-schedule-training-form";
import { ClientWeightSummary } from "@/features/client-logs/components/client-weight-summary";
import { DailyLogForm } from "@/features/client-logs/components/daily-log-form";
import { getClientCalendarData, getClientDailyLogByDate, getLatestClientWeight } from "@/features/client-logs/queries";
import { ClientProfileNav } from "@/features/clients/components/client-profile-nav";
import { getClientById } from "@/features/clients/queries";

type ClientCalendarPageProps = {
  params: {
    clientId: string;
  };
  searchParams: {
    start?: string;
    log_date?: string;
    error?: string;
  };
};

export default async function ClientCalendarPage({ params, searchParams }: ClientCalendarPageProps) {
  const [client, calendarData, currentWeight] = await Promise.all([
    getClientById(params.clientId),
    getClientCalendarData(params.clientId, { startDate: searchParams.start }),
    getLatestClientWeight(params.clientId)
  ]);
  const selectedDate = isDateValue(searchParams.log_date) ? searchParams.log_date : calendarData.startDate;
  const selectedLog = await getClientDailyLogByDate(params.clientId, selectedDate);

  return (
    <div className="space-y-6">
      <PageHeader title="Календарь клиента" description={client.preferred_name || client.name} />
      <ClientProfileNav clientId={client.id} active="calendar" />
      {searchParams.error ? (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {searchParams.error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/clients/${client.id}`}>Назад к клиенту</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/calendar">Общий календарь</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/clients/${client.id}/plans`}>Планы</Link>
        </Button>
      </div>

      <ClientWeightSummary
        clientId={client.id}
        startingWeight={client.starting_weight}
        currentWeight={currentWeight}
        returnToPath={`/clients/${client.id}/calendar?start=${calendarData.startDate}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ClientScheduleTrainingForm clientId={client.id} startDate={calendarData.startDate} />
        <DailyLogForm
          clientId={client.id}
          startDate={calendarData.startDate}
          selectedDate={selectedDate}
          log={selectedLog}
        />
      </div>

      <ClientCalendarToolbar clientId={client.id} startDate={calendarData.startDate} timezone={calendarData.timezone} />
      <ClientCalendarDayList clientId={client.id} startDate={calendarData.startDate} days={calendarData.days} />
    </div>
  );
}

function isDateValue(value?: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
