import { FormError } from "@/components/feedback/form-error";
import { PageHeader } from "@/components/layout/page-header";
import { ClientProfileNav } from "@/features/clients/components/client-profile-nav";
import { getClientById } from "@/features/clients/queries";
import { PatternEditor } from "@/features/planning/components/pattern-editor";
import { getTrainingPlanPattern } from "@/features/planning/queries";

type TrainingPlanPatternPageProps = {
  params: {
    clientId: string;
    patternId: string;
  };
  searchParams?: {
    error?: string;
  };
};

export default async function TrainingPlanPatternPage({ params, searchParams }: TrainingPlanPatternPageProps) {
  const [client, pattern] = await Promise.all([
    getClientById(params.clientId),
    getTrainingPlanPattern(params.patternId)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={`${pattern.code} - ${pattern.name}`} description={client.preferred_name || client.name} />
      <ClientProfileNav clientId={client.id} active="plans" />
      <FormError message={searchParams?.error} />
      <PatternEditor pattern={pattern} clientId={client.id} />
    </div>
  );
}
