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
  Monitor,
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
import { PreClassWaitingRoom } from "@/components/classroom/PreClassWaitingRoom";

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
 * Local webcam video player component for fallback stream
 */
function LocalVideoFeed({ stream }: { stream: MediaStream | null }) {
  const vidRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (vidRef.current && stream && vidRef.current.srcObject !== stream) {
      vidRef.current.srcObject = stream;
      vidRef.current.play().catch(() => {});
    }
  }, [stream]);

  if (!stream) return null;
  return (
    <video
      ref={(el) => {
        vidRef.current = el;
        if (el && stream && el.srcObject !== stream) {
          el.srcObject = stream;
          el.play().catch(() => {});
        }
      }}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover mirror"
    />
  );
}

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
  onStudentConnected,
  endButtonLabel = "End Class",
}: {
  lesson: Lesson360Aggregate;
  isTutor: boolean;
  currentUserName: string;
  currentUserRole: "TUTOR" | "STUDENT";
  onEndLesson: () => void;
  secondsRemaining: number;
  onStudentConnected?: () => void;
  endButtonLabel?: string;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  // Notify parent when remote peer joins room
  React.useEffect(() => {
    if (participants.some((p) => !p.isLocal)) {
      onStudentConnected?.();
    }
  }, [participants, onStudentConnected]);

  // Media toggle states
  const [isMicEnabled, setIsMicEnabled] = React.useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = React.useState(true);
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);

  // Local media stream fallback (ensures user always sees their camera)
  const [localMediaStream, setLocalMediaStream] = React.useState<MediaStream | null>(null);

  // Floating moderation toast banner (prevents chat log pollution)
  const [moderationToast, setModerationToast] = React.useState<string | null>(null);

  // Stage Layout mode
  const [layoutMode, setLayoutMode] = React.useState<StageLayoutMode>("classin_stage");

  // Whiteboard sync state & ClassIn pen authorization
  const [externalStrokes, setExternalStrokes] = React.useState<StrokeElement[]>([]);
  const [isWhiteboardAuthorized, setIsWhiteboardAuthorized] = React.useState(isTutor);

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

  // ─── Local Webcam & Mic Hardware Stream ───
  React.useEffect(() => {
    let activeStream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        activeStream = stream;
        setLocalMediaStream(stream);
      })
      .catch((err) => {
        console.warn("[Classroom] Local media fallback access:", err);
      });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ─── Critical Camera & Microphone Hardware Release Cleanup on Unmount ───
  const cleanupAllMedia = React.useCallback(() => {
    if (localMediaStream) {
      localMediaStream.getTracks().forEach((t) => {
        t.stop();
      });
      setLocalMediaStream(null);
    }
    if (localParticipant) {
      localParticipant.videoTrackPublications.forEach((pub) => {
        pub.track?.stop();
      });
      localParticipant.audioTrackPublications.forEach((pub) => {
        pub.track?.stop();
      });
    }
    if (room) {
      try {
        room.disconnect();
      } catch {}
    }
  }, [localMediaStream, localParticipant, room]);

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupAllMedia();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      cleanupAllMedia();
    };
  }, [cleanupAllMedia]);

  // ─── Subscribe to LiveKit Data Channel Messages ───
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
            // Tutor chime
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
        } else if (data.type === "WHITEBOARD_AUTH") {
          setIsWhiteboardAuthorized(data.isAuthorized);
          setModerationToast(
            data.isAuthorized
              ? "✏️ Tutor has authorized your drawing permissions on the whiteboard."
              : "🔒 Whiteboard switched to view-only mode by the tutor."
          );
          setTimeout(() => setModerationToast(null), 4000);
        } else if (data.type === "REMOTE_MUTE") {
          if (!isTutor) {
            setIsMicEnabled(false);
            if (localMediaStream) {
              localMediaStream.getAudioTracks().forEach((t) => (t.enabled = false));
            }
            localParticipant?.setMicrophoneEnabled(false).catch(() => {});
            setModerationToast("🔇 Your microphone was muted by the tutor.");
            setTimeout(() => setModerationToast(null), 4000);
          }
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
  }, [room, isTutor, localParticipant, localMediaStream]);

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

  // Media Toggles (Instant zero-lag local update with background WebRTC sync)
  const handleToggleMic = () => {
    const next = !isMicEnabled;
    setIsMicEnabled(next);
    if (localMediaStream) {
      localMediaStream.getAudioTracks().forEach((t) => (t.enabled = next));
    }
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(next).catch(() => {});
    }
  };

  const handleToggleCamera = () => {
    const next = !isCameraEnabled;
    setIsCameraEnabled(next);
    if (localMediaStream) {
      localMediaStream.getVideoTracks().forEach((t) => (t.enabled = next));
    }
    if (localParticipant) {
      localParticipant.setCameraEnabled(next).catch(() => {});
    }
  };

  const handleToggleScreenShare = async () => {
    if (!localParticipant) return;
    try {
      const next = !isScreenSharing;
      await localParticipant.setScreenShareEnabled(next);
      setIsScreenSharing(next);
      if (next) {
        setLayoutMode("screenshare");
      } else if (layoutMode === "screenshare") {
        setLayoutMode("classin_stage");
      }
    } catch (err) {
      console.warn("Screen share cancelled or error:", err);
      setIsScreenSharing(false);
    }
  };

  // Automatically reset layout when user stops sharing via browser bar
  React.useEffect(() => {
    if (!localParticipant) return;

    const handleLocalTrackUnpublished = (pub: any) => {
      if (pub.source === Track.Source.ScreenShare) {
        setIsScreenSharing(false);
        if (layoutMode === "screenshare") {
          setLayoutMode("classin_stage");
        }
      }
    };

    localParticipant.on("localTrackUnpublished", handleLocalTrackUnpublished);
    return () => {
      localParticipant.off("localTrackUnpublished", handleLocalTrackUnpublished);
    };
  }, [localParticipant, layoutMode]);

  // Tutor Moderation
  const handleRemoteMuteStudent = () => {
    broadcastData({ type: "REMOTE_MUTE" });
    setModerationToast("🔇 Sent mute command to student.");
    setTimeout(() => setModerationToast(null), 3000);
  };

  const handleToggleWhiteboardAuth = () => {
    const next = !isWhiteboardAuthorized;
    setIsWhiteboardAuthorized(next);
    broadcastData({ type: "WHITEBOARD_AUTH", isAuthorized: next });
    setModerationToast(
      next
        ? "✏️ Authorized student to draw on whiteboard."
        : "🔒 Locked student whiteboard in view-only mode."
    );
    setTimeout(() => setModerationToast(null), 3000);
  };

  // Tracks query
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  const tutorName = lesson?.tutor?.displayName || "Dr. Elena Rostova";
  const studentName = lesson?.student?.displayName || "Alex Rivera";
  const durationMin = lesson?.durationMinutes || 50;
  const isTrial = durationMin <= 30;

  // Identify Local & Remote video tracks
  const localCameraTrack = tracks.find((t) => t.participant.isLocal && t.source === Track.Source.Camera);
  const remoteCameraTrack = tracks.find((t) => !t.participant.isLocal && t.source === Track.Source.Camera);
  const remoteScreenTrack = tracks.find((t) => !t.participant.isLocal && t.source === Track.Source.ScreenShare);

  // Check if remote peer is actually connected
  const remoteParticipant = participants.find((p) => !p.isLocal);
  const isRemoteConnected = !!remoteParticipant;

  // Render Local Video element (prefers LiveKit track, falls back to local media stream)
  const renderLocalVideo = () => {
    if (localCameraTrack && localCameraTrack.publication?.isSubscribed !== false) {
      return <VideoTrack trackRef={localCameraTrack} className="w-full h-full object-cover mirror" />;
    }
    return <LocalVideoFeed stream={localMediaStream} />;
  };

  // Render Remote Video element
  const renderRemoteVideo = () => {
    if (remoteCameraTrack) {
      return <VideoTrack trackRef={remoteCameraTrack} className="w-full h-full object-cover" />;
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative select-none">
      {/* ─── CLASSROOM HEADER BAR WITH INTEGRATED MEDIA CONTROLS ─── */}
      <ClassroomHeader
        lessonTitle={lesson?.subject?.name || "1-on-1 Interactive Tutoring"}
        tutorName={tutorName}
        studentName={studentName}
        secondsRemaining={secondsRemaining}
        layoutMode={layoutMode}
        onChangeLayout={setLayoutMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onEndLesson={onEndLesson}
        endButtonLabel={endButtonLabel}
        latencyMs={24}
        durationMinutes={durationMin}
        isTrial={isTrial}
        isMicEnabled={isMicEnabled}
        isCameraEnabled={isCameraEnabled}
        isScreenSharing={isScreenSharing}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onToggleScreenShare={handleToggleScreenShare}
      />

      {/* ─── FLOATING MODERATION TOAST BANNER (Zero Chat Pollution) ─── */}
      {moderationToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/95 border border-slate-700 text-white px-4 py-2 rounded-2xl shadow-2xl font-bold text-xs animate-in fade-in slide-in-from-top-2">
          <span>{moderationToast}</span>
        </div>
      )}

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
                  isConnected={isTutor || isRemoteConnected}
                  isSpeaking={false}
                  isMuted={isTutor ? !isMicEnabled : !isRemoteConnected}
                  isVideoOff={isTutor ? !isCameraEnabled : !isRemoteConnected}
                  onToggleMic={isTutor ? handleToggleMic : undefined}
                  onToggleCamera={isTutor ? handleToggleCamera : undefined}
                  videoElement={isTutor ? renderLocalVideo() : renderRemoteVideo()}
                />

                {/* Student Tile */}
                <ParticipantVideoCard
                  displayName={!isTutor ? `${studentName} (You)` : studentName}
                  avatarUrl={lesson?.student?.avatarUrl}
                  role="STUDENT"
                  isLocal={!isTutor}
                  isConnected={!isTutor || isRemoteConnected}
                  isSpeaking={false}
                  isMuted={!isTutor ? !isMicEnabled : !isRemoteConnected}
                  isVideoOff={!isTutor ? !isCameraEnabled : !isRemoteConnected}
                  trophiesCount={studentTrophies}
                  isHandRaised={isHandRaised}
                  onToggleMic={!isTutor ? handleToggleMic : undefined}
                  onToggleCamera={!isTutor ? handleToggleCamera : undefined}
                  canModerate={isTutor}
                  isWhiteboardAuthorized={isWhiteboardAuthorized}
                  onToggleWhiteboardAuth={isTutor ? handleToggleWhiteboardAuth : undefined}
                  onRemoteMuteStudent={isTutor ? handleRemoteMuteStudent : undefined}
                  onAwardTrophy={isTutor ? () => handleAwardTrophy("Great job!") : undefined}
                  videoElement={!isTutor ? renderLocalVideo() : renderRemoteVideo()}
                />
              </div>

              {/* Interactive Multi-Tool Whiteboard */}
              <div className="flex-1 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative bg-white">
                <InteractiveWhiteboard
                  isTutor={isTutor}
                  isAuthorized={isWhiteboardAuthorized}
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
                    displayName={isTutor ? `${tutorName} (You)` : tutorName}
                    avatarUrl={lesson?.tutor?.avatarUrl}
                    role="TUTOR"
                    isLocal={isTutor}
                    isConnected={isTutor || isRemoteConnected}
                    isMuted={isTutor ? !isMicEnabled : !isRemoteConnected}
                    isVideoOff={isTutor ? !isCameraEnabled : !isRemoteConnected}
                    onToggleMic={isTutor ? handleToggleMic : undefined}
                    onToggleCamera={isTutor ? handleToggleCamera : undefined}
                    className="w-full h-full"
                    videoElement={isTutor ? renderLocalVideo() : renderRemoteVideo()}
                  />
                </div>
                <div className="flex-1 rounded-3xl overflow-hidden border border-slate-800">
                  <ParticipantVideoCard
                    displayName={!isTutor ? `${studentName} (You)` : studentName}
                    avatarUrl={lesson?.student?.avatarUrl}
                    role="STUDENT"
                    isLocal={!isTutor}
                    isConnected={!isTutor || isRemoteConnected}
                    trophiesCount={studentTrophies}
                    isHandRaised={isHandRaised}
                    isMuted={!isTutor ? !isMicEnabled : !isRemoteConnected}
                    isVideoOff={!isTutor ? !isCameraEnabled : !isRemoteConnected}
                    onToggleMic={!isTutor ? handleToggleMic : undefined}
                    onToggleCamera={!isTutor ? handleToggleCamera : undefined}
                    canModerate={isTutor}
                    isWhiteboardAuthorized={isWhiteboardAuthorized}
                    onToggleWhiteboardAuth={isTutor ? handleToggleWhiteboardAuth : undefined}
                    onRemoteMuteStudent={isTutor ? handleRemoteMuteStudent : undefined}
                    className="w-full h-full"
                    onAwardTrophy={isTutor ? () => handleAwardTrophy("Excellent answer!") : undefined}
                    videoElement={!isTutor ? renderLocalVideo() : renderRemoteVideo()}
                  />
                </div>
              </div>

              {/* Right: Whiteboard */}
              <div className="flex-1 rounded-3xl overflow-hidden border border-slate-800 bg-white shadow-2xl">
                <InteractiveWhiteboard
                  isTutor={isTutor}
                  isAuthorized={isWhiteboardAuthorized}
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
                displayName={isTutor ? `${tutorName} (You)` : tutorName}
                avatarUrl={lesson?.tutor?.avatarUrl}
                role="TUTOR"
                isLocal={isTutor}
                isConnected={isTutor || isRemoteConnected}
                isMuted={isTutor ? !isMicEnabled : !isRemoteConnected}
                isVideoOff={isTutor ? !isCameraEnabled : !isRemoteConnected}
                onToggleMic={isTutor ? handleToggleMic : undefined}
                onToggleCamera={isTutor ? handleToggleCamera : undefined}
                className="w-full h-full rounded-3xl"
                videoElement={isTutor ? renderLocalVideo() : renderRemoteVideo()}
              />
              <ParticipantVideoCard
                displayName={!isTutor ? `${studentName} (You)` : studentName}
                avatarUrl={lesson?.student?.avatarUrl}
                role="STUDENT"
                isLocal={!isTutor}
                isConnected={!isTutor || isRemoteConnected}
                trophiesCount={studentTrophies}
                isHandRaised={isHandRaised}
                isMuted={!isTutor ? !isMicEnabled : !isRemoteConnected}
                isVideoOff={!isTutor ? !isCameraEnabled : !isRemoteConnected}
                onToggleMic={!isTutor ? handleToggleMic : undefined}
                onToggleCamera={!isTutor ? handleToggleCamera : undefined}
                canModerate={isTutor}
                isWhiteboardAuthorized={isWhiteboardAuthorized}
                onToggleWhiteboardAuth={isTutor ? handleToggleWhiteboardAuth : undefined}
                onRemoteMuteStudent={isTutor ? handleRemoteMuteStudent : undefined}
                className="w-full h-full rounded-3xl"
                onAwardTrophy={isTutor ? () => handleAwardTrophy("Great insight!") : undefined}
                videoElement={!isTutor ? renderLocalVideo() : renderRemoteVideo()}
              />
            </div>
          )}

          {/* LAYOUT 4: SCREEN SHARE PRESENTATION */}
          {(layoutMode === "screenshare" || (remoteScreenTrack && layoutMode !== "grid")) && (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              {/* Top Mini Video Strip */}
              <div className="grid grid-cols-2 gap-3 h-32 shrink-0">
                <ParticipantVideoCard
                  displayName={isTutor ? `${tutorName} (You)` : tutorName}
                  avatarUrl={lesson?.tutor?.avatarUrl}
                  role="TUTOR"
                  isLocal={isTutor}
                  isConnected={isTutor || isRemoteConnected}
                  isMuted={isTutor ? !isMicEnabled : !isRemoteConnected}
                  isVideoOff={isTutor ? !isCameraEnabled : !isRemoteConnected}
                  onToggleMic={isTutor ? handleToggleMic : undefined}
                  onToggleCamera={isTutor ? handleToggleCamera : undefined}
                  videoElement={isTutor ? renderLocalVideo() : renderRemoteVideo()}
                />
                <ParticipantVideoCard
                  displayName={!isTutor ? `${studentName} (You)` : studentName}
                  avatarUrl={lesson?.student?.avatarUrl}
                  role="STUDENT"
                  isLocal={!isTutor}
                  isConnected={!isTutor || isRemoteConnected}
                  trophiesCount={studentTrophies}
                  isHandRaised={isHandRaised}
                  isMuted={!isTutor ? !isMicEnabled : !isRemoteConnected}
                  isVideoOff={!isTutor ? !isCameraEnabled : !isRemoteConnected}
                  onToggleMic={!isTutor ? handleToggleMic : undefined}
                  onToggleCamera={!isTutor ? handleToggleCamera : undefined}
                  canModerate={isTutor}
                  isWhiteboardAuthorized={isWhiteboardAuthorized}
                  onToggleWhiteboardAuth={isTutor ? handleToggleWhiteboardAuth : undefined}
                  onRemoteMuteStudent={isTutor ? handleRemoteMuteStudent : undefined}
                  videoElement={!isTutor ? renderLocalVideo() : renderRemoteVideo()}
                />
              </div>

              {/* Main Presentation Screen */}
              <div className="flex-1 rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col relative shadow-2xl">
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700 text-xs font-bold text-sky-400">
                  <Monitor className="h-4 w-4" />
                  <span>{isScreenSharing ? "You are presenting your screen" : "Participant is sharing their screen"}</span>
                </div>

                {screenShareTrack ? (
                  <VideoTrack trackRef={screenShareTrack} className="w-full h-full object-contain bg-black" />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Monitor className="h-10 w-10 text-slate-600 animate-pulse" />
                    <p className="text-xs">Preparing screen presentation stream...</p>
                  </div>
                )}
              </div>
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

  // Waiting Room state
  const [bypassedWaitingRoom, setBypassedWaitingRoom] = React.useState(false);

  // Lesson Countdown Timer
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
          // Dynamic timer based on actual lesson duration and scheduled end time
          const duration = les.durationMinutes || 50;
          if (les.scheduledEnd) {
            const endMs = new Date(les.scheduledEnd).getTime();
            const diffSec = Math.floor((endMs - Date.now()) / 1000);
            setSecondsRemaining(diffSec > 0 ? diffSec : duration * 60);
          } else {
            setSecondsRemaining(duration * 60);
          }

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

    // Lesson Countdown Interval
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

  // Track whether student ever connected in session for quality of service guard
  const [hasStudentAttended, setHasStudentAttended] = React.useState(false);

  // ─── Hardware Release on Leaving or Ending ───
  const releaseHardwareTracks = () => {
    try {
      const videoEls = document.querySelectorAll("video, audio");
      videoEls.forEach((el: any) => {
        if (el.srcObject) {
          el.srcObject.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
          });
          el.srcObject = null;
        }
      });
    } catch (e) {
      console.warn("Hardware track release error:", e);
    }
  };

  // Safe Exit without altering lesson completion status
  const handleLeaveClassroom = () => {
    releaseHardwareTracks();
    if (currentUserRole === "TUTOR") {
      window.location.href = `/tutor/lessons/${lesson?.id || ""}`;
    } else {
      window.location.href = `/student/lessons/${lesson?.id || ""}`;
    }
  };

  // Conclude & Complete Lesson (Marks completed and credits metrics)
  const handleCompleteLesson = async () => {
    if (!lesson) return;
    setIsEnding(true);
    releaseHardwareTracks();

    try {
      await lessonService.completeLesson(lesson.id, {
        studentFeedback: feedbackNotes || "Completed 1-on-1 teaching session.",
      });
    } catch (e) {
      console.warn("Failed to complete lesson:", e);
    }

    setIsEnding(false);
    setIsEndModalOpen(false);

    // Clean redirection
    if (currentUserRole === "TUTOR") {
      window.location.href = `/tutor/lessons/${lesson.id}`;
    } else {
      window.location.href = `/student/lessons/${lesson.id}`;
    }
  };

  const providerMeta = PROVIDER_META[activeProvider];
  const isTutor = currentUserRole === "TUTOR";
  const currentUserName = isTutor
    ? lesson?.tutor?.displayName || "Dr. Elena Rostova"
    : lesson?.student?.displayName || "Alex Rivera";

  // Check early arrival for student waiting room
  const scheduledStartMs = lesson?.scheduledStart ? new Date(lesson.scheduledStart).getTime() : 0;
  const earlyMinutes = 15;
  const isEarlyArrival =
    !isTutor &&
    scheduledStartMs > 0 &&
    Date.now() < scheduledStartMs - earlyMinutes * 60 * 1000 &&
    !bypassedWaitingRoom;

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

  // Pre-Class Waiting Room Screen if arriving > 15m early
  if (isEarlyArrival && lesson) {
    return (
      <PreClassWaitingRoom
        lesson={lesson}
        earlyJoinMinutes={earlyMinutes}
        onEnterClassroom={() => setBypassedWaitingRoom(true)}
        isTutor={isTutor}
      />
    );
  }

  // Quality of service indicators
  const isBeforeClass = scheduledStartMs > 0 && Date.now() < scheduledStartMs;
  const isStudentPresentOrAttended = hasStudentAttended;
  const endButtonLabel = isBeforeClass || !isStudentPresentOrAttended ? "Leave Room" : "End Class";

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
              onStudentConnected={() => setHasStudentAttended(true)}
              endButtonLabel={endButtonLabel}
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
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Launch Meeting ({providerMeta.label})</span>
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── CLASSROOM EXIT & QUALITY SERVICE GUARD MODAL ─── */}
      <Modal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title={
          isBeforeClass
            ? "Leave Classroom Preview"
            : !isStudentPresentOrAttended
            ? "Student Not in Classroom"
            : "Conclude Classroom Session"
        }
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* Scenario 1: Early Preview before Scheduled Class */}
          {isBeforeClass ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    This lesson is scheduled for{" "}
                    {lesson?.scheduledStart
                      ? new Date(lesson.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "a later time"}
                    .
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    You are previewing the classroom before the session has started. Leaving will safely turn off your camera and return to the dashboard. The lesson remains scheduled.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="outline" size="sm" onClick={() => setIsEndModalOpen(false)} className="text-xs">
                  Stay in Classroom
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleLeaveClassroom}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Leave Classroom
                </Button>
              </div>
            </div>
          ) : !isStudentPresentOrAttended ? (
            /* Scenario 2: Class time is active, but student has NOT joined */
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Student has not joined this session yet.</p>
                  <p className="text-slate-400 leading-relaxed">
                    To protect service quality and fair billing, lessons cannot be marked as completed when the student is absent. You can leave now without affecting the schedule.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="outline" size="sm" onClick={() => setIsEndModalOpen(false)} className="text-xs">
                  Keep Waiting
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleLeaveClassroom}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700"
                >
                  Leave Room (Keep Scheduled)
                </Button>
              </div>
            </div>
          ) : (
            /* Scenario 3: Standard Conclude Lesson (Student Attended) */
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you ready to finalize this 1-on-1 teaching session? This will complete the lesson, record student notes, and update lesson records.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  Session Summary & Takeaway Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Key concepts covered, student strengths, or homework guidance..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLeaveClassroom}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Leave Temporarily
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEndModalOpen(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCompleteLesson}
                    disabled={isEnding}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    {isEnding ? "Concluding..." : "Yes, Complete Lesson"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
