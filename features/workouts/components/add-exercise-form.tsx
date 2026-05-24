import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addExerciseToSession } from "@/features/workouts/actions";
import { IntensityTypeSelector } from "@/features/workouts/components/intensity-type-selector";

export function AddExerciseForm({ sessionId }: { sessionId: string }) {
  return (
    <form action={addExerciseToSession.bind(null, sessionId)} className="grid gap-3 rounded-lg border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <div className="space-y-2">
          <Label htmlFor="exercise-name">Упражнение</Label>
          <Input id="exercise-name" name="name" placeholder="Например: Жим лежа" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="intensity_type">Интенсивность</Label>
          <IntensityTypeSelector />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="exercise-notes">Заметки</Label>
        <Textarea id="exercise-notes" name="notes" />
      </div>
      <div className="flex justify-end">
        <SubmitButton size="sm">Добавить упражнение</SubmitButton>
      </div>
    </form>
  );
}
