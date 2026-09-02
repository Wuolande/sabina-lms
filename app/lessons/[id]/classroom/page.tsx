"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "@livekit/components-styles";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  MessageSquare,
  FileText,
  PhoneOff,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  Send,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { lessonService } from "@/services/lessonService";
import { Lesson360Aggregate } from "@/src/modules/lessons/domain/types";
import { formatTime } from "@/lib/utils";
import { VideoProviderType } from "@/src/modules/video/types/videoProviderTypes";

// ─── Provider display metadata ─────────────────────────────────────────────────
const PROVIDER_META: Record<
  VideoProviderType,
  { label: string; color: string; bgColor: string; borderColor: string; icon: string }
> = {
  livekit: {
    label: "Livekit Classroom",
    color: "text-indigo-300",
    bgColor: "bg-indigo-900/30",
    borderColor: "border-indigo-700/50",
    icon: "🎥",
  },
  classin: {
    label: "ClassIn Classroom",
    color: "text-blue-300",
    bgColor: "bg-blue-900/30",
    borderColor: "border-blue-700/50",
    icon: "📚",
  },
  google_meet: {
    label: "Google Meet",
    color: "text-emerald-300",
    bgColor: "bg-emerald-900/30",
    borderColor: "border-emerald-700/50",
    icon: "📹",
  },
  zoom: {
    label: "Zoom Meeting",
    color: "text-sky-300",
    bgColor: "bg-sky-900/30",
    borderColor: "border-sky-700/50",
    icon: "💻",
  },
};

