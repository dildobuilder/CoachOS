import { createClient } from "@/lib/supabase/server";
import { getTrainerProfile } from "@/features/trainer/queries";
import type { Tables } from "@/lib/database.types";
import { getReadableErrorMessage, retryResultOnTransientError } from "@/lib/errors";

export type CalendarEventRow = Tables<"calendar_events">;
export type CalendarEventWithClient = CalendarEventRow & {
  clients: Pick<Tables<"clients">, "id" | "name" | "preferred_name"> | null;
};

export type CalendarEventsResult = {
  events: CalendarEventWithClient[];
  error: string | null;
};

export function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getEventDateRange(dateValue: string, timezone = "Europe/Moscow") {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Invalid date value");
  }

  const startsAt = zonedTimeToUtc(year, month, day, 0, 0, timezone);
  const endsAt = zonedTimeToUtc(year, month, day + 1, 0, 0, timezone);

  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString()
  };
}

export async function getEventsForDay(dateValue = formatDateValue(new Date())): Promise<CalendarEventWithClient[]> {
  const result = await getEventsForDayResult(dateValue);

  if (result.error) {
    throw new Error(result.error);
  }

  return result.events;
}

export async function getEventsForDayResult(dateValue = formatDateValue(new Date())): Promise<CalendarEventsResult> {
  try {
    const profile = await getTrainerProfile();
    const timezone = profile?.timezone || "Europe/Moscow";
    const range = getEventDateRange(dateValue, timezone);
    const supabase = createClient();
    const { data, error } = await retryResultOnTransientError(() =>
      supabase
        .from("calendar_events")
        .select("*, clients(id, name, preferred_name)")
        .gte("starts_at", range.startsAt)
        .lt("starts_at", range.endsAt)
        .order("starts_at", { ascending: true })
    );

    if (error) {
      return {
        events: [],
        error: getReadableErrorMessage(error, "Не удалось загрузить события. Обновите страницу или попробуйте позже.")
      };
    }

    return {
      events: (data ?? []) as CalendarEventWithClient[],
      error: null
    };
  } catch (error) {
    return {
      events: [],
      error: getReadableErrorMessage(error, "Не удалось загрузить события. Обновите страницу или попробуйте позже.")
    };
  }
}

export async function getTodayEvents() {
  return getEventsForDay(formatDateValue(new Date()));
}

export async function getTodayEventsResult() {
  return getEventsForDayResult(formatDateValue(new Date()));
}

export async function getCalendarEventById(eventId: string): Promise<CalendarEventWithClient | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*, clients(id, name, preferred_name)")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CalendarEventWithClient | null;
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);

  return new Date(utcGuess.getTime() - offset);
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).formatToParts(date);

  const timeZoneName = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = timeZoneName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);

  if (!match) {
    return 0;
  }

  const direction = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");

  return direction * (hours * 60 + minutes) * 60 * 1000;
}
