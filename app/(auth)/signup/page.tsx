import { AuthForm } from "@/components/auth-form";
import { signUpAction } from "@/lib/actions/catalog";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <AuthForm mode="signup" action={signUpAction} error={params.error} />;
}
