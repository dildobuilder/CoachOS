"use client";

import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCustomExerciseAndAddToSession } from "@/features/exercises/actions";
import type { ExerciseCategory } from "@/features/exercises/schemas";

type CustomExerciseFormProps = {
  sessionId: string;
  categories: ExerciseCategory[];
  defaultCategory: ExerciseCategory;
};

export function CustomExerciseForm({ sessionId, categories, defaultCategory }: CustomExerciseFormProps) {
  return (
    <form action={createCustomExerciseAndAddToSession.bind(null, sessionId)} className="grid gap-3 rounded-lg border bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="custom-exercise-name">Название</Label>
          <Input id="custom-exercise-name" name="name" required placeholder="Например: тяга салазок назад" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="custom-primary-category">Группа</Label>
          <Select id="custom-primary-category" name="primary_category" defaultValue={defaultCategory}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="custom-secondary-categories">Доп. группы</Label>
          <Input id="custom-secondary-categories" name="secondary_categories" placeholder="Через ;" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="custom-equipment">Оборудование</Label>
          <Input id="custom-equipment" name="equipment" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="custom-agonists">Основные мышцы</Label>
          <Input id="custom-agonists" name="agonists" placeholder="Через ;" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="custom-synergists">Доп. мышцы</Label>
          <Input id="custom-synergists" name="synergists" placeholder="Через ;" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="custom-movement-pattern">Паттерн</Label>
          <Input id="custom-movement-pattern" name="movement_pattern" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="custom-default-intensity">Интенсивность по умолчанию</Label>
          <Select id="custom-default-intensity" name="default_intensity_type" defaultValue="none">
            <option value="none">Без оценки</option>
            <option value="rpe">RPE</option>
            <option value="rir">RIR</option>
            <option value="percent">%</option>
            <option value="time">Время</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-short-description">Краткое описание</Label>
        <Textarea id="custom-short-description" name="short_description" />
      </div>

      <div className="flex justify-end">
        <SubmitButton size="sm">Создать и добавить</SubmitButton>
      </div>
    </form>
  );
}
