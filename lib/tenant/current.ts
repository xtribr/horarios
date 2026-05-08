import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Organization } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentOrganization(): Promise<Organization | null> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("memberships")
    .select("organizations(id,name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !data?.organizations) {
    return null;
  }

  const organization = Array.isArray(data.organizations)
    ? data.organizations[0]
    : data.organizations;

  return organization as Organization;
}

export async function requireCurrentOrganization() {
  const organization = await getCurrentOrganization();

  if (!organization) {
    redirect("/signup");
  }

  return organization;
}
