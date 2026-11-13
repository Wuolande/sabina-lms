"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, VideoTrack, useChat, useConnectionState, useDataChannel, useIsSpeaking, useLocalParticipant, useParticipants, useTrackToggle, useTracks, type TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { ConnectionState, Track, type Participant } from "livekit-client";
import { ArrowLeft, Disc, Loader2, MessageSquare, Mic, MicOff, MonitorUp, Paperclip, PenLine, PhoneOff, Send, Square, Video, VideoOff, WifiOff, X } from "lucide-react";
import { Whiteboard, type BoardChannel, type BoardMsg } from "./Whiteboard";
import { LessonFiles } from "./LessonFiles";
import { fmtDay, fmtTime } from "@/lib/time";

export type RoomLesson = {
  id: number;
  title: string;
  role: "student" | "tutor";
  other: { name: string; avatar: string | null };
  me: { name: string; avatar: string | null };
  startsAt: string;
  endsAt: string;
  joinOpensAt: string;
  joinClosesAt: string;
  tz: string;
};
export type RoomRecording = { available: boolean; status: string; consent: { student: boolean; tutor: boolean }; startedAt: string | null; ready: boolean };
/** Classroom events shared over the "room" data topic. */
type RoomMsg = { t: "board"; open: boolean } | { t: "files" } | { t: "rec-ask"; by: string } | { t: "rec"; state: RoomRecording } | { t: "rec-decline"; by: string };

const enc = new TextEncoder();
const dec = new TextDecoder();

/** The whiteboard's channel over LiveKit data messages (reliable delivery). */
function useBoardChannel(): BoardChannel {
  const subs = useRef(new Set<(m: BoardMsg) => void>());
  const { send } = useDataChannel("wb", (msg) => {
    try {
      const m = JSON.parse(dec.decode(msg.payload)) as BoardMsg;
      subs.current.forEach((cb) => cb(m));
    } catch {}
  });
  return useMemo(
    () => ({
      send: (m) => void send(enc.encode(JSON.stringify(m)), { reliable: true }).catch(() => undefined),
      subscribe: (cb) => {
        subs.current.add(cb);
        return () => subs.current.delete(cb);
      },
    }),
    [send],
  );
}

/* ------------------------------------------------------------------ helpers */

const font = { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif' };
const initials = (n: string) =>
  n
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 2)
    .toUpperCase();

function useNow(step = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), step);
    return () => clearInterval(t);
  }, [step]);
  return now;
}

