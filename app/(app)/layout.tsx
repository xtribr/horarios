import { AppShell } from "@/components/app-shell";
import { requireCurrentOrganization } from "@/lib/tenant/current";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const organization = await requireCurrentOrganization();

  return <AppShell organization={organization}>{children}</AppShell>;
}
