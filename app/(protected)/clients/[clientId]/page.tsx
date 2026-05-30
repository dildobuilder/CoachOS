import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ClientWeightSummary } from "@/features/client-logs/components/client-weight-summary";
import { getLatestClientWeight } from "@/features/client-logs/queries";
import { ClientProfileNav } from "@/features/clients/components/client-profile-nav";
import { ClientProfileSummary } from "@/features/clients/components/client-profile-summary";
import { getClientById } from "@/features/clients/queries";
import { getClientActiveTrainingPlan } from "@/features/planning/queries";

type ClientPageProps = {
  params: {
    clientId: string;
  };
};

export default async function ClientPage({ params }: ClientPageProps) {
  const [client, currentWeight, activePlan] = await Promise.all([
    getClientById(params.clientId),
    getLatestClientWeight(params.clientId),
    getClientActiveTrainingPlan(params.clientId)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.preferred_name || client.name}
        description="Карточка клиента и текущий тренировочный контекст."
      />
      <ClientProfileNav clientId={client.id} active="overview" />
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/clients/${client.id}/edit`}>Редактировать</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/clients/${client.id}/calendar`}>Календарь клиента</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/clients/${client.id}/plans`}>Планы</Link>
        </Button>
      </div>
      <ClientWeightSummary
        clientId={client.id}
        startingWeight={client.starting_weight}
        currentWeight={currentWeight}
        returnToPath={`/clients/${client.id}`}
      />
      <ClientProfileSummary client={client} activePlan={activePlan} />
    </div>
  );
}