function clock(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

function Avatar({ name, src, size }: { name: string; src: string | null; size: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="grid place-items-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(name)}
    </span>
  );
}

/** Round control, FaceTime-style: frosted when on, white when muted. */
function RoundButton({ on = true, danger, label, onClick, children, disabled, badge }: { on?: boolean; danger?: boolean; label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean; badge?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={danger ? undefined : !on}
      onClick={onClick}
      disabled={disabled}
      className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full transition active:scale-95 disabled:opacity-40 sm:h-14 sm:w-14 ${
        danger ? "bg-[#ff3b30] text-white hover:bg-[#ff453a]" : on ? "bg-white/15 text-white hover:bg-white/25" : "bg-white text-[#1c1c1e] hover:bg-white/90"
      }`}
    >
      {children}
      {badge && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#0a84ff] ring-2 ring-[#1c1c1e]" />}
    </button>
  );
}

/* ------------------------------------------------------------------ lobby */

function Lobby({ lesson, mic, cam, setMic, setCam, onJoin, joining, error }: { lesson: RoomLesson; mic: boolean; cam: boolean; setMic: (v: boolean) => void; setCam: (v: boolean) => void; onJoin: () => void; joining: boolean; error: string | null }) {
  const video = useRef<HTMLVideoElement>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const now = useNow();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    if (cam && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 1280, height: 720, facingMode: "user" }, audio: false })
        .then((s) => {
          if (cancelled) return s.getTracks().forEach((t) => t.stop());
          stream = s;
          setCamError(null);
          if (video.current) video.current.srcObject = s;
        })
        .catch(() => setCamError("We can't reach your camera. Check your browser's permissions."));
    }
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [cam]);

  const opens = Date.parse(lesson.joinOpensAt);
  const open = now != null && now >= opens && now <= Date.parse(lesson.joinClosesAt);
  const startsIn = now != null ? Date.parse(lesson.startsAt) - now : null;
  const day = fmtDay(lesson.startsAt, lesson.tz, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#000] text-white" style={font}>
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href={lesson.role === "tutor" ? "/tutor/lessons" : "/student/lessons"} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
          <ArrowLeft size={16} /> Lessons
        </Link>
        <span className="text-sm text-white/50">{lesson.tz.replace(/_/g, " ")}</span>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-4 pb-10 sm:px-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
        <div className="relative aspect-video w-full overflow-hidden rounded-[28px] bg-[#1c1c1e] shadow-2xl ring-1 ring-white/10">
          {cam && !camError ? (
            <video ref={video} autoPlay playsInline muted className="h-full w-full -scale-x-100 object-cover" />
          ) : (
            <div className="grid h-full place-items-center">
              <div className="flex flex-col items-center gap-3 text-white/60">
                <Avatar name={lesson.me.name} src={lesson.me.avatar} size={88} />
                <p className="text-sm">{camError ?? "Camera off"}</p>
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 bg-gradient-to-t from-black/60 to-transparent p-4">
            <RoundButton label={mic ? "Turn mic off" : "Turn mic on"} on={mic} onClick={() => setMic(!mic)}>
              {mic ? <Mic size={22} /> : <MicOff size={22} />}
            </RoundButton>
            <RoundButton label={cam ? "Turn camera off" : "Turn camera on"} on={cam} onClick={() => setCam(!cam)}>
              {cam ? <Video size={22} /> : <VideoOff size={22} />}
            </RoundButton>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Avatar name={lesson.other.name} src={lesson.other.avatar} size={52} />
            <div className="min-w-0">
              <p className="text-sm text-white/60">{lesson.role === "student" ? "Your tutor" : "Your student"}</p>
              <p className="truncate text-lg font-semibold">{lesson.other.name}</p>
            </div>
          </div>
          <div>
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]">{lesson.title}</h1>
            <p className="mt-2 text-white/60">
              {day} · {fmtTime(lesson.startsAt, lesson.tz)} – {fmtTime(lesson.endsAt, lesson.tz)}
            </p>
          </div>
          {error && (
            <p role="alert" className="rounded-2xl bg-[#ff3b30]/15 px-4 py-3 text-sm text-[#ff9f9a]">
              {error}
            </p>
          )}
          <div className="space-y-3">
            <button
              type="button"
              onClick={onJoin}
              disabled={!open || joining}
              className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0a84ff] text-[17px] font-semibold text-white transition hover:bg-[#409cff] active:scale-[0.99] disabled:bg-white/10 disabled:text-white/40"
            >
              {joining && <Loader2 size={18} className="animate-spin" />}
              {open ? "Join lesson" : `Opens at ${fmtTime(opens, lesson.tz)}`}
            </button>
            <p className="text-center text-sm text-white/50">
              {now == null ? " " : open ? (startsIn != null && startsIn > 0 ? `Starts in ${clock(startsIn)}. You can go in now.` : "The lesson has started.") : startsIn != null && startsIn < 86400_000 ? `The classroom opens ${Math.round((Date.parse(lesson.startsAt) - opens) / 60000)} minutes before the start.` : "Come back a few minutes before the start."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ room */

type TileProps = { track: TrackReferenceOrPlaceholder | null; name: string; avatar: string | null; big?: boolean; mirror?: boolean };

/** Speaking indicator needs a participant; tiles without one (nobody there yet) skip it. */
function Tile(props: TileProps) {
  return props.track?.participant ? <SpeakingTile {...props} participant={props.track.participant} /> : <TileView {...props} speaking={false} />;
}
function SpeakingTile({ participant, ...props }: TileProps & { participant: Participant }) {
  return <TileView {...props} speaking={useIsSpeaking(participant)} />;
}

function TileView({ track, name, avatar, big, mirror, speaking }: TileProps & { speaking: boolean }) {
  const live = track && "publication" in track && track.publication && !track.publication.isMuted;
  const micOff = track?.participant && !track.participant.isMicrophoneEnabled;
  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#1c1c1e] ${big ? "rounded-[28px]" : "rounded-2xl"} ring-2 transition ${speaking ? "ring-[#30d158]" : "ring-white/5"}`}>
      {live ? (
        <VideoTrack trackRef={track as never} className={`h-full w-full ${track!.source === Track.Source.ScreenShare ? "object-contain" : "object-cover"} ${mirror ? "-scale-x-100" : ""}`} />
      ) : (
        <div className="grid h-full place-items-center">
          <Avatar name={name} src={avatar} size={big ? 112 : 56} />
        </div>
      )}
      <span className={`absolute bottom-3 left-3 inline-flex max-w-[80%] items-center gap-1.5 truncate rounded-full bg-black/45 px-2.5 py-1 font-medium text-white backdrop-blur-md ${big ? "text-sm" : "text-xs"}`}>
        {micOff && <MicOff size={12} className="shrink-0 text-[#ff453a]" />}
        {name}
      </span>
    </div>
  );
}

