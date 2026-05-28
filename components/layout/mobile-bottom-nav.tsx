import Link from "next/link";
import { CalendarDays, LayoutDashboard, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Сегодня", icon: LayoutDashboard },
  { href: "/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/clients", label: "Клиенты", icon: Users }
];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:hidden">
      <div className="grid h-16 grid-cols-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
