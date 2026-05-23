import Link from "next/link";
import { EmptyState } from "@/components/empty-states/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getClientById } from "@/features/clients/queries";

type ClientHistoryPageProps = {
  params: {
    clientId: string;
  };
};

export default async function ClientHistoryPage({ params }: ClientHistoryPageProps) {
  const client = await getClientById(params.clientId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="История тренировок"
        description={`${client.preferred_name || client.name}. Будет реализовано в Sprint 1B.`}
      />
      <Button asChild variant="outline">
        <Link href={`/clients/${client.id}`}>Назад к клиенту</Link>
      </Button>
      <EmptyState
        title="История появится в Sprint 1B"
        description="После реализации тренировочных сессий здесь будут завершенные тренировки клиента."
      />
    </div>
  );
}
