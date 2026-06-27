"use client";

import { Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { archiveTrainingPlan } from "@/features/planning/actions";

type ArchiveTrainingPlanButtonProps = {
  planId: string;
  compact?: boolean;
};

const confirmationText =
  "Удалить тренировочный план? История завершённых тренировок сохранится. Тренировки с назначенным временем останутся в календаре.";

export function ArchiveTrainingPlanButton({ planId, compact = false }: ArchiveTrainingPlanButtonProps) {
  return (
    <form
      action={archiveTrainingPlan.bind(null, planId)}
      onSubmit={(event) => {
        if (!window.confirm(confirmationText)) {
          event.preventDefault();
        }
      }}
    >
      <SubmitButton
        variant="destructive"
        size={compact ? "icon" : "sm"}
        aria-label={compact ? "Архивировать план" : undefined}
        title={compact ? "Архивировать план" : undefined}
      >
        <Trash2 className="h-4 w-4" />
        {compact ? null : "Удалить"}
      </SubmitButton>
    </form>
  );
}
