"use client";
import { useEffect, useState } from "react";
import { Download, Share, WifiOff, X } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const DISMISSED = "sabina.install.dismissed";

/** Registers the service worker (offline pages + push). Production only, unless testing. */
export function useServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let testing = false;
    try {
      testing = localStorage.getItem("sabina.sw") === "1";
    } catch {}
    if (process.env.NODE_ENV !== "production" && !testing) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);
}

/** A thin bar while the device has no connection. */
export function OfflineBar() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white">
      <WifiOff size={15} className="shrink-0" /> You&apos;re offline. You can still read pages you opened recently.
    </div>
  );
}

/**
 * "Install the app" card: uses the browser's install prompt where there is one (Android, Chrome,
 * Edge) and shows the Share → Add to Home Screen steps on iPhone and iPad. Hidden once installed
 * or dismissed.
 */
export function InstallCard() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = Number(localStorage.getItem(DISMISSED) ?? 0) > Date.now() - 30 * 86400_000;
    } catch {}
    if (standalone || dismissed) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    if (isIos) {
      setIos(true);
      setShow(true);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
      setShow(true);
    };
    const onInstalled = () => setShow(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!show) return null;
  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISSED, String(Date.now()));
    } catch {}
  };
  return (
    <aside aria-label="Install the app" className="mb-6 flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">Add Sabina to your home screen</p>
        {ios ? (
          <p className="mt-0.5 text-sm text-slate-600">
            Tap <Share size={14} className="inline -translate-y-0.5" aria-label="Share" /> in Safari, then <b>Add to Home Screen</b>. It opens like an app and can send lesson reminders.
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-slate-600">Opens like an app, loads faster and keeps your lessons handy on a weak connection.</p>
        )}
        {event && (
          <button
            type="button"
            onClick={async () => {
              await event.prompt();
              const choice = await event.userChoice.catch(() => null);
              if (choice?.outcome !== "accepted") dismiss();
              setShow(false);
            }}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <Download size={16} /> Install
          </button>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label="Not now" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
        <X size={16} />
      </button>
    </aside>
  );
}
