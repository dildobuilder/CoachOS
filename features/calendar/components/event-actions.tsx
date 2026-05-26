"use client";

import Link from "next/link";
import { Pencil, Play, XCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cancelCalendarEvent } from "@/features/calendar/actions";
import { StartWorkoutButton } from "@/features/calendar/components/start-workout-button";
import type { CalendarEventWithClient } from "@/features/calendar/queries";

type EventActionsProps = {
  event: CalendarEventWithClient;
  onEdit?: () => void;
  compact?: boolean;
};

export function EventActions({ event, onEdit, compact = false }: EventActionsProps) {
  const canOpenSession =
    event.type === "client_training" &&
    event.existing_session_id &&
    event.status !== "scheduled";
  const canStart = event.type === "client_training" && event.status === "scheduled";
  const canCancel = event.status !== "cancelled" && event.status !== "completed";
  const compactOpenClassName =
    event.status === "started"
      ? "h-12 w-12 shrink-0 rounded-md bg-amber-400 p-0 text-amber-950 hover:bg-amber-500"
      : "h-12 w-12 shrink-0 rounded-md bg-primary p-0 text-primary-foreground hover:bg-primary/90";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canOpenSession ? (
        <Button
          asChild
          size={compact ? "icon" : "sm"}
          variant="outline"
          className={compact ? compactOpenClassName : undefined}
        >
          <Link href={`/sessions/${event.existing_session_id}`}>
            {compact ? (
              <>
                <Play className="h-6 w-6" />
                <span className="sr-only">{event.status === "started" ? "Продолжить" : "Открыть"}</span>
              </>
            ) : event.status === "completed" ? (
              "Открыть итог"
            ) : (
              "Продолжить"
            )}
          </Link>
        </Button>
      ) : null}

      {canStart ? <StartWorkoutButton eventId={event.id} status={event.status} compact={compact} /> : null}

      {onEdit && !compact ? (
        <Button type="button" size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Изменить
        </Button>
      ) : null}

      {canCancel && !compact ? (
        <form action={cancelCalendarEvent.bind(null, event.id)}>
          <CancelButton />
        </form>
      ) : null}
    </div>
  );
}

function CancelButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" variant="ghost" disabled={pending}>
      <XCircle className="h-4 w-4" />
      {pending ? "Отменяем..." : "Отменить"}
    </Button>
  );
}
