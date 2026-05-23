import { EmptyState } from "@/components/empty-states/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ClientList } from "@/features/clients/components/client-list";
import { getClients } from "@/features/clients/queries";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Клиенты"
        description="Рабочая база подопечных тренера."
        action={{ label: "Новый клиент", href: "/clients/new" }}
      />
      {clients.length > 0 ? (
        <ClientList clients={clients} />
      ) : (
        <EmptyState
          title="Клиентов пока нет"
          description="Создайте первого клиента, чтобы начать вести карточку и тренировочный контекст."
          action={{ label: "Создать клиента", href: "/clients/new" }}
        />
      )}
    </div>
  );
}
