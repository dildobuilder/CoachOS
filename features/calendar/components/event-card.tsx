"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EventActions } from "@/features/calendar/components/event-actions";
import type { CalendarEventType } from "@/features/calendar/schemas";
import type { CalendarEventWithClient } from "@/features/calendar/queries";
import { cn } from "@/lib/utils";

const statusLabels = {
  scheduled: "Запланировано",
  started: "Идет",
  completed: "Завершено",
  cancelled: "Отменено"
};

const statusVariants = {
  scheduled: "secondary",
  started: "default",
  completed: "outline",
  cancelled: "destructive"
} as const;

const typeLabels: Record<CalendarEventType, string> = {
  client_training: "Тренировка",
  personal: "Личная",
  break: "Перерыв",
  other: "Другое"
};

const typeClasses: Record<CalendarEventType, string> = {
  client_training: "border-emerald-300 bg-emerald-50 text-emerald-950",
  personal: "border-cyan-300 bg-cyan-50 text-cyan-950",
  break: "border-amber-300 bg-amber-50 text-amber-950",
  other: "border-slate-300 bg-slate-50 text-slate-950"
};

type EventCardProps = {
  event: CalendarEventWithClient;
  compact?: boolean;
  onEdit?: () => void;
};

export function EventCard({ event, compact = false, onEdit }: EventCardProps) {
  const startsAt = new Date(event.starts_at);
  const endsAt = new Date(event.ends_at);
  const clientName = event.clients?.preferred_name || event.clients?.name;

  if (compact) {
    const shortTitle = getCompactTitle(event, clientName);

    return (
      <div
        className={cn(
          "relative h-full min-h-0 overflow-hidden rounded-md border p-1 text-[11px] shadow-sm sm:p-1.5 sm:text-xs",
          event.type === "client_training" && "pr-11 sm:pr-14",
          typeClasses[event.type],
          event.status === "cancelled" && "opacity-55"
        )}
      >
        <button type="button" className="block max-w-full text-left" onClick={onEdit}>
          <div className="line-clamp-2 text-xs font-semibold leading-[1.02] sm:text-sm sm:leading-[1.05]">
            {shortTitle}
          </div>
          <div className="mt-0.5 whitespace-pre-line text-xs leading-[1.08] sm:text-sm sm:leading-[1.15]">
            {formatTime(startsAt)}-
            {"\n"}
            {formatTime(endsAt)}
          </div>
        </button>
        {event.type === "client_training" ? (
          <div className="absolute right-1 top-1">
            <EventActions event={event} onEdit={onEdit} compact />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Card className={cn(event.status === "cancelled" && "opacity-60")}>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{event.title}</p>
            <Badge variant="outline">{typeLabels[event.type]}</Badge>
            <Badge variant={statusVariants[event.status]}>{statusLabels[event.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatTime(startsAt)} - {formatTime(endsAt)}
            {clientName ? ` · ${clientName}` : ""}
          </p>
          {event.notes ? <p className="text-sm text-muted-foreground">{event.notes}</p> : null}
        </div>
        <EventActions event={event} onEdit={onEdit} />
      </CardContent>
    </Card>
  );
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getCompactTitle(event: CalendarEventWithClient, clientName?: string) {
  if (event.type === "client_training") {
    return clientName || event.title || "Тренировка";
  }

  if (event.type === "personal") {
    return "Личная тренировка";
  }

  if (event.type === "break") {
    return "Перерыв";
  }

  return event.title || typeLabels[event.type];
}
