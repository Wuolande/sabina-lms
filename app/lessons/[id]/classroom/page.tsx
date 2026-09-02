"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
  useIsSpeaking,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
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
import { VideoProviderType } from "@/src/modules/video/types/videoProviderTypes";

// ClassIn Components
import { ClassroomHeader, StageLayoutMode } from "@/components/classroom/ClassroomHeader";
import { InteractiveWhiteboard, StrokeElement } from "@/components/classroom/InteractiveWhiteboard";
import { ParticipantVideoCard } from "@/components/classroom/ParticipantVideoCard";
import { ClassinToolsWidget } from "@/components/classroom/ClassinToolsWidget";
import { ClassroomSidebar } from "@/components/classroom/ClassroomSidebar";
import { CelebrationOverlay } from "@/components/classroom/CelebrationOverlay";
import { DeviceSettingsModal } from "@/components/classroom/DeviceSettingsModal";

// ─── Provider display metadata for non-livekit fallbacks ──────────────────────
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

/**
 * Inner Classroom Stage Component mounted inside LiveKitRoom
 * Handles real-time video tracks, stage layout transitions, and data channel sync.
 */
function ClassinClassroomStage({
  lesson,
  isTutor,
  currentUserName,
  currentUserRole,
  onEndLesson,
  secondsRemaining,
}: {
  lesson: Lesson360Aggregate;
  isTutor: boolean;
  currentUserName: string;
  currentUserRole: "TUTOR" | "STUDENT";
  onEndLesson: () => void;
  secondsRemaining: number;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  // Stage Layout mode
  const [layoutMode, setLayoutMode] = React.useState<StageLayoutMode>("classin_stage");

  // Whiteboard sync state
  const [externalStrokes, setExternalStrokes] = React.useState<StrokeElement[]>([]);

  // Gamification & ClassIn tools state
  const [studentTrophies, setStudentTrophies] = React.useState(0);
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [celebrationMessage, setCelebrationMessage] = React.useState("");
  const [isHandRaised, setIsHandRaised] = React.useState(false);

  // Synced countdown timer state
  const [syncedTimer, setSyncedTimer] = React.useState<{ isRunning: boolean; seconds: number } | undefined>(undefined);

  // Side Panel & Chat state
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [chatMessages, setChatMessages] = React.useState<
    Array<{ id: string; sender: string; senderRole?: "TUTOR" | "STUDENT" | "SYSTEM"; text: string; time: string }>
  >([
    {
      id: "sys-1",
      sender: "System",
      senderRole: "SYSTEM",
      text: "Interactive ClassIn-grade teaching session initialized.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Device settings modal
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // Subscribe to LiveKit Data Channel Messages for ClassIn interactions
  React.useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant?: any) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);

        if (data.type === "STROKE") {
          setExternalStrokes((prev) => [...prev, data.stroke]);
        } else if (data.type === "TROPHY") {
          setStudentTrophies((prev) => prev + 1);
          setCelebrationMessage(data.message || "Great work!");
          setShowCelebration(true);
        } else if (data.type === "HAND_RAISE") {
          setIsHandRaised(data.isRaised);
          if (data.isRaised && isTutor) {
            // Tutor notification sound
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(600, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.4);
            } catch {}
          }
        } else if (data.type === "TIMER_SYNC") {
          setSyncedTimer({ isRunning: data.isRunning, seconds: data.seconds });
        } else if (data.type === "CHAT") {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}-${Math.random()}`,
              sender: data.sender,
              senderRole: data.senderRole,
              text: data.text,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }
      } catch (err) {
        console.warn("Failed to parse data message:", err);
      }
    };

    room.on("dataReceived", handleDataReceived);
    return () => {
      room.off("dataReceived", handleDataReceived);
    };
  }, [room, isTutor]);

  // Broadcast Helper over Data Channel
  const broadcastData = (data: any) => {
    if (!room || !localParticipant) return;
    try {
      const payload = new TextEncoder().encode(JSON.stringify(data));
      localParticipant.publishData(payload, { reliable: true });
    } catch (err) {
      console.warn("Failed to broadcast data channel message:", err);
    }
  };

  // Broadcast Stroke
  const handleBroadcastStroke = (stroke: StrokeElement) => {
    broadcastData({ type: "STROKE", stroke });
  };

  // Tutor Awards Trophy
  const handleAwardTrophy = (message: string) => {
    setStudentTrophies((prev) => prev + 1);
    setCelebrationMessage(message);
    setShowCelebration(true);
    broadcastData({ type: "TROPHY", message });
  };

  // Student Raises Hand
  const handleRaiseHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    broadcastData({ type: "HAND_RAISE", isRaised: nextState });
  };

  // Timer Synchronization
  const handleSyncTimer = (action: "start" | "pause" | "reset" | "set", sec?: number) => {
    const isRunning = action === "start";
    const seconds = sec !== undefined ? sec : 120;
    setSyncedTimer({ isRunning, seconds });
    broadcastData({ type: "TIMER_SYNC", isRunning, seconds });
  };

  // Send In-Class Chat Message
  const handleSendChatMessage = (text: string) => {
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: currentUserName,
      senderRole: currentUserRole,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    broadcastData({ type: "CHAT", sender: currentUserName, senderRole: currentUserRole, text });
  };

  // Tracks query
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  const tutorName = lesson?.tutor?.displayName || "Educator";
  const studentName = lesson?.student?.displayName || "Student";

  // Identify Local & Remote video tracks
  const localCameraTrack = tracks.find((t) => t.participant.isLocal && t.source === Track.Source.Camera);
  const remoteCameraTrack = tracks.find((t) => !t.participant.isLocal && t.source === Track.Source.Camera);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative select-none">
      {/* ─── CLASSROOM HEADER BAR ─── */}
      <ClassroomHeader
        lessonTitle={lesson?.subject?.name || "1-on-1 Interactive Tutoring"}
        tutorName={tutorName}
        studentName={studentName}
        secondsRemaining={secondsRemaining}
        layoutMode={layoutMode}
        onChangeLayout={setLayoutMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onEndLesson={onEndLesson}
        latencyMs={24}
      />

      {/* ─── MAIN STAGE VIEWPORT + SIDEBAR ─── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Floating ClassIn Tools Palette (Timer, Dice, Trophy, Hand-raise) */}
        <ClassinToolsWidget
          isTutor={isTutor}
          studentName={studentName}
          onAwardTrophy={handleAwardTrophy}
          onRaiseHand={handleRaiseHand}
          isHandRaised={isHandRaised}
          onSyncTimer={handleSyncTimer}
          syncedTimerState={syncedTimer}
        />

        {/* ─── STAGE CONTAINER ─── */}
        <div className="flex-1 flex flex-col bg-slate-950 p-3 sm:p-4 overflow-hidden relative">
          
          {/* LAYOUT 1: CLASSIN STAGE (Top Video Strip + Big Whiteboard) */}
          {layoutMode === "classin_stage" && (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              {/* Top Video Strip for Tutor & Student */}
              <div className="grid grid-cols-2 gap-3 h-44 shrink-0">
                {/* Tutor Tile */}
                <ParticipantVideoCard
                  displayName={isTutor ? `${tutorName} (You)` : tutorName}
                  avatarUrl={lesson?.tutor?.avatarUrl}
                  role="TUTOR"
                  isLocal={isTutor}
                  isSpeaking={false}
                  isMuted={isTutor ? !localParticipant?.isMicrophoneEnabled : false}
                  isVideoOff={isTutor ? !localParticipant?.isCameraEnabled : false}
                  videoElement={
                    isTutor && localCameraTrack ? (
                      <VideoTrack trackRef={localCameraTrack} className="w-full h-full object-cover" />
                    ) : !isTutor && remoteCameraTrack ? (
                      <VideoTrack trackRef={remoteCameraTrack} className="w-full h-full object-cover" />
                    ) : null
                  }
                />

                {/* Student Tile */}
                <ParticipantVideoCard
                  displayName={!isTutor ? `${studentName} (You)` : studentName}
                  avatarUrl={lesson?.student?.avatarUrl}
                  role="STUDENT"
                  isLocal={!isTutor}
                  isSpeaking={false}
                  isMuted={!isTutor ? !localParticipant?.isMicrophoneEnabled : false}
                  isVideoOff={!isTutor ? !localParticipant?.isCameraEnabled : false}
                  trophiesCount={studentTrophies}
                  isHandRaised={isHandRaised}
                  onAwardTrophy={isTutor ? () => handleAwardTrophy("Great job!") : undefined}
                  videoElement={
                    !isTutor && localCameraTrack ? (
                      <VideoTrack trackRef={localCameraTrack} className="w-full h-full object-cover" />
                    ) : isTutor && remoteCameraTrack ? (
                      <VideoTrack trackRef={remoteCameraTrack} className="w-full h-full object-cover" />
                    ) : null
                  }
                />
              </div>

              {/* Interactive Multi-Tool Whiteboard */}
              <div className="flex-1 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative bg-white">
                <InteractiveWhiteboard
                  isTutor={isTutor}
                  onBroadcastStroke={handleBroadcastStroke}
                  externalStrokes={externalStrokes}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* LAYOUT 2: DUAL STAGE (50/50 Split) */}
          {layoutMode === "split" && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden">
              {/* Left: Video Cards Stack */}
              <div className="flex flex-col gap-3 h-full">
                <div className="flex-1 rounded-3xl overflow-hidden border border-slate-800">
                  <ParticipantVideoCard
                    displayName={tutorName}
                    avatarUrl={lesson?.tutor?.avatarUrl}
                    role="TUTOR"
                    isLocal={isTutor}
                    className="w-full h-full"
                    videoElement={
                      isTutor && localCameraTrack ? (
                        <VideoTrack trackRef={localCameraTrack} className="w-full h-full object-cover" />
                      ) : !isTutor && remoteCameraTrack ? (
                        <VideoTrack trackRef={remoteCameraTrack} className="w-full h-full object-cover" />
                      ) : null
                    }
                  />
                </div>
                <div className="flex-1 rounded-3xl overflow-hidden border border-slate-800">
                  <ParticipantVideoCard
                    displayName={studentName}
                    avatarUrl={lesson?.student?.avatarUrl}
                    role="STUDENT"
                    isLocal={!isTutor}
                    trophiesCount={studentTrophies}
                    isHandRaised={isHandRaised}
                    className="w-full h-full"
                    onAwardTrophy={isTutor ? () => handleAwardTrophy("Excellent answer!") : undefined}
                    videoElement={
                      !isTutor && localCameraTrack ? (
                        <VideoTrack trackRef={localCameraTrack} className="w-full h-full object-cover" />
                      ) : isTutor && remoteCameraTrack ? (
                        <VideoTrack trackRef={remoteCameraTrack} className="w-full h-full object-cover" />
                      ) : null
                    }
                  />
                </div>
              </div>

              {/* Right: Whiteboard */}
              <div className="flex-1 rounded-3xl overflow-hidden border border-slate-800 bg-white shadow-2xl">
                <InteractiveWhiteboard
                  isTutor={isTutor}
                  onBroadcastStroke={handleBroadcastStroke}
                  externalStrokes={externalStrokes}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* LAYOUT 3: VIDEO GRID (Full Video Conference Focus) */}
          {layoutMode === "grid" && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-2 overflow-hidden">
              <ParticipantVideoCard
                displayName={tutorName}
                avatarUrl={lesson?.tutor?.avatarUrl}
                role="TUTOR"
                isLocal={isTutor}
                className="w-full h-full rounded-3xl"
                videoElement={
                  isTutor && localCameraTrack ? (
                    <VideoTrack trackRef={localCameraTrack} className="w-full h-full object-cover" />
                  ) : !isTutor && remoteCameraTrack ? (
                    <VideoTrack trackRef={remoteCameraTrack} className="w-full h-full object-cover" />
                  ) : null
                }
              />
              <ParticipantVideoCard
                displayName={studentName}
                avatarUrl={lesson?.student?.avatarUrl}
                role="STUDENT"
                isLocal={!isTutor}
                trophiesCount={studentTrophies}
                isHandRaised={isHandRaised}
                className="w-full h-full rounded-3xl"
                onAwardTrophy={isTutor ? () => handleAwardTrophy("Great insight!") : undefined}
                videoElement={
                  !isTutor && localCameraTrack ? (
                    <VideoTrack trackRef={localCameraTrack} className="w-full h-full object-cover" />
                  ) : isTutor && remoteCameraTrack ? (
                    <VideoTrack trackRef={remoteCameraTrack} className="w-full h-full object-cover" />
                  ) : null
                }
              />
            </div>
          )}
        </div>

        {/* ─── CLASSROOM SIDEBAR (Chat, Notes, Worksheets) ─── */}
        <ClassroomSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentUserDisplayName={currentUserName}
          currentUserRole={currentUserRole}
          messages={chatMessages}
          onSendMessage={handleSendChatMessage}
          lessonNotes={lesson?.lessonNotes || ""}
          materials={lesson?.materials || []}
        />
      </div>

      {/* ─── CELEBRATION OVERLAY ─── */}
      <CelebrationOverlay
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
        message={celebrationMessage}
        count={1}
      />

      {/* ─── DEVICE SETTINGS MODAL ─── */}
      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Audio Rendering for LiveKit */}
      <RoomAudioRenderer />
    </div>
  );
}

/**
 * Main Classroom Page Container
 */
export default function LiveClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [lesson, setLesson] = React.useState<Lesson360Aggregate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [currentUserRole, setCurrentUserRole] = React.useState<"TUTOR" | "STUDENT">("STUDENT");

  // Provider state
  const [activeProvider, setActiveProvider] = React.useState<VideoProviderType>("livekit");

  // Livekit state
  const [livekitToken, setLivekitToken] = React.useState<string>("");
  const [livekitUrl, setLivekitUrl] = React.useState<string>("");

  // External provider fallback state
  const [joinUrl, setJoinUrl] = React.useState<string>("");
  const [joinLoading, setJoinLoading] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);

  // End Lesson Modal
  const [isEndModalOpen, setIsEndModalOpen] = React.useState(false);
  const [feedbackNotes, setFeedbackNotes] = React.useState("");
  const [isEnding, setIsEnding] = React.useState(false);

  // Lesson Countdown Timer (50 mins default)
  const [secondsRemaining, setSecondsRemaining] = React.useState(50 * 60);

  // ─── Initialise Lesson Details and LiveKit Session ───
  React.useEffect(() => {
    async function fetchLessonData(lessonId: string) {
      // 1. Try student endpoint
      try {
        const res = await fetch(`/api/student/lessons/${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentUserRole("STUDENT");
          return data;
        }
      } catch {}

      // 2. Try tutor endpoint
      try {
        const res = await fetch(`/api/tutor/lessons/${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentUserRole("TUTOR");
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
        const [les, providerConfig] = await Promise.all([
          fetchLessonData(id),
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
            const defaultLivekitUrl = providerConfig?.livekitUrl || "wss://demo.livekit.cloud";
            const tokenRes = await fetch(
              `/api/livekit/token?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(username)}`
            );
            if (tokenRes.ok) {
              const data = await tokenRes.json();
              setLivekitToken(data.token);
              setLivekitUrl(data.serverUrl || defaultLivekitUrl);
            }
          } else {
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

    // Lesson Timer
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [id]);

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

  const handleEndLesson = async () => {
    if (!lesson) return;
    setIsEnding(true);
    await lessonService.completeLesson(lesson.id, {
      studentFeedback: feedbackNotes || "Completed 1-on-1 teaching session.",
    });
    setIsEnding(false);
    setIsEndModalOpen(false);

    if (currentUserRole === "TUTOR") {
      router.push(`/tutor/lessons/${lesson.id}`);
    } else {
      router.push(`/student/lessons/${lesson.id}`);
    }
  };

  const providerMeta = PROVIDER_META[activeProvider];
  const isTutor = currentUserRole === "TUTOR";
  const currentUserName = isTutor
    ? lesson?.tutor?.displayName || "Educator"
    : lesson?.student?.displayName || "Student";

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold">Connecting to Live Interactive Classroom...</h2>
          <p className="text-xs text-slate-400">Loading collaborative canvas and teaching tools</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* ─── LIVEKIT PROVIDER: ClassIn-Grade Interactive Stage ─── */}
      {activeProvider === "livekit" ? (
        livekitToken && livekitUrl ? (
          <LiveKitRoom
            video={true}
            audio={true}
            token={livekitToken}
            serverUrl={livekitUrl}
            data-lk-theme="default"
            className="flex-1 flex flex-col overflow-hidden w-full h-full"
          >
            <ClassinClassroomStage
              lesson={lesson!}
              isTutor={isTutor}
              currentUserName={currentUserName}
              currentUserRole={currentUserRole}
              onEndLesson={() => setIsEndModalOpen(true)}
              secondsRemaining={secondsRemaining}
            />
          </LiveKitRoom>
        ) : (
          <div className="flex-1 flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-center p-8">
            <div className="space-y-3 max-w-md">
              <Avatar
                src={lesson?.tutor?.avatarUrl}
                fallbackName={lesson?.tutor?.displayName || "Tutor"}
                size="xl"
                className="mx-auto"
              />
              <h3 className="text-base font-bold text-white">{lesson?.tutor?.displayName}</h3>
              <p className="text-xs text-slate-400">Connecting to classroom room...</p>
            </div>
          </div>
        )
      ) : (
        /* ─── EXTERNAL PROVIDER FALLBACK ─── */
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
          <div className="text-center space-y-6 max-w-md w-full px-8">
            <Avatar
              src={lesson?.tutor?.avatarUrl}
              fallbackName={lesson?.tutor?.displayName || "Tutor"}
              size="xl"
              className="mx-auto ring-4 ring-slate-700"
            />
            <div>
              <h3 className="text-lg font-bold text-white">{lesson?.tutor?.displayName}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {lesson?.subject?.name || "Live Class"} — ready to start
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${providerMeta.bgColor} ${providerMeta.borderColor}`}
            >
              <span className="text-lg">{providerMeta.icon}</span>
              <span className={`text-sm font-bold ${providerMeta.color}`}>
                {providerMeta.label}
              </span>
            </div>

            {joinLoading && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <p className="text-xs text-slate-400">Generating meeting link...</p>
              </div>
            )}

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
          </div>
        </div>
      )}

      {/* ─── END LESSON MODAL ─── */}
      <Modal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title="End Live Teaching Session"
        description="Are you sure you want to conclude this live classroom? Completed lesson progress will be recorded."
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
              placeholder="e.g. Completed speaking practice and reviewed vocabulary..."
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
