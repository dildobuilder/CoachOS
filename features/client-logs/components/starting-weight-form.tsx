import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateClientStartingWeight } from "@/features/client-logs/actions";

type StartingWeightFormProps = {
  clientId: string;
  startingWeight?: number | null;
  returnToPath: string;
};

export function StartingWeightForm({ clientId, startingWeight, returnToPath }: StartingWeightFormProps) {
  return (
    <form action={updateClientStartingWeight.bind(null, clientId)} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <input type="hidden" name="return_to_path" value={returnToPath} />
      <div className="space-y-2">
        <Label htmlFor="starting_weight">Стартовый вес, кг</Label>
        <Input
          id="starting_weight"
          name="starting_weight"
          type="number"
          min="0"
          step="0.1"
          defaultValue={startingWeight ?? ""}
          placeholder="Например 82.5"
        />
      </div>
      <SubmitButton variant="outline">Сохранить вес</SubmitButton>
    </form>
  );
}
