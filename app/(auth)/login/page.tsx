import { LoginForm } from "@/features/auth/components/login-form";

type LoginPageProps = {
  searchParams: {
    error?: string;
    setup?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <LoginForm error={searchParams.error} setup={searchParams.setup} />;
}
