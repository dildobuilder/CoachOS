"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/database.types";

export async function ensureTrainerProfile() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: existingProfile, error: profileError } = await supabase
    .from("trainer_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError && isMissingTrainerProfilesTableError(profileError.message)) {
    redirect("/login?setup=migrations");
  }

  if (profileError && isTransientRequestError(profileError.message)) {
    redirect(`/login?error=${encodeURIComponent("Сессия прервана. Войдите ещё раз.")}`);
  }

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (existingProfile) {
    return existingProfile;
  }

  const displayName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] ?? "Тренер";

  const profileInsert: TablesInsert<"trainer_profiles"> = {
    id: user.id,
    display_name: displayName,
    timezone: "Europe/Moscow",
    onboarding_status: "active"
  };

  const { data, error } = await supabase
    .from("trainer_profiles")
    .upsert(profileInsert, { onConflict: "id" })
    .select()
    .single();

  if (error && isMissingTrainerProfilesTableError(error.message)) {
    redirect("/login?setup=migrations");
  }

  if (error && isTransientRequestError(error.message)) {
    redirect(`/login?error=${encodeURIComponent("Сессия прервана. Войдите ещё раз.")}`);
  }

  if (error || !data) {
    throw new Error(error?.message ?? "Trainer profile was not created");
  }

  return data;
}

function isMissingTrainerProfilesTableError(message: string) {
  return (
    message.includes("trainer_profiles") &&
    (message.includes("schema cache") || message.includes("does not exist"))
  );
}

function isTransientRequestError(message: string) {
  return message.includes("terminated") || message.includes("fetch failed") || message.includes("aborted");
}
