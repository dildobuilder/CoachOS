import Link from "next/link";
import { FormError } from "@/components/feedback/form-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCalendarStartDate } from "@/features/calendar/queries";
import { ClientProfileNav } from "@/features/clients/components/client-profile-nav";
import { getClientById } from "@/features/clients/queries";
import { CreatePlanFromTemplateForm } from "@/features/planning/components/create-plan-from-template-form";
import { TrainingPlanForm } from "@/features/planning/components/training-plan-form";
import { getAvailableTrainingPlanTemplates } from "@/features/planning/queries";

type NewTrainingPlanPageProps = {
  params: {
    clientId: string;
  };
  searchParams?: {
    error?: string;
    method?: string;
  };
};

export default async function NewTrainingPlanPage({ params, searchParams }: NewTrainingPlanPageProps) {
  const [client, calendarStart, templates] = await Promise.all([
    getClientById(params.clientId),
    getCalendarStartDate(),
    getAvailableTrainingPlanTemplates()
  ]);
  const method = searchParams?.method === "template" ? "template" : "scratch";

  return (
    <div className="space-y-6">
      <PageHeader title="Новый тренировочный план" description={client.preferred_name || client.name} />
      <ClientProfileNav clientId={client.id} active="plans" />
      <FormError message={searchParams?.error} />
      <Button asChild variant="outline">
        <Link href={`/clients/${client.id}/plans`}>Назад к планам</Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Как создать план?</h2>
            <p className="text-sm text-muted-foreground">Выберите источник. Шаблон будет скопирован в независимый план клиента.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant={method === "scratch" ? "default" : "outline"} size="sm">
              <Link href={`/clients/${client.id}/plans/new?method=scratch`}>С нуля</Link>
            </Button>
            <Button asChild variant={method === "template" ? "default" : "outline"} size="sm">
              <Link href={`/clients/${client.id}/plans/new?method=template`}>Из шаблона</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {method === "template" ? (
        <CreatePlanFromTemplateForm clientId={client.id} templates={templates} defaultStartDate={calendarStart.startDate} />
      ) : (
        <TrainingPlanForm clientId={client.id} defaultStartDate={calendarStart.startDate} />
      )}
    </div>
  );
}
