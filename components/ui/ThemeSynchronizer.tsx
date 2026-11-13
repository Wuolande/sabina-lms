"use client";

import * as React from "react";

interface ThemeSynchronizerProps {
  initialPrimary: string;
  initialSecondary: string;
}

/** Applies the brand colours from Site settings (passed in by the layout on every page load). */
export function ThemeSynchronizer({ initialPrimary, initialSecondary }: ThemeSynchronizerProps) {
  React.useEffect(() => {
    const ok = (c: string) => /^#[0-9A-Fa-f]{6}$/.test(c);
    if (initialPrimary && ok(initialPrimary)) document.documentElement.style.setProperty("--color-primary", initialPrimary);
    if (initialSecondary && ok(initialSecondary)) document.documentElement.style.setProperty("--color-secondary", initialSecondary);
  }, [initialPrimary, initialSecondary]);

  return null;
}
