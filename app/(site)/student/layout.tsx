import type { ReactNode } from "react";
import { requireUser } from "@/cms/auth/session";
import { toPortalUser } from "@/cms/auth/portal";
import { PortalShell } from "@/components/portal/PortalShell";

export const dynamic = "force-dynamic";

/** Student portal: signed-in students only (everyone else is sent to their own home). */
export default async function StudentPortalLayout({ children }: { children: ReactNode }) {
  const user = await requireUser(["student"], "/student");
  return (
    <PortalShell user={await toPortalUser(user)} role="student">
      {children}
    </PortalShell>
  );
}
