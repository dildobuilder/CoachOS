"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authSchema } from "@/features/auth/schemas";
import { ensureTrainerProfile } from "@/features/trainer/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signInWithPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/login?setup=supabase");
  }

  const parsed = authSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password")
  });

  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка входа")}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  await ensureTrainerProfile();
  redirect("/dashboard");
}

export async function signUpWithPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/register?setup=supabase");
  }

  const parsed = authSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password")
  });

  if (!parsed.success) {
    redirect(
      `/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка регистрации")}`
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await ensureTrainerProfile();
  }

  redirect("/dashboard");
}

export async function signOut() {
  if (!hasSupabaseEnv()) {
    redirect("/login?setup=supabase");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login");
}