export default function LiveClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [lesson, setLesson] = React.useState<Lesson360Aggregate | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Provider state
  const [activeProvider, setActiveProvider] = React.useState<VideoProviderType>("livekit");

  // Livekit state
  const [livekitToken, setLivekitToken] = React.useState<string>("");
  const [livekitUrl, setLivekitUrl] = React.useState<string>("");

  // External provider state
  const [joinUrl, setJoinUrl] = React.useState<string>("");
  const [joinLoading, setJoinLoading] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);

  // Classroom Side Panel
  const [sidePanelOpen, setSidePanelOpen] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"chat" | "notes" | "files">("chat");

  // In-class chat
  const [chatMessages, setChatMessages] = React.useState<
    Array<{ sender: string; text: string; time: string }>
  >([
    {
      sender: "System",
      text: "Live classroom session initialized.",
      time: "09:00 AM",
    },
  ]);
  const [chatInput, setChatInput] = React.useState("");

  // End Lesson Modal
  const [isEndModalOpen, setIsEndModalOpen] = React.useState(false);
  const [feedbackNotes, setFeedbackNotes] = React.useState("");
  const [isEnding, setIsEnding] = React.useState(false);

  // Timer
  const [secondsRemaining, setSecondsRemaining] = React.useState(50 * 60);

  // ─── Initialise: fetch lesson + provider config ─────────────────────────────
  React.useEffect(() => {
    /**
     * Fetch lesson details without assuming role.
     * Tries the student endpoint first; if that returns 401/403/404,
     * falls back to the tutor endpoint. This lets both students and
     * tutors open /lessons/[id]/classroom from their respective dashboards.
     */
    async function fetchLesson(lessonId: string) {
      // Try student endpoint first
      try {
        const res = await fetch(`/api/student/lessons/${lessonId}`);
        if (res.ok) return res.json();
      } catch {}

      // Fallback: tutor endpoint
      try {
        const res = await fetch(`/api/tutor/lessons/${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          // Normalise tutor lesson shape to match Lesson360Aggregate
          return {
            ...data,
            student: data.student || { displayName: "Student" },
            tutor: data.tutor || { displayName: data.tutorName || "Educator" },
            subject: data.subject || { name: data.subjectName || "Live Class" },
            videoRoomId: data.videoRoomId,
            materials: data.materials || [],
          };
        }
      } catch {}

      return null;
    }

    async function init() {
      setLoading(true);
      try {
        // 1. Load lesson details and classroom provider in parallel
        const [les, providerConfig] = await Promise.all([
          fetchLesson(id),
          fetch("/api/classroom/config").then((r) => r.json()).catch(() => ({ activeProvider: "livekit" })),
        ]);

        setLesson(les);

        const provider: VideoProviderType = providerConfig?.activeProvider || "livekit";
        setActiveProvider(provider);

        if (les) {
          const roomName = les.videoRoomId || `room-${les.id}`;
          const username = les.student?.displayName || les.tutor?.displayName || "Participant";
          const topic = `${les.subject?.name || "Live Class"} with ${les.tutor?.displayName || "Educator"}`;

          if (provider === "livekit") {
            // Fetch Livekit JWT token
            const livekitUrl = providerConfig?.livekitUrl || "wss://demo.livekit.cloud";
            const tokenRes = await fetch(
              `/api/livekit/token?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(username)}`
            );
            if (tokenRes.ok) {
              const data = await tokenRes.json();
              setLivekitToken(data.token);
              setLivekitUrl(data.serverUrl || livekitUrl);
            }
          } else {
            // Fetch external provider join URL
            fetchJoinUrl(provider, roomName, topic);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    init();

    // Countdown timer
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [id]);

  // ─── Fetch external provider join URL ──────────────────────────────────────
  const fetchJoinUrl = async (provider: VideoProviderType, room: string, topic: string) => {
    setJoinLoading(true);
    setJoinError(null);
    try {
      const providerRoutes: Record<string, string> = {
        zoom: "/api/classroom/join/zoom",
        classin: "/api/classroom/join/classin",
        google_meet: "/api/classroom/join/google-meet",
      };
      const route = providerRoutes[provider];
      if (!route) return;

      const res = await fetch(
        `${route}?room=${encodeURIComponent(room)}&topic=${encodeURIComponent(topic)}`
      );
      const data = await res.json();

      if (!res.ok || data.error) {
        setJoinError(data.error || "Failed to generate meeting link");
        return;
      }

      setJoinUrl(data.joinUrl);
    } catch (err: any) {
      setJoinError(err.message || "Failed to connect to classroom provider");
    } finally {
      setJoinLoading(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: lesson?.student.displayName || "You",
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setChatInput("");
  };

  const handleEndLesson = async () => {
    if (!lesson) return;
    setIsEnding(true);
    await lessonService.completeLesson(lesson.id, {
      studentFeedback: feedbackNotes || "Completed 1-on-1 teaching session.",
    });
    setIsEnding(false);
    setIsEndModalOpen(false);
    router.push(`/student/lessons/${lesson.id}`);
  };

  const providerMeta = PROVIDER_META[activeProvider];

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold">Connecting to Live Classroom...</h2>
          <p className="text-xs text-slate-400">Setting up your session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* 1. TOP HEADER BAR */}
      <header className="flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-900 px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Badge
            variant="subtle"
            size="sm"
            className="bg-rose-500/20 text-rose-300 border-rose-500/30 flex items-center gap-1.5 animate-pulse"
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="font-bold text-[10px] uppercase tracking-wider">LIVE CLASS</span>
          </Badge>

          <div className="h-4 w-px bg-slate-700" />

          {/* Provider badge */}
          <Badge
            variant="subtle"
            size="sm"
            className={`${providerMeta.bgColor} ${providerMeta.color} ${providerMeta.borderColor} flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider`}
          >
            <span>{providerMeta.icon}</span>
            <span>{providerMeta.label}</span>
          </Badge>

          <div className="h-4 w-px bg-slate-700" />

          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white leading-none truncate max-w-[200px] sm:max-w-xs">
              {lesson?.subject.name || "Live Class"}
            </h2>
            <span className="text-[10px] text-slate-400">
              with {lesson?.tutor.displayName || "Educator"}
            </span>
          </div>
        </div>

        {/* Center: Live Timer */}
        <div className="flex items-center gap-2 rounded-full bg-slate-800/80 px-3.5 py-1 border border-slate-700">
          <Clock className="h-3.5 w-3.5 text-indigo-400" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200">
            {formatTimer(secondsRemaining)}
          </span>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsEndModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span>End Class</span>
          </Button>
        </div>
      </header>

      {/* 2. MAIN BODY: VIDEO + SIDEBAR */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ─── VIDEO AREA ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-slate-950 p-3 sm:p-4 overflow-hidden">

          {/* ── Livekit: embedded room ── */}
          {activeProvider === "livekit" && (
            <>
              {livekitToken && livekitUrl ? (
                <LiveKitRoom
                  video={true}
                  audio={true}
                  token={livekitToken}
                  serverUrl={livekitUrl}
                  data-lk-theme="default"
                  className="flex-1 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900"
                >
                  <VideoConference />
                  <RoomAudioRenderer />
                </LiveKitRoom>
              ) : (
                <div className="flex-1 flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-center p-8">
                  <div className="space-y-3 max-w-md">
                    <Avatar
                      src={lesson?.tutor.avatarUrl}
                      fallbackName={lesson?.tutor.displayName || "Tutor"}
                      size="xl"
                      className="mx-auto"
                    />
                    <h3 className="text-base font-bold text-white">{lesson?.tutor.displayName}</h3>
                    <p className="text-xs text-slate-400">
                      Connecting to Livekit room...
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── External providers: launch card ── */}
          {activeProvider !== "livekit" && (
            <div className="flex-1 flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
              <div className="text-center space-y-6 max-w-md w-full px-8">
                {/* Avatar */}
                <Avatar
                  src={lesson?.tutor.avatarUrl}
                  fallbackName={lesson?.tutor.displayName || "Tutor"}
                  size="xl"
                  className="mx-auto ring-4 ring-slate-700"
                />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {lesson?.tutor.displayName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {lesson?.subject?.name || "Live Class"} — ready to start
                  </p>
                </div>

                {/* Provider badge */}
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${providerMeta.bgColor} ${providerMeta.borderColor}`}
                >
                  <span className="text-lg">{providerMeta.icon}</span>
                  <span className={`text-sm font-bold ${providerMeta.color}`}>
                    {providerMeta.label}
                  </span>
                </div>

                {/* Loading state */}
                {joinLoading && (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    <p className="text-xs text-slate-400">
                      Generating your meeting link...
                    </p>
                  </div>
                )}

                {/* Error state */}
                {joinError && !joinLoading && (
                  <div className="rounded-2xl border border-rose-700/40 bg-rose-900/20 p-4 text-left space-y-2">
                    <div className="flex items-center gap-2 text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-bold">Could not generate meeting link</span>
                    </div>
                    <p className="text-[11px] text-rose-400">{joinError}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-300 border-rose-700 hover:bg-rose-900/30 text-xs"
                      onClick={() => {
                        const room = lesson?.videoRoomId || `room-${lesson?.id}`;
                        const topic = `${lesson?.subject?.name || "Live Class"} with ${lesson?.tutor?.displayName || "Educator"}`;
                        fetchJoinUrl(activeProvider, room, topic);
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {/* Join button */}
                {joinUrl && !joinLoading && (
                  <div className="space-y-3">
                    <a href={joinUrl} target="_blank" rel="noreferrer" className="block">
                      <Button
                        className={`w-full font-bold text-sm py-3 flex items-center justify-center gap-2 ${
                          activeProvider === "zoom"
                            ? "bg-sky-600 hover:bg-sky-700"
                            : activeProvider === "classin"
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        } text-white`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Join on {providerMeta.label}
                      </Button>
                    </a>
                    <p className="text-[10px] text-slate-500">
                      Opens in a new tab. Return here when your session ends to complete the lesson.
                    </p>
                  </div>
                )}

                {/* Fallback: if no URL yet and not loading/error, show manual retry */}
                {!joinUrl && !joinLoading && !joinError && (
                  <Button
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    onClick={() => {
                      const room = lesson?.videoRoomId || `room-${lesson?.id}`;
                      const topic = `${lesson?.subject?.name || "Live Class"} with ${lesson?.tutor?.displayName || "Educator"}`;
                      fetchJoinUrl(activeProvider, room, topic);
                    }}
                  >
                    Generate Meeting Link
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── SIDE PANEL ─────────────────────────────────────────────── */}
        {sidePanelOpen && (
          <aside className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0">
            {/* Tabs */}
            <div className="flex border-b border-slate-800 px-3 pt-2">
              {[
                { id: "chat", label: "Class Chat", icon: MessageSquare },
                { id: "notes", label: "Lesson Notes", icon: FileText },
                { id: "files", label: "Worksheets", icon: Download },
              ].map(({ id: tabId, label, icon: Icon }) => (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold border-b-2 transition ${
                    activeTab === tabId
                      ? "border-indigo-500 text-white"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
              {activeTab === "chat" && (
                <div className="flex flex-col h-full justify-between space-y-2">
                  <div className="space-y-2 overflow-y-auto pr-1">
                    {chatMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold text-indigo-300">{m.sender}</span>
                          <span>{m.time}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed text-xs">{m.text}</p>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleSendChat}
                    className="pt-2 flex gap-1.5 border-t border-slate-800"
                  >
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Session Objective
                    </span>
                    <p className="text-slate-200">
                      {lesson?.lessonNotes || "1-on-1 live teaching session."}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "files" && (
                <div className="space-y-2">
                  {!lesson?.materials || lesson.materials.length === 0 ? (
                    <p className="text-slate-500 text-center py-6 italic">
                      No files attached to this session.
                    </p>
                  ) : (
                    lesson.materials.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-white block text-xs truncate max-w-[150px]">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-slate-400">{m.uploadedByRole}</span>
                        </div>
                        <a href={m.url} target="_blank" rel="noreferrer">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] border-slate-700 text-slate-200"
                          >
                            Download
                          </Button>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* End Lesson Confirmation Modal */}
      <Modal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title="End Live Teaching Session"
        description="Are you sure you want to end this session? Completed study hours will be credited."
      >
        <div className="space-y-4 pt-2 text-slate-900">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Final Session Summary / Feedback
            </label>
            <textarea
              rows={3}
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              placeholder="e.g. Completed IELTS Task 2 speaking monologue with score 7.5..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsEndModalOpen(false)}>
              Keep Calling
            </Button>
            <Button
              variant="default"
              disabled={isEnding}
              onClick={handleEndLesson}
              className="font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isEnding ? "Ending..." : "End & Complete Session"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
