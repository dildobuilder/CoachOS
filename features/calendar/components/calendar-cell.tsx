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
        "group flex h-full min-h-12 w-full items-start justify-end border-b border-r border-border bg-background p-0.5 text-left transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-16 sm:p-1",
        isToday && "bg-emerald-50/35"
      )}
      onClick={() => onClick(date, hour)}
      aria-label={`Создать событие ${date} ${String(hour).padStart(2, "0")}:00`}
    >
      <span className="rounded px-1 py-0 text-[9px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:px-1.5 sm:py-0.5 sm:text-[10px]">
        +
      </span>
    </button>
  );
}
