"use client";

import { Input } from "@/components/ui/input";

type ExerciseSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ExerciseSearch({ value, onChange }: ExerciseSearchProps) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Поиск по названию, оборудованию или описанию"
    />
  );
}
