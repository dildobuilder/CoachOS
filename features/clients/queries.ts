import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export type ClientRow = Tables<"clients">;

export async function getClients({
  includeArchived = false
}: { includeArchived?: boolean } = {}): Promise<ClientRow[]> {
  const supabase = createClient();
  let query = supabase.from("clients").select("*").order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getClientById(clientId: string): Promise<ClientRow> {
  const supabase = createClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  return data;
}
