"use client";

import { Play } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { startWorkoutFromEvent } from "@/features/calendar/actions";

type StartWorkoutButtonProps = {
  eventId: string;
  status: "scheduled" | "started" | "completed" | "cancelled";
};

export function StartWorkoutButton({ eventId, status }: StartWorkoutButtonProps) {
  const label = status === "started" ? "Открыть тренировку" : status === "completed" ? "Открыть итог" : "Начать";

  if (status === "cancelled") {
    return null;
  }

  return (
    <form action={startWorkoutFromEvent.bind(null, eventId)}>
      <StartWorkoutSubmitButton label={label} variant={status === "scheduled" ? "default" : "outline"} />
    </form>
  );
}

function StartWorkoutSubmitButton({
  label,
  variant
}: {
  label: string;
  variant: "default" | "outline";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      <Play className="h-4 w-4" />
      {pending ? "Открываем..." : label}
    </Button>
  );
}
