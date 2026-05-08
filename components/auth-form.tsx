import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (formData: FormData) => Promise<void>;
  error?: string;
};

export function AuthForm({ mode, action, error }: AuthFormProps) {
  const isSignup = mode === "signup";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignup ? "Criar conta" : "Entrar"}</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <form action={action} className="space-y-4">
            {isSignup ? (
              <>
                <label className="block text-sm font-medium text-slate-700">
                  Nome
                  <Input name="name" required className="mt-1" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Escola
                  <Input name="organization_name" required className="mt-1" />
                </label>
              </>
            ) : null}
            <label className="block text-sm font-medium text-slate-700">
              E-mail
              <Input name="email" type="email" required className="mt-1" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Senha
              <Input name="password" type="password" required minLength={6} className="mt-1" />
            </label>
            <Button className="w-full" type="submit">
              {isSignup ? "Criar conta" : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-500">
            {isSignup ? "Ja tem conta?" : "Ainda nao tem conta?"}{" "}
            <Link className="font-medium text-slate-950" href={isSignup ? "/login" : "/signup"}>
              {isSignup ? "Entrar" : "Criar conta"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
