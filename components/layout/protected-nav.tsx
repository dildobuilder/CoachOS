import Link from "next/link";
import { CalendarDays, Dumbbell, LayoutDashboard, Users } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Сегодня", icon: LayoutDashboard },
  { href: "/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/clients", label: "Клиенты", icon: Users }
];

export function ProtectedNav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Dumbbell className="h-5 w-5 text-primary" />
          CoachOS
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost">
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <form action={signOut}>
          <Button variant="outline" size="sm">
            Выйти
          </Button>
        </form>
      </div>
    </header>
  );
}
