"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ImpersonationBanner() {
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = React.useState(false);
  const [isReverting, setIsReverting] = React.useState(false);

  React.useEffect(() => {
    // Check if the non-HttpOnly cookie is present
    const checkImpersonation = () => {
      const isImp = document.cookie.includes("sb-impersonating=true");
      setIsImpersonating(isImp);
    };

    checkImpersonation();
    
    // Optional: could listen to interval or visibility change if needed,
    // but a one-time check on mount is usually sufficient for a layout component.
  }, []);

  const handleRevert = async () => {
    setIsReverting(true);
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });
      // Clear local state and redirect to admin users list
      setIsImpersonating(false);
      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      console.error("Failed to revert impersonation", err);
      setIsReverting(false);
    }
  };

  if (!isImpersonating) return null;

  return (
    <div className="bg-amber-400 text-amber-950 px-4 py-2 text-xs font-bold flex flex-col sm:flex-row justify-center sm:justify-between items-center w-full z-[9999] shadow-sm gap-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="text-center sm:text-left">
          You are currently impersonating this user. All actions taken will affect their real account.
        </span>
      </div>
      <Button
        variant="default"
        size="sm"
        onClick={handleRevert}
        disabled={isReverting}
        className="bg-amber-950 text-amber-400 hover:bg-amber-900 shadow-sm text-[11px] h-7 px-3 py-0 whitespace-nowrap shrink-0"
      >
        {isReverting ? "Reverting..." : "Revert to Admin"}
      </Button>
    </div>
  );
}
