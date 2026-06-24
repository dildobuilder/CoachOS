import Link from "next/link";
import { FormError } from "@/components/feedback/form-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ClientProfileNav } from "@/features/clients/components/client-profile-nav";
import { getClientById } from "@/features/clients/queries";
import { TrainingPlanForm } from "@/features/planning/components/training-plan-form";
import { getTrainingPlan } from "@/features/planning/queries";

type EditTrainingPlanPageProps = {
  params: {
    clientId: string;
    planId: string;
  };
  searchParams?: {
    error?: string;
  };
};

export default async function EditTrainingPlanPage({ params, searchParams }: EditTrainingPlanPageProps) {
  const [client, plan] = await Promise.all([
    getClientById(params.clientId),
    getTrainingPlan(params.planId)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Редактировать тренировочный план" description={client.preferred_name || client.name} />
      <ClientProfileNav clientId={client.id} active="plans" />
      <FormError message={searchParams?.error} />
      <Button asChild variant="outline">
        <Link href={`/clients/${client.id}/plans/${plan.id}`}>Назад к плану</Link>
      </Button>
      <TrainingPlanForm clientId={client.id} defaultStartDate={plan.starts_on} plan={plan} />
    </div>
  );
}
