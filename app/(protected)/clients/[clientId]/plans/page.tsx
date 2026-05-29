import Link from "next/link";
import { FormError } from "@/components/feedback/form-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ClientProfileNav } from "@/features/clients/components/client-profile-nav";
import { getClientById } from "@/features/clients/queries";
import { TrainingPlanList } from "@/features/planning/components/training-plan-list";
import { getClientTrainingPlans } from "@/features/planning/queries";

type ClientPlansPageProps = {
  params: {
    clientId: string;
  };
  searchParams?: {
    error?: string;
  };
};

export default async function ClientPlansPage({ params, searchParams }: ClientPlansPageProps) {
  const [client, plans] = await Promise.all([
    getClientById(params.clientId),
    getClientTrainingPlans(params.clientId)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Тренировочные планы" description={client.preferred_name || client.name} />
      <ClientProfileNav clientId={client.id} active="plans" />
      <FormError message={searchParams?.error} />
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/clients/${client.id}/plans/new`}>Создать тренировочный план</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/clients/${client.id}/calendar`}>Календарь клиента</Link>
        </Button>
      </div>
      <TrainingPlanList clientId={client.id} plans={plans} />
    </div>
  );
}
