"use client";

/**
 * /lessons/[id]/classroom — SSR-Safe Entry Page
 * -----------------------------------------------------------------------
 * LiveKit and browser WebRTC APIs crash during Next.js server-side
 * rendering because they rely on `window`, `navigator`, `RTCPeerConnection`
 * and other browser-only globals.
 *
 * This wrapper uses next/dynamic with { ssr: false } to ensure the full
 * classroom component is ONLY ever loaded and executed in the browser,
 * preventing the "Application error: a client-side exception has occurred"
 * on Vercel.
 *
 * NOTE: "use client" is required here because next/dynamic with ssr:false
 * can only be used inside Client Components.
 * -----------------------------------------------------------------------
 */

import dynamic from "next/dynamic";

// Full-screen loading skeleton shown while the classroom JS bundle loads
function ClassroomLoadingSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-base font-bold tracking-tight">
          Connecting to Live Interactive Classroom...
        </h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          Loading collaborative whiteboard, video engine, and teaching tools
        </p>
      </div>
    </div>
  );
}

// Dynamically import the full classroom with SSR disabled.
// This is the critical fix — LiveKit's WebRTC APIs are browser-only.
const ClassroomClient = dynamic(
  () => import("./ClassroomClient"),
  {
    ssr: false,
    loading: ClassroomLoadingSkeleton,
  }
);

export default function LiveClassroomPage() {
  return <ClassroomClient />;
}
