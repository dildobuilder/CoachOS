import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getTrainerProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = createClient();
  const { data } = await supabase.from("trainer_profiles").select("*").eq("id", user.id).maybeSingle();

  return data;
}
