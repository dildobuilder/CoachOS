import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type TypedSupabaseClient = SupabaseClient<Database, "public">;

export function createClient(): TypedSupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createBrowserClient<Database, "public">(
    supabaseUrl,
    supabaseAnonKey
  ) as unknown as TypedSupabaseClient;
}
