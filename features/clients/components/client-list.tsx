import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ClientStatusBadge } from "@/features/clients/components/client-status-badge";
import type { Database } from "@/lib/database.types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export function ClientList({ clients }: { clients: Client[] }) {
  return (
    <div className="grid gap-3">
      {clients.map((client) => (
        <Link key={client.id} href={`/clients/${client.id}`}>
          <Card className="transition-colors hover:bg-secondary/40">
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{client.preferred_name || client.name}</h2>
                  <ClientStatusBadge status={client.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {client.goal || "Цель не указана"}
                  {client.level ? ` · ${client.level}` : ""}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">Открыть</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
