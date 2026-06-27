"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CalendarToolbarProps = {
  startDate: string;
  timezone: string;
};

export function CalendarToolbar({ startDate, timezone }: CalendarToolbarProps) {
  const router = useRouter();
  const currentWeekStart = startOfCalendarWeek(formatDateValueInTimeZone(new Date(), timezone));

  function navigate(nextStartDate: string) {
    router.push(`/calendar?start=${nextStartDate}`);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => navigate(currentWeekStart)}>
          Эта неделя
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => navigate(addDays(startDate, -7))}>
          Предыдущая неделя
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => navigate(addDays(startDate, 7))}>
          Следующая неделя
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => navigate(startOfCalendarWeek(startDate))}>
          К началу недели
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Старт</span>
        <Input
          type="date"
          value={startDate}
          className="w-44"
          onChange={(event) => {
            if (event.target.value) {
              navigate(event.target.value);
            }
          }}
        />
      </div>
    </div>
  );
}

function addDays(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));

  return formatDateValue(date);
}

function startOfCalendarWeek(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayOfWeek = date.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  date.setUTCDate(date.getUTCDate() - daysSinceMonday);

  return formatDateValue(date);
}

function formatDateValue(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateValueInTimeZone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : formatDateValue(date);
}
