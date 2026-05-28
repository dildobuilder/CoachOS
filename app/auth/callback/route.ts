import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureTrainerProfile } from "@/features/trainer/actions";
import { isEmailAllowed, privatePreviewAccessDeniedMessage } from "@/lib/auth/private-preview";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!isEmailAllowed(user?.email)) {
      await supabase.auth.signOut({ scope: "local" });
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("error", privatePreviewAccessDeniedMessage);
      return NextResponse.redirect(loginUrl);
    }

    await ensureTrainerProfile();
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
