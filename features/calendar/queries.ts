import { getTrainerProfile } from "@/features/trainer/queries";
import type { Tables } from "@/lib/database.types";
import { getReadableErrorMessage, retryResultOnTransientError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type CalendarEventRow = Tables<"calendar_events">;
export type CalendarEventWithClient = CalendarEventRow & {
  clients: Pick<Tables<"clients">, "id" | "name" | "preferred_name"> | null;
  existing_session_id: string | null;
};

export type CalendarEventsResult = {
  events: CalendarEventWithClient[];
  error: string | null;
};

export type CalendarWeekResult = CalendarEventsResult & {
  startDate: string;
  timezone: string;
};

export function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateValueInTimeZone(date: Date, timezone = "Europe/Moscow") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return formatDateValue(date);
  }

  return `${year}-${month}-${day}`;
}

export function addDays(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Invalid date value");
  }

  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));

  return formatDateValue(date);
}

export function startOfCalendarWeek(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Invalid date value");
  }

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayOfWeek = date.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  date.setUTCDate(date.getUTCDate() - daysSinceMonday);

  return formatDateValue(date);
}

export function getEventDateRange(dateValue: string, timezone = "Europe/Moscow", days = 1) {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Invalid date value");
  }

  const startsAt = zonedTimeToUtc(year, month, day, 0, 0, timezone);
  const endsAt = zonedTimeToUtc(year, month, day + days, 0, 0, timezone);

  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString()
  };
}

export async function getCalendarStartDate(dateValue?: string | null) {
  const profile = await getTrainerProfile();
  const timezone = profile?.timezone || "Europe/Moscow";

  return {
    startDate: isDateValue(dateValue) ? dateValue : formatDateValueInTimeZone(new Date(), timezone),
    timezone
  };
}

export async function getCalendarWeekStartDate(dateValue?: string | null) {
  const profile = await getTrainerProfile();
  const timezone = profile?.timezone || "Europe/Moscow";
  const selectedDate = isDateValue(dateValue) ? dateValue : formatDateValueInTimeZone(new Date(), timezone);

  return {
    startDate: dateValue ? selectedDate : startOfCalendarWeek(selectedDate),
    timezone
  };
}

export async function getEventsForWeekResult(dateValue?: string | null): Promise<CalendarWeekResult> {
  try {
    const { startDate, timezone } = await getCalendarWeekStartDate(dateValue);
    const range = getEventDateRange(startDate, timezone, 7);
    const eventsResult = await getEventsForRange(range.startsAt, range.endsAt);

    return {
      ...eventsResult,
      startDate,
      timezone
    };
  } catch (error) {
    return {
      events: [],
      error: getReadableErrorMessage(
        error,
        "Не удалось загрузить календарь. Обновите страницу или попробуйте позже."
      ),
      startDate: formatDateValue(new Date()),
      timezone: "Europe/Moscow"
    };
  }
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

    return getEventsForRange(range.startsAt, range.endsAt);
  } catch (error) {
    return {
      events: [],
      error: getReadableErrorMessage(
        error,
        "Не удалось загрузить события. Обновите страницу или попробуйте позже."
      )
    };
  }
}

export async function getTodayEvents() {
  const { startDate } = await getCalendarStartDate();

  return getEventsForDay(startDate);
}

export async function getTodayEventsResult() {
  const { startDate } = await getCalendarStartDate();

  return getEventsForDayResult(startDate);
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

  if (!data) {
    return null;
  }

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("calendar_event_id", eventId)
    .maybeSingle();

  return {
    ...(data as CalendarEventRow & {
      clients: Pick<Tables<"clients">, "id" | "name" | "preferred_name"> | null;
    }),
    existing_session_id: session?.id ?? null
  };
}

export async function getClientEventsForRange(
  clientId: string,
  startsAt: string,
  endsAt: string
): Promise<CalendarEventWithClient[]> {
  const result = await getEventsForRange(startsAt, endsAt, {
    clientId,
    excludeCancelled: true
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result.events;
}

async function getEventsForRange(
  startsAt: string,
  endsAt: string,
  options: { clientId?: string; excludeCancelled?: boolean } = {}
): Promise<CalendarEventsResult> {
  const supabase = createClient();
  const { data, error } = await retryResultOnTransientError(() => {
    let query = supabase
      .from("calendar_events")
      .select("*, clients(id, name, preferred_name)")
      .gte("starts_at", startsAt)
      .lt("starts_at", endsAt)
      .order("starts_at", { ascending: true });

    if (options.clientId) {
      query = query.eq("client_id", options.clientId);
    }

    if (options.excludeCancelled) {
      query = query.neq("status", "cancelled");
    }

    return query;
  });

  if (error) {
    return {
      events: [],
      error: getReadableErrorMessage(
        error,
        "Не удалось загрузить события. Обновите страницу или попробуйте позже."
      )
    };
  }

  const events = (data ?? []) as Array<
    CalendarEventRow & {
      clients: Pick<Tables<"clients">, "id" | "name" | "preferred_name"> | null;
    }
  >;
  const eventIds = events.map((event) => event.id);

  if (eventIds.length === 0) {
    return {
      events: [],
      error: null
    };
  }

  const { data: sessions, error: sessionsError } = await retryResultOnTransientError(() =>
    supabase
      .from("workout_sessions")
      .select("id, calendar_event_id")
      .in("calendar_event_id", eventIds)
  );

  return {
    events: events.map((event) => ({
      ...event,
      existing_session_id:
        sessions?.find((session) => session.calendar_event_id === event.id)?.id ?? null
    })),
    error: sessionsError
      ? getReadableErrorMessage(sessionsError, "Не удалось загрузить связанные тренировки.")
      : null
  };
}

function isDateValue(value?: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
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
