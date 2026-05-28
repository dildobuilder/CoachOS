import { addDays, getClientEventsForRange, getEventDateRange } from "@/features/calendar/queries";
import { getTrainerProfile } from "@/features/trainer/queries";
import type { CalendarEventWithClient } from "@/features/calendar/queries";
import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type ClientDailyLogRow = Tables<"client_daily_logs">;

export type ClientCalendarDay = {
  date: string;
  events: CalendarEventWithClient[];
  log: ClientDailyLogRow | null;
};

export type ClientCalendarData = {
  startDate: string;
  endDate: string;
  timezone: string;
  days: ClientCalendarDay[];
};

export async function getClientDailyLogs(
  clientId: string,
  range: { startDate: string; endDate: string }
): Promise<ClientDailyLogRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("client_daily_logs")
    .select("*")
    .eq("client_id", clientId)
    .gte("log_date", range.startDate)
    .lt("log_date", range.endDate)
    .order("log_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getClientDailyLogByDate(clientId: string, date: string): Promise<ClientDailyLogRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("client_daily_logs")
    .select("*")
    .eq("client_id", clientId)
    .eq("log_date", date)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getLatestClientWeight(clientId: string): Promise<number | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("client_daily_logs")
    .select("body_weight")
    .eq("client_id", clientId)
    .not("body_weight", "is", null)
    .order("log_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.body_weight ?? null;
}

export async function getClientCalendarData(
  clientId: string,
  options: { startDate?: string | null; days?: number } = {}
): Promise<ClientCalendarData> {
  const profile = await getTrainerProfile();
  const timezone = profile?.timezone || "Europe/Moscow";
  const startDate = isDateValue(options.startDate) ? options.startDate : getDateValueInTimezone(new Date(), timezone);
  const daysCount = options.days ?? 30;
  const endDate = addDays(startDate, daysCount);
  const dateRange = getEventDateRange(startDate, timezone, daysCount);
  const [events, logs] = await Promise.all([
    getClientEventsForRange(clientId, dateRange.startsAt, dateRange.endsAt),
    getClientDailyLogs(clientId, { startDate, endDate })
  ]);

  return {
    startDate,
    endDate,
    timezone,
    days: Array.from({ length: daysCount }, (_, index) => {
      const date = addDays(startDate, index);

      return {
        date,
        events: events.filter((event) => getDateValueInTimezone(new Date(event.starts_at), timezone) === date),
        log: logs.find((log) => log.log_date === date) ?? null
      };
    })
  };
}

function isDateValue(value?: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getDateValueInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}
