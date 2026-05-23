import { PageHeader } from "@/components/layout/page-header";
import { ArchiveClientButton } from "@/features/clients/components/archive-client-button";
import { ClientForm } from "@/features/clients/components/client-form";
import { updateClient } from "@/features/clients/actions";
import { getClientById } from "@/features/clients/queries";

type EditClientPageProps = {
  params: {
    clientId: string;
  };
  searchParams: {
    error?: string;
  };
};

export default async function EditClientPage({ params, searchParams }: EditClientPageProps) {
  const client = await getClientById(params.clientId);
  const updateAction = updateClient.bind(null, client.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Редактировать клиента" description={client.preferred_name || client.name} />
      <ClientForm action={updateAction} client={client} error={searchParams.error} />
      {client.status !== "archived" ? (
        <div className="rounded-lg border border-destructive/25 bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Архивирование</h2>
              <p className="text-sm text-muted-foreground">
                Клиент исчезнет из основного списка, но данные сохранятся.
              </p>
            </div>
            <ArchiveClientButton clientId={client.id} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
