import { Play } from "lucide-react";
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
      <Button type="submit" size="sm" variant={status === "scheduled" ? "default" : "outline"}>
        <Play className="h-4 w-4" />
        {label}
      </Button>
    </form>
  );
}
