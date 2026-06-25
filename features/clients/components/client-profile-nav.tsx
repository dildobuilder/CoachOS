import Link from "next/link";
import { Button } from "@/components/ui/button";

type ClientProfileNavProps = {
  clientId: string;
  active: "overview" | "calendar" | "plans" | "progress" | "history";
};

export function ClientProfileNav({ clientId, active }: ClientProfileNavProps) {
  const items = [
    { key: "overview", href: `/clients/${clientId}`, label: "Обзор" },
    { key: "calendar", href: `/clients/${clientId}/calendar`, label: "Календарь" },
    { key: "plans", href: `/clients/${clientId}/plans`, label: "Планы" },
    { key: "progress", href: `/clients/${clientId}/progress`, label: "Прогресс" },
    { key: "history", href: `/clients/${clientId}/history`, label: "История" }
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Button key={item.key} asChild variant={active === item.key ? "default" : "outline"} size="sm">
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </div>
  );
}
