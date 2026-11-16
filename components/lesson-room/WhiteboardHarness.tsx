"use client";
import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { Whiteboard, type BoardChannel, type BoardMsg, type WhiteboardHandle } from "./Whiteboard";
import { MiniBoardPanel, useMiniBoard, type MiniChannel, type MiniMsg } from "./MiniBoard";
import { SelfView } from "./LessonRoom";
import { SplitHandle, usePersisted } from "./resize";

/** Development only: the classroom's resizable layout with placeholder videos. */
function Layout() {
  const [sideW, setSideW] = usePersisted("sabina.room.sideW", 224);
  const [self, setSelf] = usePersisted("sabina.room.self", { corner: "br" as "tl" | "tr" | "bl" | "br", w: 240, hidden: false });
  const area = useRef<HTMLDivElement>(null);
  return (
    <div className="flex h-screen gap-1.5 bg-black p-4 text-white">
      <div ref={area} data-testid="stage" className="relative min-w-0 flex-1 rounded-[28px] bg-[#1c1c1e]">
        <SelfView track={null} avatar={null} state={self} onChange={setSelf} area={area} />
      </div>
      <SplitHandle value={sideW} onChange={setSideW} min={160} max={480} reset={224} label="Resize video column" grow={-1} />
      <div data-testid="side" className="flex shrink-0 flex-col gap-3" style={{ width: sideW }}>
        <div className="aspect-video rounded-2xl bg-[#2c2c2e]" />
        <div className="aspect-video rounded-2xl bg-[#2c2c2e]" />
      </div>
    </div>
  );
}
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

function Tools({ channel, role, onMini }: { channel: ToolsChannel; role: "tutor" | "student"; onMini?: (prompt: string) => void }) {
  const tools = useClassTools(channel, role, { student: "Amani L." });
  return (
    <div className="flex flex-col items-center gap-3">
      <ClassStatus tools={tools} studentName="Amani L." light />
      <ClassToolsMenu tools={tools} studentName="Amani L." onClose={() => undefined} light onMini={onMini} />
    </div>
  );
}

function Room({ board, tools, miniBoard, miniCtl, me, role }: { board: BoardChannel; tools: ToolsChannel; miniBoard: BoardChannel; miniCtl: MiniChannel; me: string; role: "tutor" | "student" }) {
  const main = useRef<WhiteboardHandle>(null);
  const miniRef = useRef<WhiteboardHandle>(null);
  const mini = useMiniBoard(miniCtl, role, miniRef);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 bg-slate-100 p-2 sm:p-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="h-[80vh]">
        <Whiteboard ref={main} channel={board} me={me} role={role} light onInsertImage={async (f) => URL.createObjectURL(f)} />
      </div>
      <Tools channel={tools} role={role} onMini={role === "tutor" ? mini.start : undefined} />
      <MiniBoardPanel mini={mini} channel={miniBoard} me={me} light onCopy={() => main.current?.paste(miniRef.current?.snapshot() ?? [], { x: 0.52, y: 0.52, w: 0.44, h: 0.44 })} />
    </div>
  );
}

/** Development only: the real board and class tools, synced between browser tabs instead of LiveKit. */
export function WhiteboardHarness({ room, me, layout = false }: { room: string; me: string; layout?: boolean }) {
  const [ready, setReady] = useState(false);
  const board = useTabChannel<BoardMsg>(`wb-${room}`) as BoardChannel | null;
  const tools = useTabChannel<ToolsMsg>(`tools-${room}`) as ToolsChannel | null;
  const miniBoard = useTabChannel<BoardMsg>(`mini-${room}`) as BoardChannel | null;
  const miniCtl = useTabChannel<MiniMsg>(`minictl-${room}`) as MiniChannel | null;
  useEffect(() => setReady(true), []);
  if (ready && layout) return <Layout />;
  if (!ready || !board || !tools || !miniBoard || !miniCtl) return null;
  const role = me === "student" || me === "late" ? "student" : "tutor";
  return <Room board={board} tools={tools} miniBoard={miniBoard} miniCtl={miniCtl} me={me} role={role} />;
}
