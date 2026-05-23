import { PageHeader } from "@/components/layout/page-header";
import { ClientForm } from "@/features/clients/components/client-form";
import { createClient } from "@/features/clients/actions";

type NewClientPageProps = {
  searchParams: {
    error?: string;
  };
};

export default function NewClientPage({ searchParams }: NewClientPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title="Новый клиент" description="Добавьте базовую карточку клиента." />
      <ClientForm action={createClient} error={searchParams.error} />
    </div>
  );
}
