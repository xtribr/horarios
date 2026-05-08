import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:55321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "cole_aqui_a_anon_key_do_supabase_status",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const isAppRoute = request.nextUrl.pathname.startsWith("/dashboard")
    || request.nextUrl.pathname.startsWith("/cadastros")
    || request.nextUrl.pathname.startsWith("/disponibilidade")
    || request.nextUrl.pathname.startsWith("/atribuicoes")
    || request.nextUrl.pathname.startsWith("/gerar")
    || request.nextUrl.pathname.startsWith("/horario")
    || request.nextUrl.pathname.startsWith("/relatorios");

  if (isAppRoute && !data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
