import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ClientWeightSummary } from "@/features/client-logs/components/client-weight-summary";
import { getLatestClientWeight } from "@/features/client-logs/queries";
import { ClientProgressSummary } from "@/features/client-progress/components/client-progress-summary";
import { getClientProgressDashboard } from "@/features/client-progress/queries";
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
  const [client, currentWeight, activePlan, progressDashboard] = await Promise.all([
    getClientById(params.clientId),
    getLatestClientWeight(params.clientId),
    getClientActiveTrainingPlan(params.clientId),
    getClientProgressDashboard(params.clientId, { range: "30" })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.preferred_name || client.name}
        description="Карточка клиента и текущий тренировочный контекст."
      />
      <ClientProfileNav clientId={client.id} active="overview" />
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href={`/clients/${client.id}/edit`}>Редактировать клиента</Link>
        </Button>
      </div>
      <ClientWeightSummary
        clientId={client.id}
        startingWeight={client.starting_weight}
        currentWeight={currentWeight}
        returnToPath={`/clients/${client.id}`}
      />
      <ClientProgressSummary dashboard={progressDashboard} />
      <ClientProfileSummary client={client} activePlan={activePlan} />
    </div>
  );
}
