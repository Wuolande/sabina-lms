"use client";

import * as React from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (container: string | HTMLElement, options: Record<string, any>) => number;
      reset: (opt_widget_id?: number) => void;
    };
  }
}

interface UseReCaptchaOptions {
  action?: string;
  siteKey?: string;
}

export function useReCaptcha(options: UseReCaptchaOptions = {}) {
  const [siteKey, setSiteKey] = React.useState<string>(
    options.siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""
  );
  const [isReady, setIsReady] = React.useState(false);
  const [enabled, setEnabled] = React.useState(true);

  React.useEffect(() => {
    // Attempt to load active site key from public settings if not provided
    if (!siteKey) {
      fetch("/api/security/recaptcha-public")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.siteKey) {
            setSiteKey(data.siteKey);
            setEnabled(data.enabled ?? true);
          } else {
            setEnabled(false);
          }
        })
        .catch(() => setEnabled(false));
    }
  }, [siteKey]);

  React.useEffect(() => {
    if (!siteKey || !enabled || typeof window === "undefined") return;

    // Check if script is already present
    const scriptId = "google-recaptcha-v3-script";
    if (document.getElementById(scriptId)) {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => setIsReady(true));
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => setIsReady(true));
      }
    };
    script.onerror = () => {
      console.warn("[useReCaptcha] Failed to load Google reCAPTCHA script.");
    };
    document.head.appendChild(script);
  }, [siteKey, enabled]);

  const executeRecaptcha = React.useCallback(
    async (actionName: string = "submit"): Promise<string | null> => {
      if (!enabled || !siteKey || typeof window === "undefined" || !window.grecaptcha) {
        return null;
      }

      try {
        return await new Promise<string>((resolve, reject) => {
          window.grecaptcha?.ready(async () => {
            try {
              const token = await window.grecaptcha!.execute(siteKey, {
                action: actionName || options.action || "submit",
              });
              resolve(token);
            } catch (err) {
              reject(err);
            }
          });
        });
      } catch (err) {
        console.warn("[useReCaptcha] Execution error:", err);
        return null;
      }
    },
    [siteKey, enabled, options.action]
  );

  return {
    isReady,
    enabled,
    siteKey,
    executeRecaptcha,
  };
}
