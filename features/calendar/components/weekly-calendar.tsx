"use client";

import { useMemo, useState } from "react";
import { CalendarCell } from "@/features/calendar/components/calendar-cell";
import { EventCard } from "@/features/calendar/components/event-card";
import { EventDialog, type EventDraft } from "@/features/calendar/components/event-dialog";
import type { CalendarEventWithClient } from "@/features/calendar/queries";
import type { ClientRow } from "@/features/clients/queries";
import { cn } from "@/lib/utils";

type WeeklyCalendarProps = {
  events: CalendarEventWithClient[];
  clients: ClientRow[];
  startDate: string;
  timezone: string;
  error?: string | null;
};

const hours = Array.from({ length: 24 }, (_, hour) => hour);

export function WeeklyCalendar({ events, clients, startDate, timezone, error }: WeeklyCalendarProps) {
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventWithClient | null>(null);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(startDate, index)), [startDate]);
  const today = getDateValue(new Date().toISOString(), timezone);
  const placements = events
    .map((event) => getEventPlacement(event, days, timezone))
    .filter((placement): placement is EventPlacement => placement !== null);

  function closeDialog() {
    setDraft(null);
    setSelectedEvent(null);
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="relative overflow-x-auto rounded-lg border bg-card [--day-col:96px] [--header-row:40px] [--hour-row:52px] [--time-col:56px] sm:[--day-col:minmax(132px,1fr)] sm:[--header-row:44px] sm:[--hour-row:64px] sm:[--time-col:72px]">
        <div
          className="grid min-w-[728px] sm:min-w-[1040px]"
          style={{
            gridTemplateColumns: "var(--time-col) repeat(7, var(--day-col))",
            gridTemplateRows: "var(--header-row) repeat(24, var(--hour-row))"
          }}
        >
          <div className="sticky left-0 top-0 z-30 border-b border-r bg-card" />
          {days.map((day, index) => (
            <div
              key={day}
              className={cn(
                "sticky top-0 z-30 flex flex-col justify-center border-b border-r bg-card px-2 sm:px-3",
                day === today && "bg-emerald-50"
              )}
              style={{ gridColumn: index + 2, gridRow: 1 }}
            >
              <span className="text-xs font-semibold sm:text-sm">{formatWeekday(day)}</span>
              <span className="text-xs text-muted-foreground">{formatDay(day)}</span>
            </div>
          ))}

          {hours.map((hour) => (
            <div
              key={hour}
              className="sticky left-0 z-20 flex justify-end border-b border-r bg-card px-1.5 pt-1.5 text-xs text-muted-foreground sm:px-2 sm:pt-2"
              style={{ gridColumn: 1, gridRow: hour + 2 }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}

          {days.map((day, dayIndex) =>
            hours.map((hour) => (
              <div key={`${day}-${hour}`} style={{ gridColumn: dayIndex + 2, gridRow: hour + 2 }}>
                <CalendarCell
                  date={day}
                  hour={hour}
                  isToday={day === today}
                  onClick={(date, selectedHour) =>
                    setDraft({
                      date,
                      starts_at_time: `${String(selectedHour).padStart(2, "0")}:00`
                    })
                  }
                />
              </div>
            ))
          )}

          {placements.map(({ event, dayIndex, hour, duration }) => (
            <div
              key={event.id}
              className="z-10 p-0.5 sm:p-1"
              style={{
                gridColumn: dayIndex + 2,
                gridRow: `${hour + 2} / span ${duration}`
              }}
            >
              <EventCard event={event} compact onEdit={() => setSelectedEvent(event)} />
            </div>
          ))}
        </div>
      </div>

      {draft || selectedEvent ? (
        <EventDialog
          clients={clients}
          event={selectedEvent}
          draft={draft}
          startDate={startDate}
          timezone={timezone}
          onClose={closeDialog}
        />
      ) : null}
    </div>
  );
}

type EventPlacement = {
  event: CalendarEventWithClient;
  dayIndex: number;
  hour: number;
  duration: number;
};

function getEventPlacement(
  event: CalendarEventWithClient,
  days: string[],
  timezone: string
): EventPlacement | null {
  const day = getDateValue(event.starts_at, timezone);
  const dayIndex = days.indexOf(day);

  if (dayIndex === -1) {
    return null;
  }

  const hour = getHourValue(event.starts_at, timezone);
  const duration = Math.min(
    24 - hour,
    Math.max(
      1,
      Math.round((new Date(event.ends_at).getTime() - new Date(event.starts_at).getTime()) / 3_600_000)
    )
  );

  return {
    event,
    dayIndex,
    hour,
    duration
  };
}

function addDays(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));

  return formatDateValue(date);
}

function formatDateValue(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateValue(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(value));

  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

function getHourValue(value: string, timezone: string) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false
  }).format(new Date(value));

  return Number(hour);
}

function formatWeekday(dateValue: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "short"
  }).format(parseDateValue(dateValue));
}

function formatDay(dateValue: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short"
  }).format(parseDateValue(dateValue));
}

function parseDateValue(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);

  return new Date(year, month - 1, day);
}
