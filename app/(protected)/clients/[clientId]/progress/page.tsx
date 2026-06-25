import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ClientProgressDashboard } from "@/features/client-progress/components/client-progress-dashboard";
import { getClientProgressDashboard, normalizeProgressRange } from "@/features/client-progress/queries";
import { ClientProfileNav } from "@/features/clients/components/client-profile-nav";
import { getClientById } from "@/features/clients/queries";

type ClientProgressPageProps = {
  params: {
    clientId: string;
  };
  searchParams: {
    range?: string;
  };
};

export default async function ClientProgressPage({ params, searchParams }: ClientProgressPageProps) {
  const range = normalizeProgressRange(searchParams.range);
  const [client, dashboard] = await Promise.all([
    getClientById(params.clientId),
    getClientProgressDashboard(params.clientId, { range })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Прогресс клиента" description={client.preferred_name || client.name} />
      <ClientProfileNav clientId={client.id} active="progress" />
      <Button asChild variant="outline">
        <Link href={`/clients/${client.id}`}>Назад к клиенту</Link>
      </Button>
      <ClientProgressDashboard dashboard={dashboard} />
    </div>
  );
}
