import { PageHeader } from "@/components/layout/page-header";
import { ClientCalendarDayList } from "@/features/client-logs/components/client-calendar-day-list";
import { ClientCalendarToolbar } from "@/features/client-logs/components/client-calendar-toolbar";
import { ClientWeightSummary } from "@/features/client-logs/components/client-weight-summary";
import { getClientCalendarData, getLatestClientWeight } from "@/features/client-logs/queries";
import { ClientProfileNav } from "@/features/clients/components/client-profile-nav";
import { getClientById } from "@/features/clients/queries";

type ClientCalendarPageProps = {
  params: {
    clientId: string;
  };
  searchParams: {
    start?: string;
    error?: string;
  };
};

export default async function ClientCalendarPage({ params, searchParams }: ClientCalendarPageProps) {
  const [client, calendarData, currentWeight] = await Promise.all([
    getClientById(params.clientId),
    getClientCalendarData(params.clientId, { startDate: searchParams.start }),
    getLatestClientWeight(params.clientId)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Календарь клиента" description={client.preferred_name || client.name} />
      <ClientProfileNav clientId={client.id} active="calendar" />
      {searchParams.error ? (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {searchParams.error}
        </div>
      ) : null}

      <ClientWeightSummary
        clientId={client.id}
        startingWeight={client.starting_weight}
        currentWeight={currentWeight}
        returnToPath={`/clients/${client.id}/calendar?start=${calendarData.startDate}`}
      />

      <ClientCalendarToolbar clientId={client.id} startDate={calendarData.startDate} timezone={calendarData.timezone} />
      <ClientCalendarDayList clientId={client.id} startDate={calendarData.startDate} days={calendarData.days} />
    </div>
  );
}
