"use client";

import { Play } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { startWorkoutFromEvent } from "@/features/calendar/actions";

type StartWorkoutButtonProps = {
  eventId: string;
  status: "scheduled" | "started" | "completed" | "cancelled";
  compact?: boolean;
  compactSize?: "sm" | "lg";
  labelOverride?: string;
};

export function StartWorkoutButton({
  eventId,
  status,
  compact = false,
  compactSize = "lg",
  labelOverride
}: StartWorkoutButtonProps) {
  const label =
    labelOverride ||
    (status === "started" ? "Открыть тренировку" : status === "completed" ? "Открыть итог" : "Начать");

  if (status === "cancelled") {
    return null;
  }

  return (
    <form action={startWorkoutFromEvent.bind(null, eventId)}>
      <StartWorkoutSubmitButton
        label={label}
        variant={status === "scheduled" ? "default" : "outline"}
        compact={compact}
        compactSize={compactSize}
      />
    </form>
  );
}

function StartWorkoutSubmitButton({
  label,
  variant,
  compact,
  compactSize
}: {
  label: string;
  variant: "default" | "outline";
  compact: boolean;
  compactSize: "sm" | "lg";
}) {
  const { pending } = useFormStatus();

  if (compact) {
    const buttonSize = compactSize === "sm" ? "h-9 w-9" : "h-12 w-12";
    const iconSize = compactSize === "sm" ? "h-4 w-4" : "h-6 w-6";

    return (
      <Button
        type="submit"
        variant={variant}
        disabled={pending}
        className={`${buttonSize} shrink-0 rounded-md p-0`}
        aria-label={label}
        title={label}
      >
        <Play className={iconSize} />
        <span className="sr-only">{pending ? "Открываем..." : label}</span>
      </Button>
    );
  }

  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      <Play className="h-4 w-4" />
      {pending ? "Открываем..." : label}
    </Button>
  );
}
