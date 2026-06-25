import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ProgressRange } from "@/features/client-progress/queries";

type ProgressRangeSwitcherProps = {
  clientId: string;
  activeRange: ProgressRange;
};

const ranges: { value: ProgressRange; label: string }[] = [
  { value: "30", label: "30" },
  { value: "90", label: "90" },
  { value: "all", label: "Все" }
];

export function ProgressRangeSwitcher({ clientId, activeRange }: ProgressRangeSwitcherProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ranges.map((range) => (
        <Button key={range.value} asChild size="sm" variant={activeRange === range.value ? "default" : "outline"}>
          <Link href={`/clients/${clientId}/progress?range=${range.value}`}>{range.label}</Link>
        </Button>
      ))}
    </div>
  );
}
