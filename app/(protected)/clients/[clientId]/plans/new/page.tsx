import Link from "next/link";
import { FormError } from "@/components/feedback/form-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getCalendarStartDate } from "@/features/calendar/queries";
import { ClientProfileNav } from "@/features/clients/components/client-profile-nav";
import { getClientById } from "@/features/clients/queries";
import { TrainingPlanForm } from "@/features/planning/components/training-plan-form";

type NewTrainingPlanPageProps = {
  params: {
    clientId: string;
  };
  searchParams?: {
    error?: string;
  };
};

export default async function NewTrainingPlanPage({ params, searchParams }: NewTrainingPlanPageProps) {
  const [client, calendarStart] = await Promise.all([
    getClientById(params.clientId),
    getCalendarStartDate()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Новый тренировочный план" description={client.preferred_name || client.name} />
      <ClientProfileNav clientId={client.id} active="plans" />
      <FormError message={searchParams?.error} />
      <Button asChild variant="outline">
        <Link href={`/clients/${client.id}/plans`}>Назад к планам</Link>
      </Button>
      <TrainingPlanForm clientId={client.id} defaultStartDate={calendarStart.startDate} />
    </div>
  );
}
