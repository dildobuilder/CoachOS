"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { createClient } from "@/lib/supabase/server";
import { authSchema } from "@/features/auth/schemas";
import { ensureTrainerProfile } from "@/features/trainer/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getReadableErrorMessage, isTransientNetworkError, retryResultOnTransientError } from "@/lib/errors";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signInWithPassword(formData: FormData) {
  try {
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
    const { error } = await retryResultOnTransientError(() => supabase.auth.signInWithPassword(parsed.data));

    if (error) {
      redirect(`/login?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
    }

    await ensureTrainerProfile();
    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(`/login?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
  }
}

export async function signUpWithPassword(formData: FormData) {
  try {
    if (!hasSupabaseEnv()) {
      redirect("/register?setup=supabase");
    }

    const parsed = authSchema.safeParse({
      email: getString(formData, "email"),
      password: getString(formData, "password")
    });

    if (!parsed.success) {
      redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка регистрации")}`);
    }

    const supabase = createClient();
    const { data, error } = await retryResultOnTransientError(() => supabase.auth.signUp(parsed.data));

    if (error) {
      redirect(`/register?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
    }

    if (data.user) {
      await ensureTrainerProfile();
    }

    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(`/register?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
  }
}

export async function signOut() {
  try {
    if (!hasSupabaseEnv()) {
      redirect("/login?setup=supabase");
    }

    const supabase = createClient();
    const { error } = await retryResultOnTransientError(() => supabase.auth.signOut({ scope: "local" }));

    if (error && !isTransientNetworkError(error.message)) {
      redirect(`/login?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
    }

    redirect("/login");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(`/login?error=${encodeURIComponent(getReadableErrorMessage(error))}`);
  }
}
