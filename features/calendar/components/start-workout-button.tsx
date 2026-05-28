"use client";

import { Play } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { startWorkoutFromEvent } from "@/features/calendar/actions";

type WorkoutEventStatus = "scheduled" | "started" | "completed" | "cancelled";

type StartWorkoutButtonProps = {
  eventId: string;
  status: WorkoutEventStatus;
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
    (status === "started" ? "Продолжить" : status === "completed" ? "Открыть итог" : "Начать");

  if (status === "cancelled") {
    return null;
  }

  return (
    <form action={startWorkoutFromEvent.bind(null, eventId)}>
      <StartWorkoutSubmitButton label={label} status={status} compact={compact} compactSize={compactSize} />
    </form>
  );
}

function StartWorkoutSubmitButton({
  label,
  status,
  compact,
  compactSize
}: {
  label: string;
  status: Exclude<WorkoutEventStatus, "cancelled">;
  compact: boolean;
  compactSize: "sm" | "lg";
}) {
  const { pending } = useFormStatus();
  const isStarted = status === "started";
  const variant = status === "completed" ? "outline" : "default";
  const colorClassName = isStarted ? "bg-amber-400 text-amber-950 hover:bg-amber-500" : undefined;

  if (compact) {
    const buttonSize = compactSize === "sm" ? "h-9 w-9" : "h-9 w-9 sm:h-12 sm:w-12";
    const iconSize = compactSize === "sm" ? "h-4 w-4" : "h-4 w-4 sm:h-6 sm:w-6";

    return (
      <Button
        type="submit"
        variant={variant}
        disabled={pending}
        className={`${buttonSize} shrink-0 rounded-md p-0 ${colorClassName ?? ""}`}
        aria-label={label}
        title={label}
      >
        <Play className={iconSize} />
        <span className="sr-only">{pending ? "Открываем..." : label}</span>
      </Button>
    );
  }

  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending} className={colorClassName}>
      <Play className="h-4 w-4" />
      {pending ? "Открываем..." : label}
    </Button>
  );
}
