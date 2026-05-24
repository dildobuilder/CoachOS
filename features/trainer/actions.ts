"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/database.types";
import { isTransientNetworkError, retryResultOnTransientError } from "@/lib/errors";

export async function ensureTrainerProfile() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await retryResultOnTransientError(() => supabase.auth.getUser());

  if (userError || !user) {
    return null;
  }

  const { data: existingProfile, error: profileError } = await retryResultOnTransientError(() =>
    supabase
      .from("trainer_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
  );

  if (profileError && isMissingTrainerProfilesTableError(profileError.message)) {
    redirect("/login?setup=migrations");
  }

  if (profileError && isTransientNetworkError(profileError.message)) {
    return null;
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

  const { data, error } = await retryResultOnTransientError(() =>
    supabase
      .from("trainer_profiles")
      .upsert(profileInsert, { onConflict: "id" })
      .select()
      .single()
  );

  if (error && isMissingTrainerProfilesTableError(error.message)) {
    redirect("/login?setup=migrations");
  }

  if (error && isTransientNetworkError(error.message)) {
    return null;
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
