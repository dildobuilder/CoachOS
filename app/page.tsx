import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function HomePage() {
  if (!hasSupabaseEnv()) {
    redirect("/login?setup=supabase");
  }

  redirect("/dashboard");
}
