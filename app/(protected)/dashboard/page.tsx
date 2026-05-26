import Link from "next/link";
import { FormError } from "@/components/feedback/form-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TodayEventsList } from "@/features/calendar/components/today-events-list";
import { getCalendarStartDate, getEventsForDayResult } from "@/features/calendar/queries";
import { getClients } from "@/features/clients/queries";

type DashboardPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { startDate, timezone } = await getCalendarStartDate();
  const [clients, eventsResult] = await Promise.all([getClients(), getEventsForDayResult(startDate)]);
  const today = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(new Date());

  return (
    <div className="space-y-6">
      <PageHeader title="Сегодня" description={`${today}. События и клиентская база тренера.`} />
      <FormError message={searchParams?.error} />
      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Клиенты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold">{clients.length}</p>
            <p className="text-sm text-muted-foreground">
              Активные и поставленные на паузу клиенты. Архивные скрыты из списка.
            </p>
            <Button asChild>
              <Link href="/clients">Открыть клиентов</Link>
            </Button>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">События сегодня</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/calendar">Календарь</Link>
            </Button>
          </div>
          <TodayEventsList
            events={eventsResult.events}
            error={eventsResult.error}
            clients={clients}
            startDate={startDate}
            timezone={timezone}
          />
        </div>
      </div>
    </div>
  );
}
