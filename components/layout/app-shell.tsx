import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ProtectedNav } from "@/components/layout/protected-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <ProtectedNav />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-8">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
