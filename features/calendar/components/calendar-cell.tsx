"use client";

import { cn } from "@/lib/utils";

type CalendarCellProps = {
  date: string;
  hour: number;
  isToday?: boolean;
  onClick: (date: string, hour: number) => void;
};

export function CalendarCell({ date, hour, isToday = false, onClick }: CalendarCellProps) {
  return (
    <button
      type="button"
      className={cn(
        "group flex h-full min-h-16 w-full items-start justify-end border-b border-r border-border bg-background p-1 text-left transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isToday && "bg-emerald-50/35"
      )}
      onClick={() => onClick(date, hour)}
      aria-label={`Создать событие ${date} ${String(hour).padStart(2, "0")}:00`}
    >
      <span className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        +
      </span>
    </button>
  );
}
