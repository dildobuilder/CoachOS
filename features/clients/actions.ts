"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { clientSchema } from "@/features/clients/schemas";
import type { TablesInsert, TablesUpdate } from "@/lib/database.types";

function formDataToObject(formData: FormData) {
  return {
    name: formData.get("name"),
    preferred_name: formData.get("preferred_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    birth_date: formData.get("birth_date"),
    sex: formData.get("sex"),
    goal: formData.get("goal"),
    level: formData.get("level"),
    limitations: formData.get("limitations"),
    injuries: formData.get("injuries"),
    notes: formData.get("notes"),
    training_frequency: formData.get("training_frequency"),
    training_split: formData.get("training_split"),
    status: formData.get("status") || "active",
    started_at: formData.get("started_at")
  };
}

async function getUserId() {
  const supabase = createSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user.id;
}

export async function createClient(formData: FormData) {
  const parsed = clientSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(`/clients/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`);
  }

  const trainerId = await getUserId();
  const supabase = createSupabaseClient();
  const clientInsert: TablesInsert<"clients"> = {
    ...parsed.data,
    trainer_id: trainerId
  };

  const { data, error } = await supabase
    .from("clients")
    .insert(clientInsert)
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/clients/new?error=${encodeURIComponent(error?.message ?? "Client was not created")}`);
  }

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClient(clientId: string, formData: FormData) {
  const parsed = clientSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(
      `/clients/${clientId}/edit?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ошибка")}`
    );
  }

  await getUserId();
  const supabase = createSupabaseClient();
  const clientUpdate: TablesUpdate<"clients"> = parsed.data;
  const { error } = await supabase.from("clients").update(clientUpdate).eq("id", clientId);

  if (error) {
    redirect(`/clients/${clientId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function archiveClient(clientId: string) {
  await getUserId();
  const supabase = createSupabaseClient();
  const clientUpdate: TablesUpdate<"clients"> = { status: "archived" };
  const { error } = await supabase.from("clients").update(clientUpdate).eq("id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clients");
  redirect("/clients");
}

export async function restoreClient(clientId: string) {
  await getUserId();
  const supabase = createSupabaseClient();
  const clientUpdate: TablesUpdate<"clients"> = { status: "active" };
  const { error } = await supabase.from("clients").update(clientUpdate).eq("id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}
