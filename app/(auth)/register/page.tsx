import { RegisterForm } from "@/features/auth/components/register-form";

type RegisterPageProps = {
  searchParams: {
    error?: string;
    setup?: string;
  };
};

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return <RegisterForm error={searchParams.error} setup={searchParams.setup} />;
}
