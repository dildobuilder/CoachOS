import Link from "next/link";
import { FormError } from "@/components/feedback/form-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getCalendarStartDate } from "@/features/calendar/queries";
import { ClientProfileNav } from "@/features/clients/components/client-profile-nav";
import { getClientById } from "@/features/clients/queries";
import { CreatePlanFromTemplateForm } from "@/features/planning/components/create-plan-from-template-form";
import { getAvailableTrainingPlanTemplates } from "@/features/planning/queries";

type PlanTemplatesPageProps = {
  params: {
    clientId: string;
  };
  searchParams?: {
    error?: string;
  };
};

export default async function PlanTemplatesPage({ params, searchParams }: PlanTemplatesPageProps) {
  const [client, templates, calendarStart] = await Promise.all([
    getClientById(params.clientId),
    getAvailableTrainingPlanTemplates(),
    getCalendarStartDate()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Шаблоны тренировочных планов" description={client.preferred_name || client.name} />
      <ClientProfileNav clientId={client.id} active="plans" />
      <FormError message={searchParams?.error} />
      <Button asChild variant="outline">
        <Link href={`/clients/${client.id}/plans`}>Назад к планам</Link>
      </Button>
      <CreatePlanFromTemplateForm clientId={client.id} templates={templates} defaultStartDate={calendarStart.startDate} />
    </div>
  );
}
