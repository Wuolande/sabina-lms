"use client";

import * as React from "react";

interface ThemeSynchronizerProps {
  initialPrimary: string;
  initialSecondary: string;
}

export function ThemeSynchronizer({ initialPrimary, initialSecondary }: ThemeSynchronizerProps) {
  React.useEffect(() => {
    // 1. Immediately apply server-provided colors to documentElement
    if (initialPrimary) {
      document.documentElement.style.setProperty("--color-primary", initialPrimary);
    }
    if (initialSecondary) {
      document.documentElement.style.setProperty("--color-secondary", initialSecondary);
    }

    // 2. Poll/fetch fresh theme from /api/theme to guarantee real-time sync with admin changes
    fetch("/api/theme")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.primaryColor && /^#[0-9A-Fa-f]{6}$/.test(data.primaryColor)) {
          document.documentElement.style.setProperty("--color-primary", data.primaryColor);
        }
        if (data.secondaryColor && /^#[0-9A-Fa-f]{6}$/.test(data.secondaryColor)) {
          document.documentElement.style.setProperty("--color-secondary", data.secondaryColor);
        }
      })
      .catch(() => {});
  }, [initialPrimary, initialSecondary]);

  return null;
}
