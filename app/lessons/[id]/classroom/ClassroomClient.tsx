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
import { Track, RoomEvent, ConnectionQuality } from "livekit-client";
import {
  Clock,
  CheckCircle2,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  Monitor,
  WifiOff,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { useModal } from "@/components/ui/modal-context";
import { lessonService } from "@/services/lessonService";
import { Lesson360Aggregate } from "@/src/modules/lessons/domain/types";
import { VideoProviderType } from "@/src/modules/video/types/videoProviderTypes";

// ClassIn Components
import { ClassroomHeader, StageLayoutMode } from "@/components/classroom/ClassroomHeader";
import {
  InteractiveWhiteboard,
  StrokeElement,
  BackgroundType,
  WhiteboardSyncSnapshot,
} from "@/components/classroom/InteractiveWhiteboard";
import { ParticipantVideoCard } from "@/components/classroom/ParticipantVideoCard";
import { ClassinToolsWidget } from "@/components/classroom/ClassinToolsWidget";
import { ClassroomSidebar, ChatMessage, MaterialFile } from "@/components/classroom/ClassroomSidebar";
import { CelebrationOverlay } from "@/components/classroom/CelebrationOverlay";
import { DeviceSettingsModal } from "@/components/classroom/DeviceSettingsModal";
import { PreClassWaitingRoom } from "@/components/classroom/PreClassWaitingRoom";
import { MobileClassroomDock } from "@/components/classroom/MobileClassroomDock";

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
 * Handles real-time video tracks, stage layout transitions, and dual-transport (LiveKit + API) sync.
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
  onExtendLesson,
  isExtending = false,
  onTimeExtended,
  scheduledEnd,
  onTimerResync,
  connectionError,
  onDismissConnectionError,
  mediaDeviceWarning,
  initialWhiteboardState,
  initialChatMessages,
}: {
  lesson: Lesson360Aggregate;
  isTutor: boolean;
  currentUserName: string;
  currentUserRole: "TUTOR" | "STUDENT";
  onEndLesson: () => void;
  secondsRemaining: number;
  onStudentConnected?: () => void;
  endButtonLabel?: string;
  onExtendLesson?: (minutes: number) => void;
  isExtending?: boolean;
  onTimeExtended?: (additionalSeconds: number) => void;
  scheduledEnd?: string;
  onTimerResync?: (newSecondsRemaining: number) => void;
  connectionError?: string | null;
  onDismissConnectionError?: () => void;
  mediaDeviceWarning?: boolean;
  initialWhiteboardState?: any;
  initialChatMessages?: ChatMessage[];
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);
  const screenShareTrack = screenShareTracks.find((t) => t.source === Track.Source.ScreenShare);

  // Reconnection overlay state
  const [isReconnecting, setIsReconnecting] = React.useState(false);

  // ─── LiveKit Reconnection Resilience ───
  React.useEffect(() => {
    if (!room) return;

    const handleReconnecting = () => {
      setIsReconnecting(true);
    };

    const handleReconnected = () => {
      setIsReconnecting(false);
      if (scheduledEnd && onTimerResync) {
        const endMs = new Date(scheduledEnd).getTime();
        const newRemaining = Math.floor((endMs - Date.now()) / 1000);
        onTimerResync(newRemaining);
      }
    };

    const handleDisconnected = () => {
      setIsReconnecting(false);
    };

    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, scheduledEnd, onTimerResync]);

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

  // Local media stream fallback
  const [localMediaStream, setLocalMediaStream] = React.useState<MediaStream | null>(null);

  // Floating moderation toast banner
  const [moderationToast, setModerationToast] = React.useState<string | null>(null);

  // Stage Layout mode
  const [layoutMode, setLayoutMode] = React.useState<StageLayoutMode>("classin_stage");

  // ─── Whiteboard Real-Time Sync State ───
  const [wbStrokes, setWbStrokes] = React.useState<StrokeElement[]>(
    Array.isArray(initialWhiteboardState?.strokes) ? initialWhiteboardState.strokes : []
  );
  const [wbLiveStroke, setWbLiveStroke] = React.useState<StrokeElement | null>(null);
  const [wbLaserPoint, setWbLaserPoint] = React.useState<{
    nx: number;
    ny: number;
    authorName?: string;
  } | null>(null);
  const [wbPage, setWbPage] = React.useState<number>(initialWhiteboardState?.currentPage || 1);
  const [wbTotalPages, setWbTotalPages] = React.useState<number>(
    initialWhiteboardState?.totalPages || 1
  );
  const [wbBgType, setWbBgType] = React.useState<BackgroundType>(
    initialWhiteboardState?.backgroundType || initialWhiteboardState?.bgType || "math_grid"
  );
  const [wbStateVersion, setWbStateVersion] = React.useState<number>(1);
  // Default student whiteboard authorization to TRUE so both parties can draw immediately unless tutor locks it
  const [isWhiteboardAuthorized, setIsWhiteboardAuthorized] = React.useState<boolean>(
    initialWhiteboardState?.isStudentAuthorized !== undefined
      ? Boolean(initialWhiteboardState.isStudentAuthorized)
      : true
  );
  const lastWbUpdatedAtRef = React.useRef<number>(initialWhiteboardState?.updatedAt || 0);

  // ─── Collaborative Live Notes & Materials State ───
  const [sharedNotes, setSharedNotes] = React.useState<string>(lesson?.lessonNotes || "");
  const [notesSyncStatus, setNotesSyncStatus] = React.useState<"synced" | "saving" | "live">("synced");
  const [lastNotesEditor, setLastNotesEditor] = React.useState<string | undefined>(undefined);
  const lastLocalNotesEditMsRef = React.useRef<number>(0);
  const notesSaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [materialsList, setMaterialsList] = React.useState<MaterialFile[]>(
    (lesson?.materials as MaterialFile[]) || []
  );

  // Gamification & ClassIn tools state
  const [studentTrophies, setStudentTrophies] = React.useState(0);
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [celebrationMessage, setCelebrationMessage] = React.useState("");
  const [isHandRaised, setIsHandRaised] = React.useState(false);

  // Synced countdown timer & dice state
  const [syncedTimer, setSyncedTimer] = React.useState<
    { isRunning: boolean; seconds: number } | undefined
  >(undefined);
  const [syncedDice, setSyncedDice] = React.useState<
    { value: number; rolledBy?: string; timestamp: number } | undefined
  >(undefined);
  const [toolTimerOpen, setToolTimerOpen] = React.useState(false);
  const [toolDiceOpen, setToolDiceOpen] = React.useState(false);

  // Side Panel & Chat state (Open by default on desktop, closed on mobile)
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarTab, setSidebarTab] = React.useState<"chat" | "notes" | "files">("chat");

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  const defaultSystemMsg: ChatMessage = React.useMemo(
    () => ({
      id: "sys-1",
      sender: "System",
      senderRole: "SYSTEM",
      text: "Interactive ClassIn-grade teaching session initialized.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }),
    []
  );

  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(() => {
    if (Array.isArray(initialChatMessages) && initialChatMessages.length > 0) {
      return [defaultSystemMsg, ...initialChatMessages];
    }
    return [defaultSystemMsg];
  });

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

  // ─── Persist Classroom State Helper (API Backend Sync) ───
  const persistClassroomPatch = React.useCallback(
    async (payload: Record<string, any>) => {
      if (!lesson?.id) return;
      try {
        await fetch(`/api/classroom/lesson/${lesson.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("[Classroom] Persist patch warning:", err);
      }
    },
    [lesson?.id]
  );

  // ─── Broadcast Helper over LiveKit Data Channel ───
  const broadcastData = React.useCallback(
    (data: any, reliable = true) => {
      if (!room || !localParticipant) return;
      try {
        const payload = new TextEncoder().encode(JSON.stringify(data));
        localParticipant.publishData(payload, { reliable });
      } catch (err) {
        console.warn("Failed to broadcast data channel message:", err);
      }
    },
    [room, localParticipant]
  );

  // Keep refs of current state so newly connected peers can receive full state immediately
  const wbStateRef = React.useRef({
    strokes: wbStrokes,
    currentPage: wbPage,
    totalPages: wbTotalPages,
    bgType: wbBgType,
    isStudentAuthorized: isWhiteboardAuthorized,
    sharedNotes,
  });
  React.useEffect(() => {
    wbStateRef.current = {
      strokes: wbStrokes,
      currentPage: wbPage,
      totalPages: wbTotalPages,
      bgType: wbBgType,
      isStudentAuthorized: isWhiteboardAuthorized,
      sharedNotes,
    };
  }, [wbStrokes, wbPage, wbTotalPages, wbBgType, isWhiteboardAuthorized, sharedNotes]);

  // ─── Subscribe to LiveKit Data Channel Messages ───
  React.useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);

        if (data.type === "STROKE_LIVE") {
          setWbLiveStroke(data.stroke || null);
        } else if (data.type === "STROKE") {
          setWbLiveStroke(null);
          if (data.stroke) {
            setWbStrokes((prev) => {
              if (prev.some((s) => s.id === data.stroke.id)) return prev;
              return [...prev, data.stroke];
            });
          }
        } else if (data.type === "LASER_MOVE") {
          setWbLaserPoint(data.point || null);
        } else if (data.type === "WHITEBOARD_STATE") {
          const snap = data.snapshot;
          if (snap) {
            lastWbUpdatedAtRef.current = snap.updatedAt || Date.now();
            setWbStrokes(Array.isArray(snap.strokes) ? snap.strokes : []);
            if (snap.currentPage) setWbPage(snap.currentPage);
            if (snap.totalPages) setWbTotalPages(snap.totalPages);
            if (snap.backgroundType || snap.bgType) {
              setWbBgType(snap.backgroundType || snap.bgType);
            }
            setWbStateVersion((v) => v + 1);
            setWbLiveStroke(null);
          }
        } else if (data.type === "NOTES_SYNC") {
          if (typeof data.notes === "string") {
            setSharedNotes(data.notes);
            setLastNotesEditor(data.editor || "Peer");
            setNotesSyncStatus("live");
          }
        } else if (data.type === "MATERIAL_ADDED") {
          if (data.material) {
            setMaterialsList((prev) => {
              if (prev.some((m) => m.id === data.material.id || m.url === data.material.url)) {
                return prev;
              }
              return [...prev, data.material];
            });
            setModerationToast(`📎 ${data.sender || "Participant"} shared "${data.material.name}"`);
            setTimeout(() => setModerationToast(null), 4000);
          }
        } else if (data.type === "DICE_ROLL") {
          setSyncedDice({
            value: data.value,
            rolledBy: data.rolledBy,
            timestamp: data.timestamp || Date.now(),
          });
          setToolDiceOpen(true);
        } else if (data.type === "REQUEST_SYNC") {
          // Respond with current classroom state
          const cur = wbStateRef.current;
          broadcastData({
            type: "FULL_SYNC_RESPONSE",
            snapshot: {
              strokes: cur.strokes,
              currentPage: cur.currentPage,
              totalPages: cur.totalPages,
              bgType: cur.bgType,
              isStudentAuthorized: cur.isStudentAuthorized,
              updatedAt: Date.now(),
            },
            notes: cur.sharedNotes,
          });
        } else if (data.type === "FULL_SYNC_RESPONSE") {
          if (data.snapshot) {
            setWbStrokes(Array.isArray(data.snapshot.strokes) ? data.snapshot.strokes : []);
            if (data.snapshot.currentPage) setWbPage(data.snapshot.currentPage);
            if (data.snapshot.totalPages) setWbTotalPages(data.snapshot.totalPages);
            if (data.snapshot.bgType) setWbBgType(data.snapshot.bgType);
            if (data.snapshot.isStudentAuthorized !== undefined) {
              setIsWhiteboardAuthorized(Boolean(data.snapshot.isStudentAuthorized));
            }
            setWbStateVersion((v) => v + 1);
          }
          if (typeof data.notes === "string" && data.notes.length > 0) {
            setSharedNotes((prev) => (prev ? prev : data.notes));
          }
        } else if (data.type === "TROPHY") {
          setStudentTrophies((prev) => prev + 1);
          setCelebrationMessage(data.message || "Great work!");
          setShowCelebration(true);
        } else if (data.type === "HAND_RAISE") {
          setIsHandRaised(data.isRaised);
          if (data.isRaised && isTutor) {
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
          setToolTimerOpen(true);
        } else if (data.type === "WHITEBOARD_AUTH") {
          setIsWhiteboardAuthorized(data.isAuthorized);
          setModerationToast(
            data.isAuthorized
              ? "✏️ Tutor enabled collaborative whiteboard drawing."
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
          const msgId = data.id || `msg-${Date.now()}-${Math.random()}`;
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === msgId)) return prev;
            return [
              ...prev,
              {
                id: msgId,
                sender: data.sender,
                senderRole: data.senderRole,
                text: data.text,
                time:
                  data.time ||
                  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ];
          });
        } else if (data.type === "LESSON_EXTENDED") {
          onTimeExtended?.(data.additionalSeconds || (data.additionalMinutes || 10) * 60);
          setModerationToast(
            `⏰ Lesson extended by ${data.additionalMinutes || 10} minutes by Tutor!`
          );
          setTimeout(() => setModerationToast(null), 5000);
        } else if (data.type === "CLASS_ENDED_BY_TUTOR") {
          setModerationToast("👋 Class concluded by Tutor. Redirecting...");
          setTimeout(() => {
            window.location.href = `/student/lessons/${lesson?.id || ""}`;
          }, 1800);
        }
      } catch (err) {
        console.warn("Failed to parse data message:", err);
      }
    };

    room.on("dataReceived", handleDataReceived);
    return () => {
      room.off("dataReceived", handleDataReceived);
    };
  }, [room, isTutor, localParticipant, localMediaStream, lesson?.id, onTimeExtended, broadcastData]);

  // Request sync when joining or when remote participant connects
  React.useEffect(() => {
    if (!room || !localParticipant) return;
    const timer = setTimeout(() => {
      broadcastData({ type: "REQUEST_SYNC" });
    }, 1200);
    return () => clearTimeout(timer);
  }, [room, localParticipant, participants.length, broadcastData]);

  // ─── Lightweight Polling Fallback (Guarantees sync even if WebRTC DataChannel drops) ───
  React.useEffect(() => {
    if (!lesson?.id) return;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/classroom/lesson/${lesson.id}?syncOnly=1`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();

        // 1. Sync Live Notes if not typed locally in the last 2.5 seconds
        if (
          typeof data.lessonNotes === "string" &&
          Date.now() - lastLocalNotesEditMsRef.current > 2500
        ) {
          setSharedNotes((prev) => (prev !== data.lessonNotes ? data.lessonNotes : prev));
        }

        // 2. Sync Whiteboard state if newer than our local version
        const remoteWb = data.whiteboardState;
        if (remoteWb && typeof remoteWb === "object") {
          const remoteTs = remoteWb.updatedAt || 0;
          if (
            remoteTs > lastWbUpdatedAtRef.current ||
            (Array.isArray(remoteWb.strokes) &&
              remoteWb.strokes.length !== wbStateRef.current.strokes.length &&
              remoteTs >= lastWbUpdatedAtRef.current)
          ) {
            lastWbUpdatedAtRef.current = remoteTs;
            if (Array.isArray(remoteWb.strokes)) {
              setWbStrokes(remoteWb.strokes);
            }
            if (remoteWb.currentPage) setWbPage(remoteWb.currentPage);
            if (remoteWb.totalPages) setWbTotalPages(remoteWb.totalPages);
            if (remoteWb.bgType) setWbBgType(remoteWb.bgType);
            if (remoteWb.isStudentAuthorized !== undefined) {
              setIsWhiteboardAuthorized(Boolean(remoteWb.isStudentAuthorized));
            }
            setWbStateVersion((v) => v + 1);
          }
        }

        // 3. Sync Chat messages
        if (Array.isArray(data.chatMessages) && data.chatMessages.length > 0) {
          setChatMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newItems = data.chatMessages.filter((m: ChatMessage) => m?.id && !existingIds.has(m.id));
            if (newItems.length === 0) return prev;
            return [...prev, ...newItems];
          });
        }

        // 4. Sync Shared Files / Materials
        if (Array.isArray(data.materials) && data.materials.length > 0) {
          setMaterialsList((prev) => {
            if (data.materials.length === prev.length) return prev;
            return data.materials;
          });
        }
      } catch {}
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [lesson?.id]);

  // ─── Whiteboard Event Handlers ───
  const handleBroadcastLiveStroke = React.useCallback(
    (stroke: StrokeElement | null) => {
      broadcastData({ type: "STROKE_LIVE", stroke }, false);
    },
    [broadcastData]
  );

  const handleBroadcastLaser = React.useCallback(
    (point: { nx: number; ny: number; authorName?: string } | null) => {
      broadcastData({ type: "LASER_MOVE", point }, false);
    },
    [broadcastData]
  );

  const handleBroadcastStroke = React.useCallback(
    (stroke: StrokeElement) => {
      broadcastData({ type: "STROKE", stroke }, true);
      setWbStrokes((prev) => {
        const next = prev.some((s) => s.id === stroke.id) ? prev : [...prev, stroke];
        const now = Date.now();
        lastWbUpdatedAtRef.current = now;
        persistClassroomPatch({
          whiteboardState: {
            strokes: next,
            currentPage: wbStateRef.current.currentPage,
            totalPages: wbStateRef.current.totalPages,
            bgType: wbStateRef.current.bgType,
            isStudentAuthorized: wbStateRef.current.isStudentAuthorized,
            updatedAt: now,
          },
        });
        return next;
      });
    },
    [broadcastData, persistClassroomPatch]
  );

  const handleSyncWhiteboardState = React.useCallback(
    (snapshot: WhiteboardSyncSnapshot) => {
      const now = Date.now();
      lastWbUpdatedAtRef.current = now;
      setWbStrokes(snapshot.strokes);
      setWbPage(snapshot.currentPage);
      setWbTotalPages(snapshot.totalPages);
      setWbBgType(snapshot.backgroundType);

      const enriched = {
        ...snapshot,
        bgType: snapshot.backgroundType,
        isStudentAuthorized: isWhiteboardAuthorized,
        updatedAt: now,
      };
      broadcastData({ type: "WHITEBOARD_STATE", snapshot: enriched }, true);
      persistClassroomPatch({ whiteboardState: enriched });
    },
    [broadcastData, isWhiteboardAuthorized, persistClassroomPatch]
  );

  // ─── Live Notes Event Handlers ───
  const handleChangeNotes = React.useCallback(
    (nextNotes: string) => {
      setSharedNotes(nextNotes);
      lastLocalNotesEditMsRef.current = Date.now();
      setNotesSyncStatus("saving");
      setLastNotesEditor(currentUserName);

      // Instant WebRTC broadcast
      broadcastData(
        {
          type: "NOTES_SYNC",
          notes: nextNotes,
          editor: currentUserName,
        },
        true
      );

      // Debounced DB save (600ms)
      if (notesSaveTimeoutRef.current) {
        clearTimeout(notesSaveTimeoutRef.current);
      }
      notesSaveTimeoutRef.current = setTimeout(async () => {
        await persistClassroomPatch({ lessonNotes: nextNotes });
        setNotesSyncStatus("synced");
      }, 600);
    },
    [broadcastData, currentUserName, persistClassroomPatch]
  );

  const handleSaveNotesNow = React.useCallback(
    async (notesToSave: string) => {
      setNotesSyncStatus("saving");
      broadcastData(
        {
          type: "NOTES_SYNC",
          notes: notesToSave,
          editor: currentUserName,
        },
        true
      );
      await persistClassroomPatch({ lessonNotes: notesToSave });
      setNotesSyncStatus("synced");
    },
    [broadcastData, currentUserName, persistClassroomPatch]
  );

  // ─── File / Material Upload Handler ───
  const handleUploadMaterial = React.useCallback(
    async (mat: { name: string; url: string; sizeBytes?: number; fileType?: string }) => {
      const newMat: MaterialFile = {
        id: `mat-${Date.now()}`,
        name: mat.name,
        url: mat.url,
        sizeBytes: mat.sizeBytes,
        fileType: mat.fileType,
        uploadedByRole: currentUserRole,
      };
      setMaterialsList((prev) => [...prev, newMat]);
      broadcastData(
        {
          type: "MATERIAL_ADDED",
          material: newMat,
          sender: currentUserName,
        },
        true
      );
      await persistClassroomPatch({ material: newMat });
    },
    [broadcastData, currentUserName, currentUserRole, persistClassroomPatch]
  );

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

  // Dice Roll Synchronization
  const handleSyncDice = (value: number) => {
    const payload = { value, rolledBy: currentUserName, timestamp: Date.now() };
    setSyncedDice(payload);
    broadcastData({ type: "DICE_ROLL", ...payload });
  };

  // Send In-Class Chat Message
  const handleSendChatMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: currentUserName,
      senderRole: currentUserRole,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    broadcastData({
      type: "CHAT",
      id: newMsg.id,
      sender: currentUserName,
      senderRole: currentUserRole,
      text,
      time: newMsg.time,
    });
    persistClassroomPatch({ chatMessage: newMsg });
  };

  // Media Toggles
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
    const now = Date.now();
    lastWbUpdatedAtRef.current = now;
    persistClassroomPatch({
      whiteboardState: {
        strokes: wbStrokes,
        currentPage: wbPage,
        totalPages: wbTotalPages,
        bgType: wbBgType,
        isStudentAuthorized: next,
        updatedAt: now,
      },
    });
    setModerationToast(
      next
        ? "✏️ Authorized student to draw on whiteboard."
        : "🔒 Locked student whiteboard in view-only mode."
    );
    setTimeout(() => setModerationToast(null), 3000);
  };

  // Tracks query
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  const tutorName = lesson?.tutor?.displayName || "Instructor";
  const studentName = lesson?.student?.displayName || "Student";
  const durationMin = lesson?.durationMinutes || 50;
  const isTrial = durationMin <= 30;

  // Identify Local & Remote video tracks
  const localCameraTrack = tracks.find(
    (t) => t.participant.isLocal && t.source === Track.Source.Camera
  );
  const remoteCameraTrack = tracks.find(
    (t) => !t.participant.isLocal && t.source === Track.Source.Camera
  );
  const remoteScreenTrack = tracks.find(
    (t) => !t.participant.isLocal && t.source === Track.Source.ScreenShare
  );
  const hasAnyScreenShare = Boolean(isScreenSharing || screenShareTrack || remoteScreenTrack);

  // Auto-switch to "screenshare" layout when remote participant starts sharing screen,
  // and return to "classin_stage" when remote screen sharing ends.
  const hadRemoteScreenRef = React.useRef(false);
  React.useEffect(() => {
    const hasRemoteScreen = Boolean(remoteScreenTrack);
    if (hasRemoteScreen && !hadRemoteScreenRef.current) {
      hadRemoteScreenRef.current = true;
      setLayoutMode("screenshare");
    } else if (!hasRemoteScreen && hadRemoteScreenRef.current) {
      hadRemoteScreenRef.current = false;
      if (!isScreenSharing) {
        setLayoutMode("classin_stage");
      }
    }
  }, [remoteScreenTrack, isScreenSharing]);

  // Check if remote peer is actually connected
  const remoteParticipant = participants.find((p) => !p.isLocal);
  const isRemoteConnected = !!remoteParticipant;

  // ─── Network Quality ───
  const [localQuality, setLocalQuality] = React.useState<ConnectionQuality | undefined>(
    localParticipant?.connectionQuality
  );
  const [remoteQuality, setRemoteQuality] = React.useState<ConnectionQuality | undefined>(
    remoteParticipant?.connectionQuality
  );

  React.useEffect(() => {
    if (!room) return;

    const updateQualities = () => {
      setLocalQuality(localParticipant?.connectionQuality);
      setRemoteQuality(remoteParticipant?.connectionQuality);
    };

    updateQualities();
    room.on(RoomEvent.ConnectionQualityChanged, updateQualities);
    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, updateQualities);
    };
  }, [room, localParticipant, remoteParticipant]);

  const mapQuality = (
    q: ConnectionQuality | undefined
  ): "excellent" | "good" | "poor" | "lost" | undefined => {
    if (q === ConnectionQuality.Excellent) return "excellent";
    if (q === ConnectionQuality.Good) return "good";
    if (q === ConnectionQuality.Poor) return "poor";
    if (q === ConnectionQuality.Lost) return "lost";
    return undefined;
  };

  const localConnectionQuality = mapQuality(localQuality);
  const remoteConnectionQuality = mapQuality(remoteQuality);

  // Render Local Video element
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

  const handleOpenLiveNotes = () => {
    setSidebarTab("notes");
    setSidebarOpen(true);
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
        hasActiveScreenShare={hasAnyScreenShare}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onToggleScreenShare={handleToggleScreenShare}
        isTutor={isTutor}
        onExtendLesson={onExtendLesson}
        isExtending={isExtending}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenNotes={handleOpenLiveNotes}
        sidebarOpen={sidebarOpen}
      />

      {/* ─── FLOATING MODERATION TOAST BANNER ─── */}
      {moderationToast && (
        <div className="absolute top-15 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/95 border border-slate-700 text-white px-4 py-2 rounded-2xl shadow-2xl font-bold text-xs animate-in fade-in slide-in-from-top-2">
          <span>{moderationToast}</span>
        </div>
      )}

      {/* ─── RECONNECTION OVERLAY ─── */}
      {isReconnecting && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-slate-900 border border-amber-500/50 rounded-2xl px-8 py-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <WifiOff className="w-6 h-6 text-amber-400 animate-pulse" />
              <span className="text-white font-bold text-base">Reconnecting to class...</span>
            </div>
            <p className="text-slate-400 text-xs text-center max-w-xs">
              Your connection was interrupted. Rejoining the session automatically — your lesson time is preserved.
            </p>
          </div>
        </div>
      )}

      {/* ─── LIVEKIT CONNECTION DIAGNOSTIC BANNER ─── */}
      {connectionError &&
        !connectionError.includes("Cancelled publication") &&
        !connectionError.includes("calling unpublish") && (
          <div className="absolute top-15 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-rose-950/95 border border-rose-700/80 text-white px-5 py-2.5 rounded-2xl shadow-2xl max-w-xl text-xs animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-bold text-rose-200">Video Server Connection Warning</p>
              <p className="text-rose-300/80 text-[11px] mt-0.5">
                {connectionError.includes("invalid API key")
                  ? "LiveKit authentication failed (invalid API key). Local video preview and collaborative whiteboard/notes sync remain active."
                  : connectionError}
              </p>
            </div>
            {onDismissConnectionError && (
              <button
                onClick={onDismissConnectionError}
                className="text-rose-300 hover:text-white transition p-1 rounded-lg hover:bg-rose-900/50 shrink-0"
                title="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      {/* ─── MEDIA DEVICE PERMISSION WARNING ─── */}
      {mediaDeviceWarning && (
        <div className="absolute top-26 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-amber-950/95 border border-amber-700/80 text-white px-4 py-2 rounded-2xl shadow-2xl text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-amber-200 text-[11px]">
            Camera or Microphone access was denied. Please allow permissions in your browser address bar.
          </span>
        </div>
      )}

      {/* ─── MAIN STAGE VIEWPORT + DOCKED LEFT RAIL + SIDEBAR ─── */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {/* Docked Left Rail for ClassIn Tools (Never overlaps video cards!) */}
        <ClassinToolsWidget
          isTutor={isTutor}
          studentName={studentName}
          onAwardTrophy={handleAwardTrophy}
          onRaiseHand={handleRaiseHand}
          isHandRaised={isHandRaised}
          onSyncTimer={handleSyncTimer}
          syncedTimerState={syncedTimer}
          onSyncDice={handleSyncDice}
          syncedDiceValue={syncedDice}
          externalTimerOpen={toolTimerOpen}
          onChangeTimerOpen={setToolTimerOpen}
          externalDiceOpen={toolDiceOpen}
          onChangeDiceOpen={setToolDiceOpen}
          isWhiteboardAuthorized={isWhiteboardAuthorized}
          onToggleWhiteboardAuth={isTutor ? handleToggleWhiteboardAuth : undefined}
        />

        {/* ─── STAGE CONTAINER (Strictly 1 active layout at a time!) ─── */}
        <div className="flex-1 flex flex-col bg-slate-950 p-1.5 sm:p-2.5 md:p-3 pb-16 md:pb-3 overflow-hidden relative min-w-0 min-h-0">
          {/* LAYOUT 1: CLASSIN STAGE (Compact Top Video Strip + Full Interactive Whiteboard) */}
          {layoutMode === "classin_stage" && (
            <div className="flex-1 flex flex-col gap-2 sm:gap-2.5 overflow-hidden min-h-0">
              {/* Top Video Strip for Tutor & Student */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 h-24 sm:h-32 md:h-36 shrink-0">
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
                  connectionQuality={isTutor ? localConnectionQuality : remoteConnectionQuality}
                  compact={true}
                />

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
                  connectionQuality={!isTutor ? localConnectionQuality : remoteConnectionQuality}
                  compact={true}
                />
              </div>

              {/* Interactive Multi-Tool Whiteboard */}
              <div className="flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative bg-white flex flex-col">
                <InteractiveWhiteboard
                  isTutor={isTutor}
                  isAuthorized={isWhiteboardAuthorized}
                  onToggleAuthorizeStudent={isTutor ? handleToggleWhiteboardAuth : undefined}
                  currentUserName={currentUserName}
                  onBroadcastStroke={handleBroadcastStroke}
                  onBroadcastLiveStroke={handleBroadcastLiveStroke}
                  onBroadcastLaser={handleBroadcastLaser}
                  onSyncState={handleSyncWhiteboardState}
                  externalStrokes={wbStrokes}
                  externalLiveStroke={wbLiveStroke}
                  externalLaserPoint={wbLaserPoint}
                  externalPage={wbPage}
                  externalTotalPages={wbTotalPages}
                  externalBackgroundType={wbBgType}
                  externalStateVersion={wbStateVersion}
                  className="w-full h-full flex-1"
                />
              </div>
            </div>
          )}

          {/* LAYOUT 2: DUAL STAGE (Split View: Videos + Whiteboard) */}
          {layoutMode === "split" && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 overflow-hidden min-h-0">
              {/* Left: Video Cards Stack */}
              <div className="lg:col-span-5 grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-2.5 h-32 sm:h-40 lg:h-full min-h-0 shrink-0">
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
                  connectionQuality={isTutor ? localConnectionQuality : remoteConnectionQuality}
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
                  className="w-full h-full"
                  onAwardTrophy={isTutor ? () => handleAwardTrophy("Excellent answer!") : undefined}
                  videoElement={!isTutor ? renderLocalVideo() : renderRemoteVideo()}
                  connectionQuality={!isTutor ? localConnectionQuality : remoteConnectionQuality}
                />
              </div>

              {/* Right: Whiteboard */}
              <div className="lg:col-span-7 flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 bg-white shadow-2xl flex flex-col">
                <InteractiveWhiteboard
                  isTutor={isTutor}
                  isAuthorized={isWhiteboardAuthorized}
                  onToggleAuthorizeStudent={isTutor ? handleToggleWhiteboardAuth : undefined}
                  currentUserName={currentUserName}
                  onBroadcastStroke={handleBroadcastStroke}
                  onBroadcastLiveStroke={handleBroadcastLiveStroke}
                  onBroadcastLaser={handleBroadcastLaser}
                  onSyncState={handleSyncWhiteboardState}
                  externalStrokes={wbStrokes}
                  externalLiveStroke={wbLiveStroke}
                  externalLaserPoint={wbLaserPoint}
                  externalPage={wbPage}
                  externalTotalPages={wbTotalPages}
                  externalBackgroundType={wbBgType}
                  externalStateVersion={wbStateVersion}
                  className="w-full h-full flex-1"
                />
              </div>
            </div>
          )}

          {/* LAYOUT 3: VIDEO GRID (Full Video Conference Focus) */}
          {layoutMode === "grid" && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4 p-0.5 sm:p-1 overflow-hidden h-full min-h-0">
              <div className="flex-1 min-h-0 h-full rounded-2xl sm:rounded-3xl overflow-hidden">
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
                  className="w-full h-full rounded-2xl sm:rounded-3xl"
                  videoElement={isTutor ? renderLocalVideo() : renderRemoteVideo()}
                  connectionQuality={isTutor ? localConnectionQuality : remoteConnectionQuality}
                />
              </div>
              <div className="flex-1 min-h-0 h-full rounded-2xl sm:rounded-3xl overflow-hidden">
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
                  className="w-full h-full rounded-2xl sm:rounded-3xl"
                  onAwardTrophy={isTutor ? () => handleAwardTrophy("Great insight!") : undefined}
                  videoElement={!isTutor ? renderLocalVideo() : renderRemoteVideo()}
                  connectionQuality={!isTutor ? localConnectionQuality : remoteConnectionQuality}
                />
              </div>
            </div>
          )}

          {/* LAYOUT 4: SCREEN SHARE PRESENTATION (Strictly only when layoutMode === "screenshare") */}
          {layoutMode === "screenshare" && (
            <div className="flex-1 flex flex-col gap-2 sm:gap-2.5 overflow-hidden min-h-0">
              {/* Top Mini Video Strip */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 h-24 sm:h-30 shrink-0">
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
                  connectionQuality={isTutor ? localConnectionQuality : remoteConnectionQuality}
                  compact={true}
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
                  onAwardTrophy={isTutor ? () => handleAwardTrophy("Great job!") : undefined}
                  videoElement={!isTutor ? renderLocalVideo() : renderRemoteVideo()}
                  connectionQuality={!isTutor ? localConnectionQuality : remoteConnectionQuality}
                  compact={true}
                />
              </div>

              {/* Main Presentation Screen */}
              <div className="flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col relative shadow-2xl">
                <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
                  <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-sky-400 pointer-events-auto">
                    <Monitor className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {isScreenSharing
                        ? "You are presenting your screen"
                        : "Participant is sharing their screen"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLayoutMode("classin_stage")}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg transition pointer-events-auto"
                  >
                    <Layout className="h-3.5 w-3.5" />
                    <span>Switch to Whiteboard</span>
                  </button>
                </div>

                {screenShareTrack || remoteScreenTrack ? (
                  <VideoTrack
                    trackRef={(remoteScreenTrack || screenShareTrack)!}
                    className="w-full h-full object-contain bg-black"
                  />
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

        {/* ─── CLASSROOM SIDEBAR (Chat, Live Notes, Shared Files) ─── */}
        <ClassroomSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentUserDisplayName={currentUserName}
          currentUserRole={currentUserRole}
          messages={chatMessages}
          onSendMessage={handleSendChatMessage}
          lessonNotes={sharedNotes}
          onChangeNotes={handleChangeNotes}
          onSaveNotes={handleSaveNotesNow}
          notesSyncStatus={notesSyncStatus}
          lastNotesEditor={lastNotesEditor}
          materials={materialsList}
          onUploadMaterial={handleUploadMaterial}
          activeTab={sidebarTab}
          onChangeTab={setSidebarTab}
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
      <DeviceSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* ─── MOBILE FLOATING CONTROL DOCK ─── */}
      <MobileClassroomDock
        isMicEnabled={isMicEnabled}
        isCameraEnabled={isCameraEnabled}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        layoutMode={layoutMode}
        onChangeLayout={setLayoutMode}
        hasScreenShare={hasAnyScreenShare}
        onToggleChat={() => {
          setSidebarTab("chat");
          setSidebarOpen(!sidebarOpen);
        }}
        onOpenNotes={handleOpenLiveNotes}
        unreadCount={chatMessages.length > 1 ? chatMessages.length - 1 : 0}
        isChatOpen={sidebarOpen}
        isTutor={isTutor}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAwardTrophy={isTutor ? (msg) => handleAwardTrophy(msg) : undefined}
        onRaiseHand={!isTutor ? handleRaiseHand : undefined}
        isHandRaised={isHandRaised}
        onOpenTimer={() => setToolTimerOpen(true)}
        onOpenDice={() => setToolDiceOpen(true)}
        isWhiteboardAuthorized={isWhiteboardAuthorized}
        onToggleWhiteboardAuth={isTutor ? handleToggleWhiteboardAuth : undefined}
        onEndLesson={onEndLesson}
        endButtonLabel={endButtonLabel}
      />

      {/* Audio Rendering for LiveKit */}
      <RoomAudioRenderer />
    </div>
  );
}

/**
 * Main Classroom Page Container
 */
export default function ClassroomClientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { toast } = useModal();

  const [lesson, setLesson] = React.useState<Lesson360Aggregate | null>(null);
  const [initialWbState, setInitialWbState] = React.useState<any>(null);
  const [initialChatMsgs, setInitialChatMsgs] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUserRole, setCurrentUserRole] = React.useState<"TUTOR" | "STUDENT">("STUDENT");

  // Provider state
  const [activeProvider, setActiveProvider] = React.useState<VideoProviderType>("livekit");

  // Livekit state
  const [livekitToken, setLivekitToken] = React.useState<string>("");
  const [livekitUrl, setLivekitUrl] = React.useState<string>("");
  const [tokenError, setTokenError] = React.useState<string | null>(null);
  const [livekitConnectionError, setLivekitConnectionError] = React.useState<string | null>(null);
  const [mediaDeviceWarning, setMediaDeviceWarning] = React.useState(false);

  // Auto-dismiss transient connection warnings after 6 seconds
  React.useEffect(() => {
    if (!livekitConnectionError) return;
    const timer = setTimeout(() => {
      setLivekitConnectionError(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [livekitConnectionError]);

  // External provider fallback state
  const [joinUrl, setJoinUrl] = React.useState<string>("");
  const [joinLoading, setJoinLoading] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);

  // End Lesson Modal
  const [isEndModalOpen, setIsEndModalOpen] = React.useState(false);
  const [feedbackNotes, setFeedbackNotes] = React.useState("");
  const [isEnding, setIsEnding] = React.useState(false);

  // Time Extension & No-Show Lifecycle States
  const [isExtending, setIsExtending] = React.useState(false);
  const [isResolvingNoShow, setIsResolvingNoShow] = React.useState(false);

  // Waiting Room state
  const [bypassedWaitingRoom, setBypassedWaitingRoom] = React.useState(false);

  // Lesson Countdown Timer
  const [secondsRemaining, setSecondsRemaining] = React.useState(50 * 60);
  const [preClassPhase, setPreClassPhase] = React.useState(false);
  const preClassPhaseRef = React.useRef(false);
  React.useEffect(() => {
    preClassPhaseRef.current = preClassPhase;
  }, [preClassPhase]);

  // ─── Initialise Lesson Details and LiveKit Session ───
  React.useEffect(() => {
    async function fetchLessonData(lessonId: string) {
      // 1. Try unified classroom lesson endpoint
      try {
        const res = await fetch(`/api/classroom/lesson/${lessonId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.currentUserRole) {
            setCurrentUserRole(data.currentUserRole);
          }
          if (data.whiteboardState) {
            setInitialWbState(data.whiteboardState);
          }
          if (Array.isArray(data.chatMessages)) {
            setInitialChatMsgs(data.chatMessages);
          }
          if (data.lesson) {
            return data.lesson;
          }
        }
      } catch {}

      // 2. Try student endpoint fallback
      try {
        const res = await fetch(`/api/student/lessons/${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentUserRole("STUDENT");
          return data;
        }
      } catch {}

      // 3. Try tutor endpoint fallback
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

      // 4. Resilient fallback lesson
      return {
        id: lessonId,
        bookingId: lessonId,
        bookingRef: "BK-LIVE",
        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scheduledEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
        status: "CONFIRMED" as Lesson360Aggregate["status"],
        videoRoomId: `room-${lessonId}`,
        student: { displayName: "Student", avatarUrl: "" },
        tutor: { displayName: "Instructor", avatarUrl: "" },
        subject: { name: "Interactive Live Class" },
        materials: [],
      };
    }

    async function init() {
      setLoading(true);
      try {
        const [les, providerConfig] = await Promise.all([
          fetchLessonData(id),
          fetch("/api/classroom/config")
            .then((r) => r.json())
            .catch(() => ({ activeProvider: "livekit" })),
        ]);

        setLesson(les);

        const provider: VideoProviderType = providerConfig?.activeProvider || "livekit";
        setActiveProvider(provider);

        if (les) {
          const startMs = les.scheduledStart ? new Date(les.scheduledStart).getTime() : Date.now();
          const endMs = les.scheduledEnd
            ? new Date(les.scheduledEnd).getTime()
            : startMs + 50 * 60 * 1000;
          const totalDurationSec = Math.floor((endMs - startMs) / 1000);

          if (Date.now() < startMs) {
            setSecondsRemaining(totalDurationSec);
            setPreClassPhase(true);
          } else {
            const elapsedSec = Math.floor((Date.now() - startMs) / 1000);
            setSecondsRemaining(totalDurationSec - elapsedSec);
            setPreClassPhase(false);
          }

          const roomName = les.videoRoomId || `room-${les.id}`;
          const username =
            les.student?.displayName || les.tutor?.displayName || "Participant";
          const topic = `${les.subject?.name || "Live Class"} with ${
            les.tutor?.displayName || "Educator"
          }`;

          if (provider === "livekit") {
            const defaultLivekitUrl = providerConfig?.livekitUrl || "wss://demo.livekit.cloud";
            const tokenRes = await fetch(
              `/api/livekit/token?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(
                username
              )}`
            );
            if (tokenRes.ok) {
              const data = await tokenRes.json();
              setLivekitToken(data.token);
              setLivekitUrl(data.serverUrl || defaultLivekitUrl);
              setTokenError(null);
            } else {
              const errData = await tokenRes.json().catch(() => ({}));
              setTokenError(errData.error || "Failed to authenticate with the video room.");
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

    lessonService
      .recordActualStart(id)
      .then((result) => {
        if (result?.phase === "PRE_CLASS_PREVIEW") {
          setPreClassPhase(true);
          const startsInMs = (result.startsInSeconds || 0) * 1000;
          if (startsInMs > 0) {
            const startTimeout = setTimeout(() => {
              setPreClassPhase(false);
            }, startsInMs);
            return () => clearTimeout(startTimeout);
          }
        } else {
          setPreClassPhase(false);
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      if (preClassPhaseRef.current) return;
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [id]);

  // ─── Pause countdown tick during pre-class phase ───
  React.useEffect(() => {
    if (!preClassPhase) return;
    const freezeInterval = setInterval(() => {
      if (lesson?.scheduledStart && lesson?.scheduledEnd) {
        const startMs = new Date(lesson.scheduledStart).getTime();
        const endMs = new Date(lesson.scheduledEnd).getTime();
        if (Date.now() >= startMs) {
          setPreClassPhase(false);
          const elapsedSec = Math.floor((Date.now() - startMs) / 1000);
          const totalDurationSec = Math.floor((endMs - startMs) / 1000);
          setSecondsRemaining(totalDurationSec - elapsedSec);
        } else {
          const totalDurationSec = Math.floor((endMs - startMs) / 1000);
          setSecondsRemaining(totalDurationSec);
        }
      }
    }, 1000);
    return () => clearInterval(freezeInterval);
  }, [preClassPhase, lesson?.scheduledStart, lesson?.scheduledEnd]);

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

  const handleLeaveClassroom = () => {
    releaseHardwareTracks();
    if (currentUserRole === "TUTOR") {
      window.location.href = `/tutor/lessons/${lesson?.id || ""}`;
    } else {
      window.location.href = `/student/lessons/${lesson?.id || ""}`;
    }
  };

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

    if (currentUserRole === "TUTOR") {
      window.location.href = `/tutor/lessons/${lesson.id}`;
    } else {
      window.location.href = `/student/lessons/${lesson.id}`;
    }
  };

  const handleExtendLesson = async (minutes: number) => {
    if (!lesson) return;
    setIsExtending(true);
    try {
      const res = await lessonService.extendLesson(lesson.id, minutes);
      if (res.success) {
        setSecondsRemaining((prev) => prev + minutes * 60);
        toast({
          title: "Lesson Extended",
          message: `Successfully extended by ${minutes} minutes.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Extension Failed",
          message: res.error || "Unable to extend lesson duration.",
          variant: "warning",
        });
      }
    } catch (err: any) {
      toast({
        title: "Extension Error",
        message: err.message || "Failed to extend lesson duration.",
        variant: "danger",
      });
    } finally {
      setIsExtending(false);
    }
  };

  const handleClaimStudentNoShow = async () => {
    if (!lesson) return;
    setIsResolvingNoShow(true);
    try {
      const res = await lessonService.resolveNoShow(
        lesson.id,
        "TUTOR",
        "Student did not join within 15 minutes of scheduled start."
      );
      if (res.success) {
        releaseHardwareTracks();
        setIsEndModalOpen(false);
        window.location.href = `/tutor/lessons/${lesson.id}?claimed=student_no_show`;
      } else {
        toast({
          title: "No-Show Claim Notice",
          message: res.error || "Unable to claim no-show compensation.",
          variant: "warning",
        });
      }
    } catch (err: any) {
      toast({
        title: "No-Show Error",
        message: err.message || "Failed to resolve student no-show.",
        variant: "danger",
      });
    } finally {
      setIsResolvingNoShow(false);
    }
  };

  const handleReportTutorNoShow = async () => {
    if (!lesson) return;
    setIsResolvingNoShow(true);
    try {
      const res = await lessonService.resolveNoShow(
        lesson.id,
        "STUDENT",
        "Tutor did not join within 15 minutes of scheduled start."
      );
      if (res.success) {
        releaseHardwareTracks();
        setIsEndModalOpen(false);
        window.location.href = `/student/lessons/${lesson.id}?refunded=tutor_no_show`;
      } else {
        toast({
          title: "Absence Report Notice",
          message: res.error || "Unable to report tutor absence.",
          variant: "warning",
        });
      }
    } catch (err: any) {
      toast({
        title: "Absence Report Error",
        message: err.message || "Failed to report tutor absence.",
        variant: "danger",
      });
    } finally {
      setIsResolvingNoShow(false);
    }
  };

  const providerMeta = PROVIDER_META[activeProvider];
  const isTutor = currentUserRole === "TUTOR";
  const currentUserName = isTutor
    ? lesson?.tutor?.displayName || "Instructor"
    : lesson?.student?.displayName || "Student";

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

  const isBeforeClass = scheduledStartMs > 0 && Date.now() < scheduledStartMs;
  const isStudentPresentOrAttended = hasStudentAttended;
  const endButtonLabel =
    isBeforeClass || !isStudentPresentOrAttended ? "Leave Room" : "End Class";

  const minutesSinceStart =
    scheduledStartMs > 0 ? (Date.now() - scheduledStartMs) / (60 * 1000) : 0;
  const hasWaited15Mins = minutesSinceStart >= 15;
  const remainingWaitMins = Math.max(1, Math.ceil(15 - minutesSinceStart));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* ─── PRE-CLASS PREVIEW BANNER ─── */}
      {preClassPhase && lesson?.scheduledStart && (
        <div className="flex items-center justify-center gap-2 bg-amber-500/20 border-b border-amber-500/40 px-3 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-sm shrink-0">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            Preview Mode — Class starts at{" "}
            {new Date(lesson.scheduledStart).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            . Timer begins at scheduled start.
          </span>
        </div>
      )}

      {/* ─── LIVEKIT PROVIDER: ClassIn-Grade Interactive Stage ─── */}
      {activeProvider === "livekit" ? (
        livekitToken && livekitUrl ? (
          <LiveKitRoom
            video={true}
            audio={true}
            token={livekitToken}
            serverUrl={livekitUrl}
            data-lk-theme="default"
            className="flex-1 flex flex-col overflow-hidden w-full h-full min-h-0"
            onError={(err) => {
              console.warn("[LiveKitRoom error]", err);
              const msg = err?.message || "";
              if (
                msg.includes("Cancelled publication") ||
                msg.includes("calling unpublish") ||
                msg.includes("unpublish") ||
                msg.includes("could not publish")
              ) {
                return;
              }
              setLivekitConnectionError(msg || "Failed to establish real-time video connection");
            }}
            onMediaDeviceFailure={() => {
              setMediaDeviceWarning(true);
            }}
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
              onExtendLesson={handleExtendLesson}
              isExtending={isExtending}
              onTimeExtended={(addSec) => setSecondsRemaining((prev) => prev + addSec)}
              scheduledEnd={lesson?.scheduledEnd}
              onTimerResync={(newRemaining) => setSecondsRemaining(newRemaining)}
              connectionError={livekitConnectionError}
              onDismissConnectionError={() => setLivekitConnectionError(null)}
              mediaDeviceWarning={mediaDeviceWarning}
              initialWhiteboardState={initialWbState}
              initialChatMessages={initialChatMsgs}
            />
          </LiveKitRoom>
        ) : tokenError ? (
          <div className="flex-1 flex items-center justify-center rounded-2xl border border-rose-900/40 bg-slate-900 text-center p-8">
            <div className="space-y-4 max-w-md w-full">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Classroom Access Notice</h3>
              <p className="text-xs text-rose-300 leading-relaxed bg-rose-950/40 p-3.5 rounded-xl border border-rose-900/60">
                {tokenError}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-xs"
                >
                  Retry Connection
                </Button>
                <Link
                  href={
                    currentUserRole === "TUTOR" ? `/tutor/lessons/${id}` : `/student/lessons/${id}`
                  }
                  className="text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-slate-800"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
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
              <span className={`text-sm font-bold ${providerMeta.color}`}>{providerMeta.label}</span>
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
                    const topic = `${lesson?.subject?.name || "Live Class"} with ${
                      lesson?.tutor?.displayName || "Educator"
                    }`;
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
            ? isTutor
              ? hasWaited15Mins
                ? "Claim Student Absence (15m Policy)"
                : "Waiting for Student"
              : hasWaited15Mins
              ? "Report Tutor Absence (15m Policy)"
              : "Waiting for Tutor"
            : "Conclude Classroom Session"
        }
        maxWidth="md"
      >
        <div className="space-y-4">
          {isBeforeClass ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    This lesson is scheduled for{" "}
                    {lesson?.scheduledStart
                      ? new Date(lesson.scheduledStart).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "a later time"}
                    .
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    You are previewing the classroom before the session has started. Leaving will safely turn off your camera and return to the dashboard. The lesson remains scheduled.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEndModalOpen(false)}
                  className="text-xs"
                >
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
            isTutor ? (
              <div className="space-y-3">
                {hasWaited15Mins ? (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-white">
                        Student Absent (15-Minute Waiting Threshold Met)
                      </p>
                      <p className="text-slate-300 leading-relaxed">
                        You have waited the required 15 minutes. Under platform attendance policy, you are entitled to 100% compensation for this scheduled session.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">
                        Waiting for Student ({remainingWaitMins}m remaining until No-Show claim)
                      </p>
                      <p className="text-slate-400 leading-relaxed">
                        Platform attendance policy requires tutors to wait 15 minutes before claiming student absence compensation. You can leave now without affecting the schedule.
                      </p>
                    </div>
                  </div>
                )}

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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEndModalOpen(false)}
                      className="text-xs"
                    >
                      Keep Waiting
                    </Button>
                    {hasWaited15Mins ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleClaimStudentNoShow}
                        disabled={isResolvingNoShow}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30"
                      >
                        {isResolvingNoShow
                          ? "Processing..."
                          : "Claim Student No-Show (100% Payout)"}
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleLeaveClassroom}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700"
                      >
                        Leave Room (Keep Scheduled)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {hasWaited15Mins ? (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-white">
                        Tutor Absent (15-Minute Waiting Threshold Met)
                      </p>
                      <p className="text-slate-300 leading-relaxed">
                        Your tutor has not joined within 15 minutes of the scheduled start. Under platform terms, you are guaranteed an immediate 100% refund or platform credit.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs">
                    <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-white">
                        Waiting for Educator to connect ({remainingWaitMins}m until refund eligibility)
                      </p>
                      <p className="text-slate-400 leading-relaxed">
                        Please stay in the classroom while your tutor connects. If your educator does not arrive within 15 minutes, you can claim an instant 100% refund.
                      </p>
                    </div>
                  </div>
                )}

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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEndModalOpen(false)}
                      className="text-xs"
                    >
                      Keep Waiting
                    </Button>
                    {hasWaited15Mins ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleReportTutorNoShow}
                        disabled={isResolvingNoShow}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30"
                      >
                        {isResolvingNoShow
                          ? "Reporting..."
                          : "Report Tutor No-Show (100% Refund)"}
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleLeaveClassroom}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700"
                      >
                        Leave Room
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEndModalOpen(false)}
                    className="text-xs"
                  >
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
