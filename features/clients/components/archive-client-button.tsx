import { archiveClient } from "@/features/clients/actions";
import { Button } from "@/components/ui/button";

export function ArchiveClientButton({ clientId }: { clientId: string }) {
  const action = archiveClient.bind(null, clientId);

  return (
    <form action={action}>
      <Button variant="destructive" type="submit">
        Архивировать
      </Button>
    </form>
  );
}
