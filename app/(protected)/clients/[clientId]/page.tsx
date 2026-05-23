import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ClientProfileSummary } from "@/features/clients/components/client-profile-summary";
import { getClientById } from "@/features/clients/queries";

type ClientPageProps = {
  params: {
    clientId: string;
  };
};

export default async function ClientPage({ params }: ClientPageProps) {
  const client = await getClientById(params.clientId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.preferred_name || client.name}
        description="Карточка клиента и текущий тренировочный контекст."
      />
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/clients/${client.id}/edit`}>Редактировать</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/clients/${client.id}/history`}>История тренировок</Link>
        </Button>
      </div>
      <ClientProfileSummary client={client} />
    </div>
  );
}
