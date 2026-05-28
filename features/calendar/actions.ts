"use server";

import { isRedirectError } from "next/dist/client/components/redirect";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calendarEventSchema, updateCalendarEventSchema } from "@/features/calendar/schemas";
import { getTrainerProfile } from "@/features/trainer/queries";
import type { TablesInsert, TablesUpdate } from "@/lib/database.types";
import { getReadableErrorMessage, isTransientNetworkError } from "@/lib/errors";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

const conflictMessage = "На это время уже запланировано событие. Выберите другое время.";

function formDataToObject(formData: FormData) {
  return {
    type: formData.get("type"),
    client_id: formData.get("client_id"),
    date: formData.get("date"),
    starts_at_time: formData.get("starts_at_time"),
    duration_hours: formData.get("duration_hours"),
    title: formData.get("title"),
    notes: formData.get("notes"),
    status: formData.get("status"),
    return_to_start: formData.get("return_to_start"),
    return_to_path: formData.get("return_to_path")
  };
}

async function getUserId(errorPath = "/calendar") {
  const supabase = createSupabaseClient();
  let response;

  try {
    response = await supabase.auth.getUser();
  } catch (error) {
    redirect(`${errorPath}?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
  }

  const {
    data: { user },
    error
  } = response;

  if (error && isTransientNetworkError(error.message)) {
    redirect(`${errorPath}?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
  }

  if (error || !user) {
    redirect("/login");
  }

  return user.id;
}

export async function createCalendarEvent(formData: FormData) {
  try {
    const parsed = calendarEventSchema.safeParse(formDataToObject(formData));

    if (!parsed.success) {
      redirect(calendarErrorPath(undefined, parsed.error.issues[0]?.message ?? "Ошибка"));
    }

    const trainerId = await getUserId();
    const profile = await getTrainerProfile();
    const timezone = profile?.timezone || "Europe/Moscow";
    const supabase = createSupabaseClient();
    const client = await getClientForEvent(parsed.data.type, parsed.data.client_id, parsed.data.title);
    const startsAt = formDateTimeToUtc(parsed.data.date, parsed.data.starts_at_time, timezone);
    const endsAt = new Date(startsAt.getTime() + parsed.data.duration_hours * 60 * 60 * 1000);

    if (endsAt <= startsAt) {
      redirect(calendarErrorPath(parsed.data.date, "Время окончания должно быть позже начала", parsed.data.return_to_path));
    }

    const hasConflict = await hasCalendarConflict({
      trainerId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString()
    });

    if (hasConflict) {
      redirect(calendarErrorPath(parsed.data.date, conflictMessage, parsed.data.return_to_path));
    }

    const eventInsert: TablesInsert<"calendar_events"> = {
      trainer_id: trainerId,
      client_id: client?.id ?? null,
      type: parsed.data.type,
      title: getEventTitle(parsed.data.type, parsed.data.title, client),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      notes: parsed.data.notes
    };

    const { error } = await supabase.from("calendar_events").insert(eventInsert);

    if (error) {
      redirect(calendarErrorPath(parsed.data.date, getReadableErrorMessage(error), parsed.data.return_to_path));
    }

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    redirect(successRedirectPath(parsed.data.return_to_start || parsed.data.date, parsed.data.return_to_path));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(calendarErrorPath(undefined, getReadableErrorMessage(error)));
  }
}

export async function updateCalendarEvent(eventId: string, formData: FormData) {
  try {
    const parsed = updateCalendarEventSchema.safeParse(formDataToObject(formData));

    if (!parsed.success) {
      redirect(calendarErrorPath(undefined, parsed.error.issues[0]?.message ?? "Ошибка"));
    }

    const trainerId = await getUserId();
    const profile = await getTrainerProfile();
    const timezone = profile?.timezone || "Europe/Moscow";
    const client = await getClientForEvent(parsed.data.type, parsed.data.client_id, parsed.data.title);
    const startsAt = formDateTimeToUtc(parsed.data.date, parsed.data.starts_at_time, timezone);
    const endsAt = new Date(startsAt.getTime() + parsed.data.duration_hours * 60 * 60 * 1000);

    if (endsAt <= startsAt) {
      redirect(calendarErrorPath(parsed.data.date, "Время окончания должно быть позже начала", parsed.data.return_to_path));
    }

    const hasConflict = await hasCalendarConflict({
      trainerId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      excludeEventId: eventId
    });

    if (hasConflict) {
      redirect(calendarErrorPath(parsed.data.date, conflictMessage, parsed.data.return_to_path));
    }

    const eventUpdate: TablesUpdate<"calendar_events"> = {
      client_id: client?.id ?? null,
      type: parsed.data.type,
      title: getEventTitle(parsed.data.type, parsed.data.title, client),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: parsed.data.status,
      notes: parsed.data.notes
    };
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("calendar_events").update(eventUpdate).eq("id", eventId);

    if (error) {
      redirect(calendarErrorPath(parsed.data.date, getReadableErrorMessage(error), parsed.data.return_to_path));
    }

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    redirect(successRedirectPath(parsed.data.return_to_start || parsed.data.date, parsed.data.return_to_path));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(calendarErrorPath(undefined, getReadableErrorMessage(error)));
  }
}

export async function cancelCalendarEvent(eventId: string) {
  try {
    await getUserId();
    const supabase = createSupabaseClient();
    const eventUpdate: TablesUpdate<"calendar_events"> = { status: "cancelled" };
    const { error } = await supabase.from("calendar_events").update(eventUpdate).eq("id", eventId);

    if (error) {
      redirect(calendarErrorPath(undefined, getReadableErrorMessage(error)));
    }

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(calendarErrorPath(undefined, getReadableErrorMessage(error)));
  }
}

export async function startWorkoutFromEvent(eventId: string) {
  try {
    const trainerId = await getUserId();
    const supabase = createSupabaseClient();
    const { data: event, error: eventError } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      redirect(calendarErrorPath(undefined, eventError?.message ?? "Событие не найдено"));
    }

    if (event.type !== "client_training" || !event.client_id) {
      redirect(calendarErrorPath(undefined, "Для события нельзя начать тренировку"));
    }

    const { data: existingSession, error: existingError } = await supabase
      .from("workout_sessions")
      .select("id, status")
      .eq("calendar_event_id", event.id)
      .maybeSingle();

    if (existingError) {
      redirect(calendarErrorPath(undefined, existingError.message));
    }

    if (existingSession && ["started", "completed"].includes(existingSession.status)) {
      redirect(`/sessions/${existingSession.id}`);
    }

    const sessionInsert: TablesInsert<"workout_sessions"> = {
      trainer_id: trainerId,
      client_id: event.client_id,
      calendar_event_id: event.id,
      status: "started"
    };
    const { data: session, error: sessionError } = await supabase
      .from("workout_sessions")
      .insert(sessionInsert)
      .select("id")
      .single();

    if (sessionError) {
      const { data: duplicateSession } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("calendar_event_id", event.id)
        .maybeSingle();

      if (duplicateSession) {
        redirect(`/sessions/${duplicateSession.id}`);
      }

      redirect(calendarErrorPath(undefined, sessionError.message));
    }

    const eventUpdate: TablesUpdate<"calendar_events"> = { status: "started" };
    await supabase.from("calendar_events").update(eventUpdate).eq("id", event.id);

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    redirect(`/sessions/${session.id}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(calendarErrorPath(undefined, getReadableErrorMessage(error)));
  }
}

async function getClientForEvent(
  type: TablesInsert<"calendar_events">["type"],
  clientId: string | null | undefined,
  title: string | null | undefined
) {
  if (type !== "client_training") {
    return null;
  }

  if (!clientId) {
    redirect(calendarErrorPath(undefined, "Выберите клиента"));
  }

  const supabase = createSupabaseClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name, preferred_name")
    .eq("id", clientId)
    .neq("status", "archived")
    .maybeSingle();

  if (error || !client) {
    redirect(calendarErrorPath(undefined, error?.message ?? "Клиент не найден"));
  }

  return title ? { ...client, preferred_name: client.preferred_name } : client;
}

function getEventTitle(
  type: TablesInsert<"calendar_events">["type"],
  title: string | null | undefined,
  _client: { name: string; preferred_name: string | null } | null
) {
  if (title) {
    return title;
  }

  if (type === "client_training") {
    return "";
  }

  if (type === "personal") {
    return "Личная тренировка";
  }

  if (type === "break") {
    return "Перерыв";
  }

  return "Событие";
}

async function hasCalendarConflict({
  trainerId,
  startsAt,
  endsAt,
  excludeEventId
}: {
  trainerId: string;
  startsAt: string;
  endsAt: string;
  excludeEventId?: string;
}) {
  const supabase = createSupabaseClient();
  let query = supabase
    .from("calendar_events")
    .select("id")
    .eq("trainer_id", trainerId)
    .neq("status", "cancelled")
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt)
    .limit(1);

  if (excludeEventId) {
    query = query.neq("id", excludeEventId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

function successRedirectPath(startDate: string, returnToPath?: string | null) {
  if (returnToPath === "/dashboard") {
    return "/dashboard";
  }

  if (returnToPath?.startsWith("/clients/")) {
    return appendQuery(returnToPath, "start", startDate);
  }

  return `/calendar?start=${startDate}`;
}

function calendarErrorPath(startDate: string | undefined, message: string, returnToPath?: string | null) {
  if (returnToPath === "/dashboard") {
    return `/dashboard?error=${encodeURIComponent(message)}`;
  }

  if (returnToPath?.startsWith("/clients/")) {
    const path = startDate ? appendQuery(returnToPath, "start", startDate) : returnToPath;

    return appendQuery(path, "error", message);
  }

  const params = new URLSearchParams();

  if (startDate) {
    params.set("start", startDate);
  }

  params.set("error", message);

  return `/calendar?${params.toString()}`;
}

function appendQuery(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

function formDateTimeToUtc(dateValue: string, timeValue: string, timezone: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);

  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error("Invalid event date");
  }

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = getTimeZoneOffsetMs(utcGuess, timezone);

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
