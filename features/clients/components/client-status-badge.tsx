import { Badge } from "@/components/ui/badge";

const labels = {
  active: "Активен",
  paused: "Пауза",
  archived: "Архив"
} as const;

export function ClientStatusBadge({ status }: { status: keyof typeof labels }) {
  const variant = status === "archived" ? "secondary" : status === "paused" ? "outline" : "default";

  return <Badge variant={variant}>{labels[status]}</Badge>;
}
