"use client";
import { useEffect, useMemo, useState } from "react";
import { Whiteboard, type BoardChannel, type BoardMsg } from "./Whiteboard";

/** Development only: the real whiteboard, synced between browser tabs instead of LiveKit. */
export function WhiteboardHarness({ room, me }: { room: string; me: string }) {
  const [ready, setReady] = useState(false);
  const channel = useMemo<BoardChannel | null>(() => {
    if (typeof window === "undefined") return null;
    const bc = new BroadcastChannel(`wb-${room}`);
    const subs = new Set<(m: BoardMsg) => void>();
    bc.onmessage = (e) => subs.forEach((cb) => cb(e.data as BoardMsg));
    return {
      send: (m) => bc.postMessage(m),
      subscribe: (cb) => {
        subs.add(cb);
        return () => subs.delete(cb);
      },
    };
  }, [room]);
  useEffect(() => setReady(true), []);
  if (!ready || !channel) return null;
  return (
    <div className="h-[80vh] bg-slate-100 p-4">
      <Whiteboard channel={channel} me={me} light />
    </div>
  );
}
