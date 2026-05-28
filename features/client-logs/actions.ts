"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clientDailyLogSchema, clientStartingWeightSchema } from "@/features/client-logs/schemas";
import type { TablesInsert, TablesUpdate } from "@/lib/database.types";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

function dailyLogFormDataToObject(formData: FormData) {
  return {
    log_date: formData.get("log_date"),
    body_weight: formData.get("body_weight"),
    calories: formData.get("calories"),
    protein: formData.get("protein"),
    fat: formData.get("fat"),
    carbs: formData.get("carbs"),
    notes: formData.get("notes"),
    return_to_start: formData.get("return_to_start")
  };
}

function startingWeightFormDataToObject(formData: FormData) {
  return {
    starting_weight: formData.get("starting_weight"),
    return_to_path: formData.get("return_to_path")
  };
}

async function getUserId() {
  const supabase = createSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user.id;
}

export async function upsertClientDailyLog(clientId: string, formData: FormData) {
  const parsed = clientDailyLogSchema.safeParse(dailyLogFormDataToObject(formData));
  const startDate = String(formData.get("return_to_start") || "");
  const redirectPath = clientCalendarPath(clientId, startDate);

  if (!parsed.success) {
    redirect(`${redirectPath}&error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
  }

  const trainerId = await getUserId();
  const supabase = createSupabaseClient();
  const logInsert: TablesInsert<"client_daily_logs"> = {
    trainer_id: trainerId,
    client_id: clientId,
    log_date: parsed.data.log_date,
    body_weight: parsed.data.body_weight ?? null,
    calories: parsed.data.calories ?? null,
    protein: parsed.data.protein ?? null,
    fat: parsed.data.fat ?? null,
    carbs: parsed.data.carbs ?? null,
    notes: parsed.data.notes ?? null
  };
  const { error } = await supabase
    .from("client_daily_logs")
    .upsert(logInsert, { onConflict: "client_id,log_date" });

  if (error) {
    redirect(`${redirectPath}&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/calendar`);
  redirect(`${redirectPath}&log_date=${parsed.data.log_date}`);
}

export async function updateClientStartingWeight(clientId: string, formData: FormData) {
  const parsed = clientStartingWeightSchema.safeParse(startingWeightFormDataToObject(formData));
  const returnToPath = parsed.success ? parsed.data.return_to_path || `/clients/${clientId}` : `/clients/${clientId}`;

  if (!parsed.success) {
    redirect(appendQuery(returnToPath, "error", parsed.error.issues[0]?.message ?? "Ошибка"));
  }

  await getUserId();
  const supabase = createSupabaseClient();
  const clientUpdate: TablesUpdate<"clients"> = {
    starting_weight: parsed.data.starting_weight ?? null
  };
  const { error } = await supabase.from("clients").update(clientUpdate).eq("id", clientId);

  if (error) {
    redirect(appendQuery(returnToPath, "error", error.message));
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/calendar`);
  redirect(returnToPath);
}

function clientCalendarPath(clientId: string, startDate?: string | null) {
  const params = new URLSearchParams();

  if (startDate) {
    params.set("start", startDate);
  }

  return `/clients/${clientId}/calendar?${params.toString()}`;
}

function appendQuery(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}
