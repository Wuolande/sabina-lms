import { WifiOff } from "lucide-react";

export const metadata = { title: "You're offline", robots: { index: false } };

/** Shown by the app when there's no connection and the page wasn't saved. */
export default function OfflinePage() {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-slate-50 px-4">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200">
          <WifiOff size={28} />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-bold text-slate-900">You&apos;re offline</h1>
        <p className="mt-2 text-slate-600">Check your Wi-Fi or mobile data. Pages you&apos;ve opened recently, like your lessons and messages, still open while you&apos;re offline.</p>
        <a href="/student" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-700 px-5 font-semibold text-white hover:bg-brand-800">
          Try again
        </a>
      </div>
    </div>
  );
}
