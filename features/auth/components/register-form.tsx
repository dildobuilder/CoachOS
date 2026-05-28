import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/feedback/form-error";

export function RegisterForm({ error, setup }: { error?: string; setup?: string }) {
  const setupMessage =
    setup === "supabase"
      ? "Добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local и перезапустите dev server."
      : setup === "migrations"
        ? "Supabase подключён, но таблицы ещё не созданы. Примените SQL migrations из папки supabase/migrations и обновите страницу."
        : null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Регистрация временно закрыта</CardTitle>
        <CardDescription>CoachOS сейчас работает в закрытом preview-доступе.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormError message={error} />
        <FormError message={setupMessage} />
        <p className="text-sm text-muted-foreground">
          Новые аккаунты создаются только владельцем проекта. Если у вас уже есть доступ, войдите через форму входа.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Перейти ко входу</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
