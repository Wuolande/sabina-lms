"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  Video,
  Mic,
  MicOff,
  VideoOff,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowLeft,
  Volume2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Lesson360Aggregate } from "@/src/modules/lessons/domain/types";
import { formatDate, formatTime } from "@/lib/utils";

interface PreClassWaitingRoomProps {
  lesson: Lesson360Aggregate;
  earlyJoinMinutes?: number;
  onEnterClassroom: () => void;
  isTutor?: boolean;
}

export function PreClassWaitingRoom({
  lesson,
  earlyJoinMinutes = 15,
  onEnterClassroom,
  isTutor = false,
}: PreClassWaitingRoomProps) {
  const [now, setNow] = React.useState(Date.now());
  const [micTesting, setMicTesting] = React.useState(true);
  const [cameraTesting, setCameraTesting] = React.useState(true);
  const [micLevel, setMicLevel] = React.useState(0);
  const [hasMediaAccess, setHasMediaAccess] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Update clock every second
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const scheduledStartTime = new Date(lesson.scheduledStart).getTime();
  const earlyOpenTime = scheduledStartTime - earlyJoinMinutes * 60 * 1000;
  const isRoomOpen = now >= earlyOpenTime || isTutor;

  // Milliseconds until early room opens
  const msUntilOpen = Math.max(0, earlyOpenTime - now);
  const hoursUntil = Math.floor(msUntilOpen / (1000 * 60 * 60));
  const minutesUntil = Math.floor((msUntilOpen % (1000 * 60 * 60)) / (1000 * 60));
  const secondsUntil = Math.floor((msUntilOpen % (1000 * 60)) / 1000);

  // Test Camera & Mic in waiting room
  React.useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animFrame: number;

    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        setHasMediaAccess(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        try {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrame = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        } catch (e) {
          console.warn("Audio meter init error:", e);
        }
      })
      .catch((err) => {
        console.warn("Media access denied in waiting room:", err);
        setHasMediaAccess(false);
      });

    return () => {
      cancelAnimationFrame(animFrame);
      if (audioCtx) audioCtx.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicTesting(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraTesting(videoTrack.enabled);
      }
    }
  };

  const tutorName = lesson.tutor?.displayName || "Dr. Elena Rostova";
  const studentName = lesson.student?.displayName || "Alex Rivera";
  const durationMin = lesson.durationMinutes || 50;
  const isTrial = durationMin <= 30;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-y-auto">
      {/* Top Bar */}
      <header className="flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 sm:px-8 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={isTutor ? "/tutor/lessons" : "/student/lessons"}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition p-2 rounded-xl hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="text-sm font-black text-white font-heading">
            Classroom Waiting Room
          </h1>
        </div>

        <Badge
          variant="subtle"
          size="sm"
          className={
            isRoomOpen
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1.5"
              : "bg-amber-500/20 text-amber-300 border-amber-500/30 gap-1.5"
          }
        >
          <span className={`h-2 w-2 rounded-full ${isRoomOpen ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
          <span className="font-extrabold text-[11px] tracking-wider uppercase">
            {isRoomOpen ? "Room Open" : "Early Arrival"}
          </span>
        </Badge>
      </header>

      {/* Main Waiting Room Stage */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 flex flex-col lg:flex-row items-center justify-center gap-8">
        
        {/* Left: Device Pre-flight Check */}
        <div className="w-full lg:w-1/2 space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Pre-Flight Hardware Check
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready to Join
              </span>
            </div>

            {/* Video Preview Box */}
            <div className="relative h-64 w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              {cameraTesting && hasMediaAccess ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
                  <Avatar
                    src={isTutor ? lesson.tutor?.avatarUrl : lesson.student?.avatarUrl}
                    fallbackName={isTutor ? tutorName : studentName}
                    size="lg"
                  />
                  <p className="text-xs font-medium">Camera is disabled</p>
                </div>
              )}

              {/* In-Preview Media Controls */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`p-2.5 rounded-xl backdrop-blur-md transition shadow-md ${
                      micTesting
                        ? "bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700/80"
                        : "bg-rose-600 text-white hover:bg-rose-700"
                    }`}
                  >
                    {micTesting ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={`p-2.5 rounded-xl backdrop-blur-md transition shadow-md ${
                      cameraTesting
                        ? "bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700/80"
                        : "bg-rose-600 text-white hover:bg-rose-700"
                    }`}
                  >
                    {cameraTesting ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700 text-[11px]">
                  <span className="text-slate-400">Mic</span>
                  <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${micLevel}%` }}
                      className={`h-full transition-all duration-75 ${
                        micLevel > 40 ? "bg-emerald-400" : "bg-indigo-400"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Make sure your camera and microphone are working clearly before entering.
            </p>
          </div>
        </div>

        {/* Right: Class Info & Countdown */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="subtle"
                size="sm"
                className={
                  isTrial
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold"
                    : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-bold"
                }
              >
                {isTrial ? "🎁 Free Trial Lesson (25 min)" : `Standard Class (${durationMin} min)`}
              </Badge>
              <span className="text-xs text-slate-400">Ref: {lesson.bookingRef}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {lesson.subject?.name || "1-on-1 Interactive Tutoring"}
            </h2>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <Avatar
                src={lesson.tutor?.avatarUrl}
                fallbackName={tutorName}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{tutorName}</h4>
                  <Badge variant="success" size="xs" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 truncate">
                  Instructor for {studentName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  Date
                </span>
                <p className="font-bold text-slate-200">{formatDate(lesson.scheduledStart)}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Scheduled Time
                </span>
                <p className="font-bold text-slate-200">{formatTime(lesson.scheduledStart)}</p>
              </div>
            </div>
          </div>

          {/* Countdown / Room Status Box */}
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center space-y-3 shadow-xl">
            {isRoomOpen ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>The live classroom is open!</span>
                </div>
                <p className="text-xs text-slate-400">
                  You can now enter the collaborative canvas stage with your instructor.
                </p>
                <Button
                  size="lg"
                  onClick={onEnterClassroom}
                  className="w-full font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 py-6 rounded-2xl shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Enter Live Classroom Now
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Classroom Opens In
                </span>
                <div className="flex items-center justify-center gap-2 font-mono text-3xl sm:text-4xl font-black text-amber-400">
                  <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                    {String(hoursUntil).padStart(2, "0")}
                    <span className="block text-[9px] text-slate-500 font-sans font-semibold mt-0.5">HOURS</span>
                  </div>
                  <span>:</span>
                  <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                    {String(minutesUntil).padStart(2, "0")}
                    <span className="block text-[9px] text-slate-500 font-sans font-semibold mt-0.5">MINS</span>
                  </div>
                  <span>:</span>
                  <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                    {String(secondsUntil).padStart(2, "0")}
                    <span className="block text-[9px] text-slate-500 font-sans font-semibold mt-0.5">SECS</span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-[11px] text-slate-400 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Classroom access opens automatically {earlyJoinMinutes} minutes before start time.
                  </span>
                </div>

                <Button
                  size="lg"
                  disabled
                  className="w-full font-bold text-xs bg-slate-800 text-slate-500 py-5 rounded-2xl border border-slate-700/50 cursor-not-allowed"
                >
                  Classroom Locked (Early Arrival)
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
