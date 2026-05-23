import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClients } from "@/features/clients/queries";

export default async function DashboardPage() {
  const clients = await getClients();
  const today = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(new Date());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Сегодня"
        description={`${today}. Sprint 1A: база клиентов и рабочее пространство.`}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Клиенты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold">{clients.length}</p>
            <p className="text-sm text-muted-foreground">
              Активные и поставленные на паузу клиенты. Архивные скрыты из списка.
            </p>
            <Button asChild>
              <Link href="/clients">Открыть клиентов</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Следующий шаг</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Календарь и запуск тренировок появятся в Sprint 1B. Сейчас задача - надежно
              зафиксировать auth, профиль тренера и клиентскую базу.
            </p>
            <Button asChild variant="outline">
              <Link href="/clients/new">Создать клиента</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
