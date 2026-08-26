"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function AdminHomepageRedirect() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/admin/cms?tab=homepage");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-400">
      Redirecting to CMS Studio...
    </div>
  );
}
