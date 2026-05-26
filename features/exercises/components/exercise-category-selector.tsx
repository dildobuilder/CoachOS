"use client";

import { Button } from "@/components/ui/button";
import type { ExerciseCategory } from "@/features/exercises/schemas";

type ExerciseCategorySelectorProps = {
  categories: ExerciseCategory[];
  selectedCategory: ExerciseCategory;
  onSelect: (category: ExerciseCategory) => void;
};

export function ExerciseCategorySelector({
  categories,
  selectedCategory,
  onSelect
}: ExerciseCategorySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category}
          type="button"
          size="sm"
          variant={category === selectedCategory ? "default" : "outline"}
          onClick={() => onSelect(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  );
}
