import { EmptyState } from "@/components/empty-states/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Календарь" description="Day view будет реализован в Sprint 1B." />
      <EmptyState
        title="Календарь запланирован"
        description="Sprint 1A фиксирует auth и клиентов. Создание событий и запуск тренировок начнутся в Sprint 1B."
      />
    </div>
  );
}
