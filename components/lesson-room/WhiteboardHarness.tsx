"use client";
import { useEffect, useMemo, useState } from "react";
import { Whiteboard, type BoardChannel, type BoardMsg } from "./Whiteboard";
import { ClassStatus, ClassToolsMenu, useClassTools, type ToolsChannel, type ToolsMsg } from "./ClassTools";

function useTabChannel<M>(name: string) {
  return useMemo(() => {
    if (typeof window === "undefined") return null;
    const bc = new BroadcastChannel(name);
    const subs = new Set<(m: M) => void>();
    bc.onmessage = (e) => subs.forEach((cb) => cb(e.data as M));
    return {
      send: (m: M) => bc.postMessage(m),
      subscribe: (cb: (m: M) => void) => {
        subs.add(cb);
        return () => {
          subs.delete(cb);
        };
      },
    };
  }, [name]);
}

function Tools({ channel, role }: { channel: ToolsChannel; role: "tutor" | "student" }) {
  const tools = useClassTools(channel, role, { student: "Amani L." });
  return (
    <div className="flex flex-col items-center gap-3">
      <ClassStatus tools={tools} studentName="Amani L." light />
      <ClassToolsMenu tools={tools} studentName="Amani L." onClose={() => undefined} light />
    </div>
  );
}

/** Development only: the real board and class tools, synced between browser tabs instead of LiveKit. */
export function WhiteboardHarness({ room, me }: { room: string; me: string }) {
  const [ready, setReady] = useState(false);
  const board = useTabChannel<BoardMsg>(`wb-${room}`) as BoardChannel | null;
  const tools = useTabChannel<ToolsMsg>(`tools-${room}`) as ToolsChannel | null;
  useEffect(() => setReady(true), []);
  if (!ready || !board || !tools) return null;
  const role = me === "student" || me === "late" ? "student" : "tutor";
  return (
    <div className="grid gap-4 bg-slate-100 p-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="h-[80vh]">
        <Whiteboard channel={board} me={me} role={role} light onInsertImage={async (f) => URL.createObjectURL(f)} />
      </div>
      <Tools channel={tools} role={role} />
    </div>
  );
}
