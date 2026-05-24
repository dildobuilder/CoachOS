import { SubmitButton } from "@/components/forms/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { completeWorkoutSession } from "@/features/workouts/actions";

export function CompleteSessionButton({ sessionId }: { sessionId: string }) {
  return (
    <form action={completeWorkoutSession.bind(null, sessionId)} className="grid gap-3 rounded-lg border bg-card p-4">
      <Textarea name="coach_notes" placeholder="Итоговые заметки тренера" />
      <div className="flex justify-end">
        <SubmitButton>Завершить тренировку</SubmitButton>
      </div>
    </form>
  );
}
