import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ensureTrainerProfile } from "@/features/trainer/actions";
import { getCurrentUser } from "@/features/trainer/queries";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await ensureTrainerProfile();

  return <AppShell>{children}</AppShell>;
}
