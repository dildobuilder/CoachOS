import type { Database } from "@/lib/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError } from "@/components/feedback/form-error";

type Client = Database["public"]["Tables"]["clients"]["Row"];

type ClientFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  client?: Client;
  error?: string;
};

export function ClientForm({ action, client, error }: ClientFormProps) {
  return (
    <form action={action} className="grid gap-6">
      <FormError message={error} />

      <section className="grid gap-4 rounded-lg border bg-card p-4">
        <h2 className="font-semibold">Основная информация</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Имя" name="name" defaultValue={client?.name} required />
          <Field label="Предпочитаемое имя" name="preferred_name" defaultValue={client?.preferred_name} />
          <Field label="Телефон" name="phone" defaultValue={client?.phone} />
          <Field label="Email" name="email" type="email" defaultValue={client?.email} />
          <Field label="Дата рождения" name="birth_date" type="date" defaultValue={client?.birth_date} />
          <div className="space-y-2">
            <Label htmlFor="sex">Пол</Label>
            <Select id="sex" name="sex" defaultValue={client?.sex ?? ""}>
              <option value="">Не указан</option>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
              <option value="other">Другое</option>
            </Select>
          </div>
          <Field label="Дата начала работы" name="started_at" type="date" defaultValue={client?.started_at} />
          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select id="status" name="status" defaultValue={client?.status ?? "active"}>
              <option value="active">Активен</option>
              <option value="paused">Пауза</option>
              <option value="archived">Архив</option>
            </Select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border bg-card p-4">
        <h2 className="font-semibold">Тренировочный контекст</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Цель" name="goal" defaultValue={client?.goal} />
          <Field label="Уровень" name="level" defaultValue={client?.level} />
          <Field
            label="Частота тренировок"
            name="training_frequency"
            defaultValue={client?.training_frequency}
          />
          <Field label="Сплит" name="training_split" defaultValue={client?.training_split} />
        </div>
        <TextAreaField label="Ограничения" name="limitations" defaultValue={client?.limitations} />
        <TextAreaField label="Травмы" name="injuries" defaultValue={client?.injuries} />
        <TextAreaField label="Заметки тренера" name="notes" defaultValue={client?.notes} />
      </section>

      <div className="flex justify-end">
        <SubmitButton>{client ? "Сохранить клиента" : "Создать клиента"}</SubmitButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue ?? ""} />
    </div>
  );
}
