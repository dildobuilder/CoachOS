import { FormError } from "@/components/feedback/form-error";
import { PageHeader } from "@/components/layout/page-header";
import { SessionEditor } from "@/features/workouts/components/session-editor";
import { getPreviousCompletedWorkout, getWorkoutSessionById } from "@/features/workouts/queries";

type SessionPageProps = {
  params: {
    sessionId: string;
  };
  searchParams?: {
    error?: string;
  };
};

export default async function SessionPage({ params, searchParams }: SessionPageProps) {
  const detail = await getWorkoutSessionById(params.sessionId);
  const previousWorkout =
    detail.session.status === "started"
      ? await getPreviousCompletedWorkout(detail.session.client_id, detail.session.id)
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
