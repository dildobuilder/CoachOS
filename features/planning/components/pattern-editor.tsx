import Link from "next/link";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAvailableExercises, getExerciseCategories } from "@/features/exercises/queries";
import { AddPatternExerciseFromLibrary } from "@/features/planning/components/add-pattern-exercise-from-library";
import { PatternExerciseCard } from "@/features/planning/components/pattern-exercise-card";
import {
  applyPatternToPlannedWorkouts,
  archiveTrainingPlanPattern,
  updateTrainingPlanPattern
} from "@/features/planning/actions";
import type { TrainingPlanPatternDetail } from "@/features/planning/queries";

type PatternEditorProps = {
  pattern: TrainingPlanPatternDetail;
  clientId: string;
};

export async function PatternEditor({ pattern, clientId }: PatternEditorProps) {
  const [exercises, categories] = await Promise.all([getAvailableExercises(), getExerciseCategories()]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pattern {pattern.code}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={updateTrainingPlanPattern.bind(null, pattern.id)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
              <Field label="Код" name="code" defaultValue={pattern.code} required />
              <Field label="Название" name="name" defaultValue={pattern.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" name="description" defaultValue={pattern.description ?? ""} />
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <Button asChild variant="outline">
                <Link href={`/clients/${clientId}/plans/${pattern.training_plan_id}`}>К плану</Link>
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button formAction={archiveTrainingPlanPattern.bind(null, pattern.id)} variant="outline">
                  В архив
                </Button>
                <SubmitButton>Сохранить</SubmitButton>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-semibold">Применить pattern</h3>
            <p className="text-sm text-muted-foreground">
              Обновит planned workouts с этим pattern. Started/completed не перезаписываются.
            </p>
          </div>
          <form action={applyPatternToPlannedWorkouts.bind(null, pattern.id)} className="flex flex-wrap gap-2">
            <Select name="scope" defaultValue="future_only">
              <option value="future_only">Будущие planned</option>
              <option value="all_not_started">Все planned</option>
            </Select>
            <SubmitButton>Применить</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {pattern.pattern_exercises.length > 0 ? (
          pattern.pattern_exercises.map((exercise) => <PatternExerciseCard key={exercise.id} exercise={exercise} />)
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              В pattern пока нет упражнений. Добавьте упражнения ниже.
            </CardContent>
          </Card>
        )}
      </div>

      <AddPatternExerciseFromLibrary patternId={pattern.id} exercises={exercises} categories={categories} />
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} required={required} />
    </div>
  );
}
