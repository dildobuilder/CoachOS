import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getClientById } from "@/features/clients/queries";
import { ClientSessionHistory } from "@/features/workouts/components/client-session-history";
import { getClientSessionHistory } from "@/features/workouts/queries";

type ClientHistoryPageProps = {
  params: {
    clientId: string;
  };
};

export default async function ClientHistoryPage({ params }: ClientHistoryPageProps) {
  const [client, sessions] = await Promise.all([
    getClientById(params.clientId),
    getClientSessionHistory(params.clientId)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="История тренировок"
        description={client.preferred_name || client.name}
      />
      <Button asChild variant="outline">
        <Link href={`/clients/${client.id}`}>Назад к клиенту</Link>
      </Button>
      <ClientSessionHistory sessions={sessions} />
    </div>
  );
}
