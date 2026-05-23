import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureTrainerProfile } from "@/features/trainer/actions";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
    await ensureTrainerProfile();
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
