import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ensureTrainerProfile } from "@/features/trainer/actions";
import { getCurrentUser } from "@/features/trainer/queries";
import { isEmailAllowed, privatePreviewAccessDeniedMessage } from "@/lib/auth/private-preview";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isEmailAllowed(user.email)) {
    redirect(`/login?error=${encodeURIComponent(privatePreviewAccessDeniedMessage)}`);
  }

  await ensureTrainerProfile();

  return <AppShell>{children}</AppShell>;
}
