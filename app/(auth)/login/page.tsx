import { AuthForm } from "@/components/auth-form";
import { signInAction } from "@/lib/actions/catalog";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <AuthForm mode="login" action={signInAction} error={params.error} />;
}
