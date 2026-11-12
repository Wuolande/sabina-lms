"use client";

/**
 * /lessons/[id]/classroom — SSR-Safe Entry Page with Resilient Error Boundary
 * -----------------------------------------------------------------------
 * LiveKit and browser WebRTC APIs crash during Next.js server-side
 * rendering because they rely on `window`, `navigator`, `RTCPeerConnection`
 * and other browser-only globals.
 *
 * This wrapper uses next/dynamic with { ssr: false } to ensure the full
 * classroom component is ONLY ever loaded and executed in the browser,
 * and includes a dedicated React ErrorBoundary to capture any runtime
 * exceptions gracefully without showing Next.js client-side exception crash.
 * -----------------------------------------------------------------------
 */

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ClassroomErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[Classroom Error Boundary Caught]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center space-y-5 shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Classroom Session Notice
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                The interactive video classroom encountered an unexpected browser exception while loading media devices.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-rose-300/90 text-left font-mono break-words max-h-24 overflow-y-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Classroom</span>
              </Button>
              <Link href="/student/lessons" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-700 hover:bg-slate-800 text-slate-300 text-xs flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>My Lessons</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
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
  return (
    <ClassroomErrorBoundary>
      <ClassroomClient />
    </ClassroomErrorBoundary>
  );
}
