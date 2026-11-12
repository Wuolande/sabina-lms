"use client";
import { useAuth } from "@payloadcms/ui";

/** Initials avatar used in the top bar. */
export function Avatar() {
  const { user } = useAuth<{ name?: string; email?: string }>();
  const name = user?.name || user?.email || "";
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  return <span className="ep-avatar" aria-hidden="true">{initials || "?"}</span>;
}
