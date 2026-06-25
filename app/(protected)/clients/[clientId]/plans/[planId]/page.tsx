import Link from "next/link";
import { FormError } from "@/components/feedback/form-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ClientProfileNav } from "@/features/clients/components/client-profile-nav";
import { getClientById } from "@/features/clients/queries";
import { ExtendTrainingPlanForm } from "@/features/planning/components/extend-training-plan-form";
import { PlanPatternsPanel } from "@/features/planning/components/plan-patterns-panel";
import { PlanWorkoutList } from "@/features/planning/components/plan-workout-list";
import { getPlanWorkouts, getTrainingPlan, getTrainingPlanPatterns } from "@/features/planning/queries";

type TrainingPlanPageProps = {
  params: {
    clientId: string;
    planId: string;
  };
  searchParams?: {
    error?: string;
  };
};

export default async function TrainingPlanPage({ params, searchParams }: TrainingPlanPageProps) {
  const [client, plan, workouts, patterns] = await Promise.all([
    getClientById(params.clientId),
    getTrainingPlan(params.planId),
    getPlanWorkouts(params.planId),
    getTrainingPlanPatterns(params.planId)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={plan.name} description={`${client.preferred_name || client.name} · ${plan.duration_weeks} недель`} />
      <ClientProfileNav clientId={client.id} active="plans" />
      <FormError message={searchParams?.error} />
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/clients/${client.id}/plans`}>Все планы</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/clients/${client.id}/calendar`}>Календарь клиента</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/clients/${client.id}/plans/${plan.id}/edit`}>Редактировать</Link>
        </Button>
      </div>
      <PlanPatternsPanel clientId={client.id} plan={plan} patterns={patterns} />
      <ExtendTrainingPlanForm plan={plan} />
      <PlanWorkoutList clientId={client.id} workouts={workouts} />
    </div>
  );
}