function Chat({ onClose, me }: { onClose: () => void; me: string }) {
  const { chatMessages, send, isSending } = useChat();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [chatMessages.length]);
  return (
    <aside className="fixed inset-0 z-40 flex flex-col bg-[#1c1c1e]/95 backdrop-blur-2xl sm:inset-y-4 sm:left-auto sm:right-4 sm:w-[22rem] sm:rounded-[24px] sm:ring-1 sm:ring-white/10" aria-label="Chat">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-[17px] font-semibold">Chat</h2>
        <button type="button" onClick={onClose} aria-label="Close chat" className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4">
        {chatMessages.length === 0 && <p className="px-2 pt-6 text-center text-sm text-white/40">Messages here are only seen by people in this lesson.</p>}
        {chatMessages.map((m) => {
          const mine = m.from?.isLocal;
          return (
            <div key={m.id ?? m.timestamp} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {!mine && <span className="mb-0.5 px-3 text-xs text-white/40">{m.from?.name ?? "Guest"}</span>}
              <p className={`max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] px-3.5 py-2 text-[15px] ${mine ? "bg-[#0a84ff] text-white" : "bg-white/10 text-white"}`}>{m.message}</p>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form
        className="flex items-center gap-2 p-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          await send(text.trim());
          setText("");
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message as ${me}`} aria-label="Message" className="h-11 min-w-0 flex-1 rounded-full border-0 bg-white/10 px-4 text-[15px] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0a84ff]" />
        <button type="submit" disabled={!text.trim() || isSending} aria-label="Send" className="grid h-11 w-11 place-items-center rounded-full bg-[#0a84ff] disabled:opacity-40">
          <Send size={17} />
        </button>
      </form>
    </aside>
  );
}

function FilesPanel({ lessonId, onClose, refreshKey, onShared }: { lessonId: number; onClose: () => void; refreshKey: number; onShared: () => void }) {
  return (
    <aside className="fixed inset-0 z-40 flex flex-col bg-[#1c1c1e]/95 backdrop-blur-2xl sm:inset-y-4 sm:left-auto sm:right-4 sm:w-[22rem] sm:rounded-[24px] sm:ring-1 sm:ring-white/10" aria-label="Lesson files">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-[17px] font-semibold">Lesson files</h2>
        <button type="button" onClick={onClose} aria-label="Close files" className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <LessonFiles lessonId={lessonId} dark refreshKey={refreshKey} onShared={onShared} />
      </div>
    </aside>
  );
}

/** Asked to agree to recording (both people must agree before anything is recorded). */
function RecordAsk({ by, onAnswer, busy }: { by: string; onAnswer: (yes: boolean) => void; busy: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="rec-ask-title">
      <div className="w-full max-w-sm rounded-[28px] bg-[#1c1c1e] p-6 text-center ring-1 ring-white/10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#ff453a]/15 text-[#ff453a]">
          <Disc size={26} />
        </span>
        <h2 id="rec-ask-title" className="mt-4 text-lg font-semibold">
          {by} would like to record this lesson
        </h2>
        <p className="mt-2 text-sm text-white/60">The recording is kept privately for the two of you to watch again. Nothing is recorded unless you agree, and either of you can stop it.</p>
        <div className="mt-6 grid gap-2">
          <button type="button" disabled={busy} onClick={() => onAnswer(true)} className="h-12 rounded-full bg-[#ff453a] font-semibold text-white disabled:opacity-60">
            Allow recording
          </button>
          <button type="button" disabled={busy} onClick={() => onAnswer(false)} className="h-12 rounded-full bg-white/10 font-semibold text-white hover:bg-white/15">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaveSheet({ lesson, onLeave, onClose }: { lesson: RoomLesson; onLeave: (finished: boolean) => void; onClose: () => void }) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function finish() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/lessons/${lesson.id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "finish", notes }) }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (res?.ok) onLeave(true);
    else setError(d.error || "We couldn't finish the lesson. Try again.");
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Leave lesson" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-[24px] bg-[#2c2c2e] text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {lesson.role === "tutor" ? (
          <div className="p-5">
            <h2 className="text-[17px] font-semibold">Finish the lesson?</h2>
            <p className="mt-1 text-sm text-white/60">Add a few notes for {lesson.other.name.split(" ")[0]}: what you covered and what to practise.</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={2000} placeholder="Today we worked on…" aria-label="Notes for the student" className="mt-3 w-full rounded-2xl border-0 bg-white/10 px-3.5 py-3 text-[15px] text-white placeholder:text-white/35 focus:ring-2 focus:ring-[#0a84ff]" />
            {error && <p className="mt-2 text-sm text-[#ff9f9a]">{error}</p>}
          </div>
        ) : (
          <div className="p-5 text-center">
            <h2 className="text-[17px] font-semibold">Leave the lesson?</h2>
            <p className="mt-1 text-sm text-white/60">You can come back in until {fmtTime(lesson.joinClosesAt, lesson.tz)}.</p>
          </div>
        )}
        <div className="divide-y divide-white/10 border-t border-white/10 text-[17px]">
          {lesson.role === "tutor" && (
            <button type="button" onClick={finish} disabled={busy} className="flex h-14 w-full items-center justify-center gap-2 font-semibold text-[#0a84ff] hover:bg-white/5 disabled:opacity-50">
              {busy && <Loader2 size={17} className="animate-spin" />} Finish lesson
            </button>
          )}
          <button type="button" onClick={() => onLeave(false)} className="h-14 w-full text-[#ff453a] hover:bg-white/5">
            {lesson.role === "tutor" ? "Leave without finishing" : "Leave"}
          </button>
          <button type="button" onClick={onClose} className="h-14 w-full font-semibold hover:bg-white/5">
            Stay
          </button>
        </div>
      </div>
    </div>
  );
}

function Stage({ lesson, onLeave, initialRecording }: { lesson: RoomLesson; onLeave: (finished: boolean) => void; initialRecording: RoomRecording }) {
  const state = useConnectionState();
  const now = useNow();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const mic = useTrackToggle({ source: Track.Source.Microphone });
  const cam = useTrackToggle({ source: Track.Source.Camera });
  const screen = useTrackToggle({ source: Track.Source.ScreenShare });
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  const { chatMessages } = useChat();
  const [chatOpen, setChatOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [filesKey, setFilesKey] = useState(0);
  const [filesNew, setFilesNew] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [rec, setRec] = useState<RoomRecording>(initialRecording);
  const [askFrom, setAskFrom] = useState<string | null>(null);
  const [recBusy, setRecBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const board = useBoardChannel();
  const myName = lesson.me.name.split(" ")[0] ?? "Someone";
  const { send: sendRoom } = useDataChannel("room", (msg) => {
    let m: RoomMsg;
    try {
      m = JSON.parse(dec.decode(msg.payload)) as RoomMsg;
    } catch {
      return;
    }
    if (m.t === "board") setBoardOpen(m.open);
    else if (m.t === "files") {
      setFilesKey((k) => k + 1);
      setFilesNew(true);
    } else if (m.t === "rec-ask") setAskFrom(m.by);
    else if (m.t === "rec") {
      setRec(m.state);
      setAskFrom(null);
    } else if (m.t === "rec-decline") setNotice(`${m.by} would rather not record this lesson.`);
  });
  const room = useCallback((m: RoomMsg) => void sendRoom(enc.encode(JSON.stringify(m)), { reliable: true }).catch(() => undefined), [sendRoom]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  async function recCall(action: "consent" | "decline" | "stop") {
    setRecBusy(true);
    const res = await fetch(`/api/lessons/${lesson.id}/recording`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as RoomRecording & { error?: string };
    setRecBusy(false);
    if (!res?.ok) {
      setNotice(d.error || "Recording didn't work. The lesson carries on as normal.");
      return null;
    }
    setRec(d);
    room({ t: "rec", state: d });
    return d;
  }
  async function askToRecord() {
    const d = await recCall("consent");
    if (d && d.status !== "recording") {
      room({ t: "rec-ask", by: myName });
      setNotice(`Asked ${lesson.other.name.split(" ")[0]} to agree. Recording starts when they do.`);
    }
  }
  const [seen, setSeen] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const unread = !chatOpen && chatMessages.length > seen;
  useEffect(() => {
    if (chatOpen) setSeen(chatMessages.length);
  }, [chatOpen, chatMessages.length]);

  const share = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const remoteCam = tracks.find((t) => t.source === Track.Source.Camera && !t.participant.isLocal) ?? null;
  const localCam = tracks.find((t) => t.source === Track.Source.Camera && t.participant.isLocal) ?? null;
  const otherHere = participants.some((p) => !p.isLocal);
  const end = Date.parse(lesson.endsAt);
  const start = Date.parse(lesson.startsAt);
  const timer = now == null ? "" : now < start ? `Starts in ${clock(start - now)}` : now < end ? `${clock(end - now)} left` : `Over by ${clock(now - end)}`;
  const canShare = typeof navigator !== "undefined" && !!navigator.mediaDevices && "getDisplayMedia" in navigator.mediaDevices;

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-black text-white" style={font}>
      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-5">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2.5 rounded-full bg-[#1c1c1e]/70 py-1.5 pl-1.5 pr-4 backdrop-blur-xl">
          <Avatar name={lesson.other.name} src={lesson.other.avatar} size={30} />
          <span className="min-w-0 truncate text-sm font-medium">{lesson.title}</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          {rec.status === "recording" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff453a]/20 px-3 py-1.5 text-sm font-semibold text-[#ff6961] backdrop-blur-xl" role="status">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff453a]" /> Recording
            </span>
          )}
          {state === ConnectionState.Reconnecting && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff9f0a]/20 px-3 py-1.5 text-sm text-[#ffd60a] backdrop-blur-xl">
              <WifiOff size={14} /> Reconnecting…
            </span>
          )}
          <span className={`rounded-full bg-[#1c1c1e]/70 px-3 py-1.5 text-sm tabular-nums backdrop-blur-xl ${now != null && now > end ? "text-[#ff9f0a]" : "text-white/80"}`}>{timer}</span>
        </div>
      </div>

      {/* Stage */}
      <div className="flex min-h-0 flex-1 gap-3 p-3 pb-28 pt-16 sm:p-5 sm:pb-32 sm:pt-20">
        {boardOpen ? (
          <>
            <div className="min-w-0 flex-1">
              <Whiteboard
                channel={board}
                me={`${lesson.role}`}
                onClose={() => {
                  setBoardOpen(false);
                  room({ t: "board", open: false });
                }}
              />
            </div>
            <div className="hidden w-56 shrink-0 flex-col gap-3 lg:flex">
              <div className="aspect-video">
                <Tile track={remoteCam} name={lesson.other.name} avatar={lesson.other.avatar} />
              </div>
              <div className="aspect-video">
                <Tile track={localCam} name="You" avatar={lesson.me.avatar} mirror />
              </div>
            </div>
          </>
        ) : share ? (
          <>
            <div className="min-w-0 flex-1">
              <Tile track={share} name={`${share.participant.isLocal ? "You" : share.participant.name} · screen`} avatar={null} big />
            </div>
            <div className="hidden w-56 shrink-0 flex-col gap-3 md:flex">
              <div className="aspect-video">
                <Tile track={remoteCam} name={lesson.other.name} avatar={lesson.other.avatar} />
              </div>
              <div className="aspect-video">
                <Tile track={localCam} name="You" avatar={lesson.me.avatar} mirror />
              </div>
            </div>
          </>
        ) : (
          <div className="relative min-w-0 flex-1">
            {otherHere ? (
              <Tile track={remoteCam} name={lesson.other.name} avatar={lesson.other.avatar} big />
            ) : (
              <div className="grid h-full place-items-center rounded-[28px] bg-[#1c1c1e]">
                <div className="flex flex-col items-center gap-4 px-6 text-center">
                  <Avatar name={lesson.other.name} src={lesson.other.avatar} size={96} />
                  <p className="text-lg font-medium">Waiting for {lesson.other.name.split(" ")[0]}…</p>
                  <p className="max-w-xs text-sm text-white/50">{state === ConnectionState.Connected ? "You're in. They'll appear here as soon as they join." : "Connecting to the classroom…"}</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 right-3 aspect-[3/4] w-28 shadow-2xl sm:aspect-video sm:w-60">
              <Tile track={localCam} name="You" avatar={lesson.me.avatar} mirror />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6">
        <div className="flex items-center gap-1.5 rounded-full bg-[#1c1c1e]/80 p-2 shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl sm:gap-3 sm:p-3">
          <RoundButton label={mic.enabled ? "Turn mic off" : "Turn mic on"} on={mic.enabled} onClick={() => void mic.toggle()}>
            {mic.enabled ? <Mic size={22} /> : <MicOff size={22} />}
          </RoundButton>
          <RoundButton label={cam.enabled ? "Turn camera off" : "Turn camera on"} on={cam.enabled} onClick={() => void cam.toggle()}>
            {cam.enabled ? <Video size={22} /> : <VideoOff size={22} />}
          </RoundButton>
          {canShare && (
            <span className="hidden sm:block">
              <RoundButton label={screen.enabled ? "Stop sharing" : "Share screen"} on={!screen.enabled} onClick={() => void screen.toggle()}>
                <MonitorUp size={22} />
              </RoundButton>
            </span>
          )}
          <RoundButton
            label={boardOpen ? "Close whiteboard" : "Whiteboard"}
            on={!boardOpen}
            onClick={() => {
              setBoardOpen(!boardOpen);
              room({ t: "board", open: !boardOpen });
            }}
          >
            <PenLine size={21} />
          </RoundButton>
          <RoundButton
            label="Lesson files"
            onClick={() => {
              setFilesOpen(!filesOpen);
              setChatOpen(false);
              setFilesNew(false);
            }}
            badge={filesNew && !filesOpen}
          >
            <Paperclip size={21} />
          </RoundButton>
          {rec.available && (
            <RoundButton label={rec.status === "recording" ? "Stop recording" : "Record lesson"} on={rec.status !== "recording"} disabled={recBusy} onClick={() => void (rec.status === "recording" ? recCall("stop") : askToRecord())}>
              {rec.status === "recording" ? <Square size={19} className="fill-current" /> : <Disc size={21} />}
            </RoundButton>
          )}
          <RoundButton label="Chat" onClick={() => (setChatOpen(!chatOpen), setFilesOpen(false))} badge={unread}>
            <MessageSquare size={21} />
          </RoundButton>
          <RoundButton label="Leave" danger onClick={() => setLeaving(true)}>
            <PhoneOff size={22} />
          </RoundButton>
        </div>
      </div>

      {chatOpen && <Chat onClose={() => setChatOpen(false)} me={localParticipant.name || "you"} />}
      {filesOpen && <FilesPanel lessonId={lesson.id} refreshKey={filesKey} onClose={() => setFilesOpen(false)} onShared={() => room({ t: "files" })} />}
      {askFrom && (
        <RecordAsk
          by={askFrom}
          busy={recBusy}
          onAnswer={async (yes) => {
            if (yes) await recCall("consent");
            else {
              await recCall("decline");
              room({ t: "rec-decline", by: myName });
            }
            setAskFrom(null);
          }}
        />
      )}
      {notice && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4" role="status">
          <p className="rounded-full bg-[#1c1c1e]/90 px-4 py-2 text-sm text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">{notice}</p>
        </div>
      )}
      {leaving && <LeaveSheet lesson={lesson} onClose={() => setLeaving(false)} onLeave={onLeave} />}
      <RoomAudioRenderer />
    </div>
  );
}

/* ------------------------------------------------------------------ after */

function Left({ lesson, finished, onRejoin }: { lesson: RoomLesson; finished: boolean; onRejoin: () => void }) {
  const now = useNow(15_000);
  const canRejoin = !finished && now != null && now <= Date.parse(lesson.joinClosesAt);
  const home = lesson.role === "tutor" ? "/tutor/lessons" : "/student/lessons";
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-black px-6 text-center text-white" style={font}>
      <div className="max-w-sm">
        <Avatar name={lesson.other.name} src={lesson.other.avatar} size={72} />
        <h1 className="mt-5 text-[28px] font-semibold tracking-tight">{finished ? "Lesson finished" : "You left the lesson"}</h1>
        <p className="mt-2 text-white/60">{finished ? `Your notes have been sent to ${lesson.other.name.split(" ")[0]}.` : canRejoin ? `You can go back in until ${fmtTime(lesson.joinClosesAt, lesson.tz)}.` : "The classroom is now closed."}</p>
        <div className="mt-8 space-y-3">
          {canRejoin && (
            <button type="button" onClick={onRejoin} className="h-[52px] w-full rounded-full bg-[#0a84ff] text-[17px] font-semibold hover:bg-[#409cff]">
              Rejoin
            </button>
          )}
          <Link href={lesson.role === "student" ? `/lessons/${lesson.id}` : home} className="flex h-[52px] w-full items-center justify-center rounded-full bg-white/10 text-[17px] font-semibold hover:bg-white/15">
            {lesson.role === "student" ? "Lesson details" : "Back to lessons"}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ root */

export function LessonRoom({ lesson }: { lesson: RoomLesson }) {
  const [stage, setStage] = useState<"lobby" | "room" | "left">("lobby");
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [conn, setConn] = useState<{ token: string; url: string; recording: RoomRecording } | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const join = useCallback(async () => {
    setJoining(true);
    setError(null);
    const res = await fetch(`/api/lessons/${lesson.id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "join" }) }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { token?: string; url?: string; recording?: RoomRecording; error?: string };
    setJoining(false);
    if (!res?.ok || !d.token || !d.url) return setError(d.error || "We couldn't open the classroom. Check your connection and try again.");
    setConn({ token: d.token, url: d.url, recording: d.recording ?? { available: false, status: "none", consent: { student: false, tutor: false }, startedAt: null, ready: false } });
    setStage("room");
  }, [lesson.id]);

  const options = useMemo(() => ({ adaptiveStream: true, dynacast: true }), []);

  if (stage === "left") return <Left lesson={lesson} finished={finished} onRejoin={() => void join()} />;
  if (stage === "room" && conn)
    return (
      <LiveKitRoom
        serverUrl={conn.url}
        token={conn.token}
        connect
        audio={mic}
        video={cam}
        options={options}
        onDisconnected={() => setStage((s) => (s === "room" ? "left" : s))}
        onError={() => {
          setStage("lobby");
          setError("We couldn't connect to the classroom. Check your internet and try again.");
        }}
        onMediaDeviceFailure={() => setError("We couldn't use your camera or mic. You can still join and fix it from the controls.")}
      >
        <Stage
          lesson={lesson}
          initialRecording={conn.recording}
          onLeave={(done) => {
            setFinished(done);
            setStage("left");
          }}
        />
      </LiveKitRoom>
    );
  return <Lobby lesson={lesson} mic={mic} cam={cam} setMic={setMic} setCam={setCam} onJoin={() => void join()} joining={joining} error={error} />;
}
