import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDays } from "@/features/calendar/queries";

type ClientCalendarToolbarProps = {
  clientId: string;
  startDate: string;
  timezone: string;
};

export function ClientCalendarToolbar({ clientId, startDate, timezone }: ClientCalendarToolbarProps) {
  const today = formatDateValueInTimeZone(new Date(), timezone);
  const previousStart = addDays(startDate, -30);
  const nextStart = addDays(startDate, 30);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-semibold">Календарь клиента</h2>
        <p className="text-sm text-muted-foreground">30-дневный диапазон тренировок, веса и дневника.</p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/clients/${clientId}/calendar?start=${previousStart}`}>Предыдущие 30 дней</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/clients/${clientId}/calendar?start=${today}`}>Сегодня</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/clients/${clientId}/calendar?start=${nextStart}`}>Следующие 30 дней</Link>
        </Button>
        <form action={`/clients/${clientId}/calendar`} className="flex items-center gap-2">
          <Input name="start" type="date" defaultValue={startDate} className="h-9 w-40" />
          <Button type="submit" variant="outline" size="sm">
            Открыть
          </Button>
        </form>
      </div>
    </div>
  );
}

function formatDateValueInTimeZone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}
