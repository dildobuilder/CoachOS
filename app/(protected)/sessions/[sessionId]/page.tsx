import { EmptyState } from "@/components/empty-states/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export default function SessionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Тренировочная сессия" description="Будет реализовано в Sprint 1B." />
      <EmptyState
        title="Сессии еще не активны"
        description="Экран добавления упражнений и подходов появится после календарного вертикального среза."
      />
    </div>
  );
}
