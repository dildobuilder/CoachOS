import Link from "next/link";
import { signUpWithPassword } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";
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
        <CardTitle>Регистрация тренера</CardTitle>
        <CardDescription>Создайте личное рабочее пространство.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signUpWithPassword} className="space-y-4">
          <FormError message={error} />
          <FormError message={setupMessage} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>
          <SubmitButton className="w-full">Зарегистрироваться</SubmitButton>
        </form>
        <Button asChild variant="link" className="mt-3 w-full">
          <Link href="/login">Уже есть аккаунт</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
