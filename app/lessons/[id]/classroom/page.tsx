"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "@livekit/components-styles";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  ParticipantTile,
} from "@livekit/components-react";
import { Track } from "livekit-client";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { lessonService } from "@/services/lessonService";
import { Lesson360Aggregate } from "@/src/modules/lessons/domain/types";
import { formatTime } from "@/lib/utils";

export default function LiveKitVideoClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [lesson, setLesson] = React.useState<Lesson360Aggregate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [token, setToken] = React.useState<string>("");
  const [serverUrl, setServerUrl] = React.useState<string>("");

  // Classroom Side Panel
  const [sidePanelOpen, setSidePanelOpen] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"chat" | "notes" | "files">("chat");

  // In-class chat
  const [chatMessages, setChatMessages] = React.useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: "System", text: "Encrypted WebRTC LiveKit classroom initialized.", time: "09:00 AM" },
  ]);
  const [chatInput, setChatInput] = React.useState("");

  // End Lesson Modal state
  const [isEndModalOpen, setIsEndModalOpen] = React.useState(false);
  const [feedbackNotes, setFeedbackNotes] = React.useState("");
  const [isEnding, setIsEnding] = React.useState(false);

  // Timer countdown
  const [secondsRemaining, setSecondsRemaining] = React.useState(50 * 60);

  React.useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const les = await lessonService.getLessonById(id);
        setLesson(les);

        if (les) {
          const roomName = les.videoRoomId || `room-${les.id}`;
          const username = les.student.displayName || "Participant";

          const tokenRes = await fetch(
            `/api/livekit/token?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(username)}`
          );
          if (tokenRes.ok) {
            const data = await tokenRes.json();
            setToken(data.token);
            setServerUrl(data.serverUrl || "wss://demo.livekit.cloud");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    init();

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [id]);

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

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold">Connecting to LiveKit Video Room...</h2>
          <p className="text-xs text-slate-400">Negotiating WebRTC audio/video media streams</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* 1. TOP HEADER BAR */}
      <header className="flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-900 px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Badge variant="subtle" size="sm" className="bg-rose-500/20 text-rose-300 border-rose-500/30 flex items-center gap-1.5 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="font-bold text-[10px] uppercase tracking-wider">LIVE CLASS</span>
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

        {/* LiveKit Video Container */}
        <div className="flex-1 flex flex-col bg-slate-950 p-3 sm:p-4 overflow-hidden">
          {token && serverUrl ? (
            <LiveKitRoom
              video={true}
              audio={true}
              token={token}
              serverUrl={serverUrl}
              data-lk-theme="default"
              className="flex-1 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900"
            >
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          ) : (
            <div className="flex-1 flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-center p-8">
              <div className="space-y-3 max-w-md">
                <Avatar src={lesson?.tutor.avatarUrl} fallbackName={lesson?.tutor.displayName || "Tutor"} size="xl" className="mx-auto" />
                <h3 className="text-base font-bold text-white">{lesson?.tutor.displayName}</h3>
                <p className="text-xs text-slate-400">
                  Video classroom ready. Click End Class when your session finishes to record learning milestones.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel (Chat, Notes, Worksheets) */}
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
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold text-indigo-300">{m.sender}</span>
                          <span>{m.time}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed text-xs">{m.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendChat} className="pt-2 flex gap-1.5 border-t border-slate-800">
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Session Objective</span>
                    <p className="text-slate-200">{lesson?.lessonNotes || "1-on-1 IELTS & Academics Masterclass."}</p>
                  </div>
                </div>
              )}

              {activeTab === "files" && (
                <div className="space-y-2">
                  {(!lesson?.materials || lesson.materials.length === 0) ? (
                    <p className="text-slate-500 text-center py-6 italic">No files attached to this session.</p>
                  ) : (
                    lesson.materials.map((m) => (
                      <div key={m.id} className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block text-xs truncate max-w-[150px]">{m.name}</span>
                          <span className="text-[10px] text-slate-400">{m.uploadedByRole}</span>
                        </div>
                        <a href={m.url} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="text-[10px] border-slate-700 text-slate-200">
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
