"use client";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// The last page sent, so a page is never counted twice (React may run effects twice).
let last = { key: "", at: 0 };

/** Sends one page view per page to Sabina's own analytics (/api/a). No third-party scripts. */
export function Tracker() {
  const pathname = usePathname();
  const params = useSearchParams();
  const first = useRef(true);
  useEffect(() => {
    if (!pathname || navigator.doNotTrack === "1") return;
    const key = `${pathname}?${params.toString()}`;
    if (last.key === key && Date.now() - last.at < 1500) return;
    last = { key, at: Date.now() };
    const body = JSON.stringify({
      p: pathname,
      r: first.current ? document.referrer : "",
      us: params.get("utm_source") ?? undefined,
      um: params.get("utm_medium") ?? undefined,
      uc: params.get("utm_campaign") ?? undefined,
    });
    first.current = false;
    try {
      if (!navigator.sendBeacon?.("/api/a", new Blob([body], { type: "application/json" }))) throw new Error("no beacon");
    } catch {
      void fetch("/api/a", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true, credentials: "include" }).catch(() => undefined);
    }
  }, [pathname, params]);
  return null;
}
