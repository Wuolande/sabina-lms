"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Video as VideoIcon,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MessageSquare,
  HelpCircle,
  BarChart2,
  Users,
  Award,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Send,
  Download,
  Share2,
  ThumbsUp,
  Clock,
  Play,
  FileText,
  Radio,
  ChevronRight,
  Maximize2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { trainingService } from "@/services/trainingService";
import { tutorService } from "@/services/tutorService";
import { LiveTrainingSession, LiveChatMessage, LiveQnAItem, LivePoll } from "@/src/modules/training/types/trainingTypes";

export default function MultiTutorLiveClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [session, setSession] = React.useState<LiveTrainingSession | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"chat" | "qna" | "polls" | "attendees">("chat");

  // Audio/Video controls
  const [isMuted, setIsMuted] = React.useState(true);
  const [isVideoOn, setIsVideoOn] = React.useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0);

  // Group chat state
  const [chatMessages, setChatMessages] = React.useState<LiveChatMessage[]>([
    {
      id: "m1",
      senderName: "System",
      senderRole: "trainer",
      text: "Welcome to the Live Sabina Masterclass Cohort! All audio is muted by default. Please use Chat & Q&A to participate.",
      timestamp: "Just now",
      isPinned: true
    },
    {
      id: "m2",
      senderName: "Dr. Marcus Vance",
      senderRole: "trainer",
      text: "Hello everyone! We will kick off today's LaTeX Whiteboard & Safeguarding simulation in 2 minutes. Feel free to download the session handout below.",
      timestamp: "1m ago"
    },
    {
      id: "m3",
      senderName: "David Chen",
      senderRole: "tutor",
      text: "Excited for this workshop! Ready with notes.",
      timestamp: "Just now"
    }
  ]);
  const [chatInput, setChatInput] = React.useState("");

  // Q&A queue state
  const [qnaItems, setQnaItems] = React.useState<LiveQnAItem[]>([
    {
      id: "q1",
      authorName: "Fatima Al-Mansoor",
      question: "How do we handle LaTeX math syntax errors in live student chat when a student types raw ASCII?",
      upvotes: 8,
      isAnswered: true,
      answerText: "Use the live formatting preview toggle or type \\frac{a}{b} with the quick math symbol palette.",
      createdAt: "5m ago"
    },
    {
      id: "q2",
      authorName: "David Chen",
      question: "What is the policy for recording 1-on-1 trial lessons for internal safeguarding audit review?",
      upvotes: 14,
      isAnswered: false,
      createdAt: "2m ago"
    }
  ]);
  const [qnaInput, setQnaInput] = React.useState("");

  // In-class Live Poll state
  const [activePoll, setActivePoll] = React.useState<LivePoll>({
    id: "p1",
    sessionId: id,
    question: "Scenario: A 14-year-old student asks for your personal Discord handle to send homework screenshots. What is the compliant response?",
    options: [
      "Share your Discord handle if you set it to private",
      "Decline immediately and guide them to upload files directly inside the Sabina Classroom File Portal",
      "Ask the student's parents for permission on WhatsApp",
      "Create a private group chat with other students"
    ],
    correctOptionIndex: 1,
    isActive: true,
    totalVotes: 42,
    results: [2, 38, 2, 0]
  });
  const [selectedPollOption, setSelectedPollOption] = React.useState<number | null>(null);
  const [hasVotedPoll, setHasVotedPoll] = React.useState(false);

  // Attendance & Certificate state
  const [hasConfirmedAttendance, setHasConfirmedAttendance] = React.useState(false);
  const [certificateCode, setCertificateCode] = React.useState<string | null>(null);
  const [isConfirmingAttendance, setIsConfirmingAttendance] = React.useState(false);
  const [currentTutorName, setCurrentTutorName] = React.useState("Tutor");

  React.useEffect(() => {
    tutorService.getMyProfile()
      .then((data) => {
        if (data?.user?.displayName) setCurrentTutorName(data.user.displayName);
      })
      .catch(() => {});

    if (id) {
      trainingService.getLiveSessionById(id)
        .then((data) => {
          setSession(data);
          if (data?.hasAttended) {
            setHasConfirmedAttendance(true);
            setCertificateCode(data.certificateCode || "SAB-LIVE-94812");
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMessage: LiveChatMessage = {
      id: `m-${Date.now()}`,
      senderName: currentTutorName,
      senderRole: "tutor",
      text: chatInput.trim(),
      timestamp: "Just now"
    };
    setChatMessages((prev) => [...prev, newMessage]);
    setChatInput("");
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qnaInput.trim()) return;
    const newQ: LiveQnAItem = {
      id: `q-${Date.now()}`,
      authorName: currentTutorName,
      question: qnaInput.trim(),
      upvotes: 1,
      isAnswered: false,
      createdAt: "Just now"
    };
    setQnaItems((prev) => [newQ, ...prev]);
    setQnaInput("");
  };

  const handleUpvote = (questionId: string) => {
    setQnaItems((prev) =>
      prev.map((item) =>
        item.id === questionId ? { ...item, upvotes: item.upvotes + 1 } : item
      )
    );
  };

  const handleVotePoll = (optionIndex: number) => {
    if (hasVotedPoll) return;
    setSelectedPollOption(optionIndex);
    setHasVotedPoll(true);
  };

  const handleConfirmAttendance = async () => {
    setIsConfirmingAttendance(true);
    try {
      const res = await trainingService.confirmLiveAttendance(session?.id || id);
      setHasConfirmedAttendance(true);
      setCertificateCode(res.certificateCode);
    } finally {
      setIsConfirmingAttendance(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-xl mx-auto" />
        <div className="h-[600px] bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Live Classroom Not Found</h2>
        <p className="text-xs text-slate-500">The training workshop you requested could not be located.</p>
        <Link href="/tutor/training">
          <Button variant="default" size="default">Back to Academy</Button>
        </Link>
      </div>
    );
  }

  const slides = [
    { title: "1. Agenda & Learning Outcomes", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80" },
    { title: "2. LiveKit Whiteboard & LaTeX Rendering", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&auto=format&fit=crop&q=80" },
    { title: "3. Pedagogical Socratic Scaffolding", image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80" },
    { title: "4. Child Safeguarding & Safety Escalations", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80" },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* ── Top Bar Breadcrumb & Live Badge ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 text-white p-4 sm:px-6 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/tutor/training"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
            title="Leave Classroom"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[11px] font-extrabold uppercase tracking-wider animate-pulse">
                <Radio className="h-3 w-3" /> Live Masterclass Broadcast
              </span>
              <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                • {session.category}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white leading-snug truncate max-w-xl">
              {session.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Attendance confirmation button */}
          {hasConfirmedAttendance ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Attendance Verified ({certificateCode})</span>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs text-xs"
              onClick={handleConfirmAttendance}
              isLoading={isConfirmingAttendance}
              leftIcon={<Award className="h-3.5 w-3.5" />}
            >
              Verify Attendance & Claim Badge
            </Button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-slate-200 text-xs font-bold">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span>{session.currentAttendees + 1} Tutors Online</span>
          </div>
        </div>
      </div>

      {/* ── Main 2-Column Live Classroom Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ═══════════════════════════════════════════════════════════
            LEFT 2 COLS: Trainer Stage, Slides Deck & Whiteboard
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Stage Video / Slides Container */}
          <div className="relative aspect-video rounded-3xl bg-slate-950 overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between p-4 text-white">
            {/* Background Presentation Slide */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-500"
              style={{ backgroundImage: `url(${slides[activeSlideIndex].image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/30" />
            </div>

            {/* Top Stage Overlay: Trainer Info */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10">
                <Avatar
                  src={session.trainerAvatar}
                  fallbackName={session.trainerName}
                  size="sm"
                  className="ring-2 ring-emerald-400"
                />
                <div>
                  <span className="text-xs font-bold text-white block leading-none">
                    {session.trainerName} (Lead Trainer)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Broadcasting HD • 1080p WebRTC
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300">
                Slide {activeSlideIndex + 1} of {slides.length}: {slides[activeSlideIndex].title}
              </div>
            </div>

            {/* Floating Tutor Cam Thumbnail (Self View) */}
            <div className="absolute bottom-16 right-4 z-10 h-24 w-36 rounded-2xl bg-slate-900 border-2 border-white/20 overflow-hidden shadow-lg flex items-center justify-center">
              {isVideoOn ? (
                <div className="w-full h-full bg-indigo-900 flex items-center justify-center text-xs font-bold text-white">
                  Camera On
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <Avatar fallbackName={currentTutorName} size="sm" />
                  <span className="text-[10px] text-slate-300 font-semibold mt-1">You (Muted)</span>
                </div>
              )}
            </div>

            {/* Bottom Slide Navigation Bar & Media Controls */}
            <div className="relative z-10 flex items-center justify-between gap-3 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isMuted ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                  title={isMuted ? "Unmute Mic (Request to speak)" : "Mute Mic"}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isVideoOn ? "bg-slate-800 text-slate-400 border border-white/10" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                  title={isVideoOn ? "Turn off camera" : "Turn on camera"}
                >
                  {isVideoOn ? <VideoIcon className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
              </div>

              {/* Slide Buttons */}
              <div className="flex items-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveSlideIndex(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      activeSlideIndex === i ? "w-6 bg-emerald-400" : "w-2 bg-slate-600 hover:bg-slate-500"
                    }`}
                    title={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                {slides[activeSlideIndex].title}
              </div>
            </div>
          </div>

          {/* Handout & Session Cheatsheet Download Bar */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <strong className="text-xs font-bold text-slate-900 block">
                  Official Session Master Handout & Whiteboard Reference Sheet (PDF)
                </strong>
                <span className="text-[11px] text-slate-500">
                  Includes LaTeX hotkeys, active questioning prompt bank, and compliance checklist
                </span>
              </div>
            </div>

            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl shrink-0" leftIcon={<Download className="h-3.5 w-3.5" />}>
              Download PDF Handout
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT 1 COL: Interactive Chat, Q&A Queue & Live Polls
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden flex flex-col h-[640px]">
          {/* Header Tab Bar */}
          <div className="grid grid-cols-4 border-b border-slate-100 p-1.5 bg-slate-50/70 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`py-2 rounded-xl text-center transition-all cursor-pointer ${
                activeTab === "chat" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("qna")}
              className={`py-2 rounded-xl text-center transition-all cursor-pointer relative ${
                activeTab === "qna" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Q&A
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-100 text-[#14209C] text-[10px]">
                {qnaItems.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("polls")}
              className={`py-2 rounded-xl text-center transition-all cursor-pointer relative ${
                activeTab === "polls" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Polls
              <span className="ml-1 h-2 w-2 rounded-full bg-rose-500 inline-block animate-ping" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("attendees")}
              className={`py-2 rounded-xl text-center transition-all cursor-pointer ${
                activeTab === "attendees" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Roster
            </button>
          </div>

          {/* Tab 1: Live Chat */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl text-xs space-y-1 ${
                      m.isPinned
                        ? "bg-amber-50 border border-amber-200 text-amber-950 font-medium"
                        : m.senderRole === "trainer"
                        ? "bg-indigo-50/70 border border-indigo-100 text-indigo-950"
                        : "bg-slate-50 border border-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={m.senderRole === "trainer" ? "text-[#14209C]" : "text-slate-900"}>
                        {m.senderName} {m.senderRole === "trainer" && "(Trainer)"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">{m.timestamp}</span>
                    </div>
                    <p className="leading-relaxed">{m.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message to the cohort..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                />
                <Button type="submit" variant="default" size="sm" className="bg-slate-950 hover:bg-slate-800 text-white rounded-xl">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          )}

          {/* Tab 2: Q&A Queue */}
          {activeTab === "qna" && (
            <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {qnaItems.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        {item.question}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleUpvote(item.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#14209C] text-xs font-bold shrink-0 transition-colors cursor-pointer"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>{item.upvotes}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Asked by {item.authorName}</span>
                      <span>{item.createdAt}</span>
                    </div>

                    {item.isAnswered && item.answerText && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] space-y-0.5">
                        <span className="font-bold flex items-center gap-1 text-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Trainer Answer:
                        </span>
                        <p>{item.answerText}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddQuestion} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={qnaInput}
                  onChange={(e) => setQnaInput(e.target.value)}
                  placeholder="Ask a question to the master trainer..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                />
                <Button type="submit" variant="default" size="sm" className="bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold">
                  Ask
                </Button>
              </form>
            </div>
          )}

          {/* Tab 3: In-Class Live Polls */}
          {activeTab === "polls" && (
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5" /> Active Live Poll
                </span>
                <span className="text-[11px] text-slate-400 font-bold">
                  {activePoll.totalVotes} votes cast
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 leading-relaxed">
                  {activePoll.question}
                </h4>

                <div className="space-y-2">
                  {activePoll.options.map((opt, optIndex) => {
                    const isSelected = selectedPollOption === optIndex;
                    const voteCount = activePoll.results ? activePoll.results[optIndex] : 0;
                    const percent = Math.round((voteCount / (activePoll.totalVotes || 1)) * 100);

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        disabled={hasVotedPoll}
                        onClick={() => handleVotePoll(optIndex)}
                        className={`w-full p-3 rounded-xl border text-left text-xs transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-950"
                            : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        {hasVotedPoll && (
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-emerald-100/60 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        )}

                        <div className="relative z-10 flex items-center justify-between gap-2">
                          <span className="truncate">{opt}</span>
                          {hasVotedPoll && (
                            <span className="font-mono font-bold text-slate-500 shrink-0">
                              {percent}%
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {hasVotedPoll && (
                  <p className="text-[11px] text-emerald-700 font-bold text-center">
                    ✓ Your vote has been tallied live!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Attendees Roster */}
          {activeTab === "attendees" && (
            <div className="p-4 overflow-y-auto space-y-3">
              <span className="text-xs font-bold text-slate-500 block">
                {session.currentAttendees + 1} Tutors Attending this Masterclass
              </span>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={session.trainerAvatar} fallbackName={session.trainerName} size="sm" />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block leading-tight">{session.trainerName}</strong>
                      <span className="text-[10px] text-[#14209C] font-semibold">Lead Host</span>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Host</Badge>
                </div>

                {(session.registeredAttendees || []).map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={att.tutorAvatar} fallbackName={att.tutorName} size="sm" />
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block leading-tight">{att.tutorName}</strong>
                        <span className="text-[10px] text-slate-400">Tutor • Verified</span>
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
