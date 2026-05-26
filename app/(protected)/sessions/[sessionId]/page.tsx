import Link from "next/link";
import { FormError } from "@/components/feedback/form-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SessionEditor } from "@/features/workouts/components/session-editor";
import { getPreviousCompletedWorkout, getWorkoutSessionResult } from "@/features/workouts/queries";

type SessionPageProps = {
  params: {
    sessionId: string;
  };
  searchParams?: {
    error?: string;
  };
};

export default async function SessionPage({ params, searchParams }: SessionPageProps) {
  const result = await getWorkoutSessionResult(params.sessionId);

  if (result.error || !result.detail) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Тренировочная сессия"
          description="Не удалось открыть тренировку."
        />
        <FormError message={searchParams?.error || result.error || "Тренировка не найдена"} />
        <Button asChild variant="outline">
          <Link href="/calendar">Вернуться в календарь</Link>
        </Button>
      </div>
    );
  }

  const detail = result.detail;
  const previousWorkout =
    detail.session.status === "started"
      ? await getPreviousCompletedWorkout(detail.session.client_id, detail.session.id).catch(() => null)
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Тренировочная сессия"
        description={detail.session.status === "completed" ? "Readonly просмотр завершенной тренировки." : "Активная тренировка клиента."}
      />
      <FormError message={searchParams?.error} />
      <SessionEditor detail={detail} previousWorkout={previousWorkout} />
    </div>
  );
}
