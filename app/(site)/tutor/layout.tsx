import type { ReactNode } from "react";
import { requireUser } from "@/cms/auth/session";
import { toPortalUser } from "@/cms/auth/portal";
import { PortalShell } from "@/components/portal/PortalShell";

export const dynamic = "force-dynamic";

/** Tutor portal: signed-in tutors only (everyone else is sent to their own home). */
export default async function TutorPortalLayout({ children }: { children: ReactNode }) {
  const user = await requireUser(["tutor"], "/tutor");
  return (
    <PortalShell user={await toPortalUser(user)} role="tutor">
      {children}
    </PortalShell>
  );
}
