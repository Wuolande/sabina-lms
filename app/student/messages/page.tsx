"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Send,
  Calendar,
  Video,
  FileText,
  Clock,
  Sparkles,
  RefreshCw,
  MessageSquare,
  CheckCheck,
  GraduationCap,
  ExternalLink,
  Star,
  ShieldCheck,
  Zap,
  Paperclip,
  Check,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BookingModal } from "@/components/booking/BookingModal";
import { messagingService } from "@/services/messagingService";
import { lessonService } from "@/services/lessonService";
import { ConversationItem, ChatMessageItem } from "@/src/modules/messaging/domain/types";
import { formatTime, formatDate } from "@/lib/utils";

const QUICK_PROMPTS = [
  "Hi! Are you available for a 25-minute trial lesson this week?",
  "Hello! I'd like to focus on IELTS speaking fluency and Task 2 coherence.",
  "Hi! Do you assign practice worksheets and homework between lessons?",
  "Hello! Could we schedule a recurring session every Tuesday and Thursday?",
];

function StudentMessagesContent() {
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("conv");

  const [conversations, setConversations] = React.useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = React.useState<string | null>(initialConvId);
  const [messages, setMessages] = React.useState<ChatMessageItem[]>([]);
  const [studentLessons, setStudentLessons] = React.useState<any[]>([]);
  const [inputText, setInputText] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [filterTab, setFilterTab] = React.useState<"all" | "unread">("all");

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Load conversations and student lessons
  const loadData = React.useCallback(async () => {
    try {
      const [convList, lessonsList] = await Promise.all([
        messagingService.getConversations(),
        lessonService.getStudentLessons().catch(() => []),
      ]);

      setConversations(convList || []);
      setStudentLessons(lessonsList || []);

      if (convList && convList.length > 0 && !activeConvId) {
        setActiveConvId(convList[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [activeConvId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Load messages for active conversation
  const loadMessages = React.useCallback(async (convId: string) => {
    const msgs = await messagingService.getMessages(convId);
    setMessages(msgs || []);
  }, []);

  React.useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId, loadMessages]);

  // Polling for real-time synchronization every 3.5s
  React.useEffect(() => {
    const interval = setInterval(() => {
      loadData();
      if (activeConvId) {
        loadMessages(activeConvId);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [activeConvId, loadData, loadMessages]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];
  const tutor = activeConv?.tutor;

  // Find upcoming scheduled lesson with this active tutor
  const upcomingLessonWithTutor = React.useMemo(() => {
    if (!tutor || !studentLessons.length) return null;
    return studentLessons.find((l) => {
      const isMatch = l.tutorProfileId === tutor.id || l.tutorId === tutor.id || l.tutorName === tutor.displayName;
      const isUpcoming = l.status === "SCHEDULED" || l.status === "CONFIRMED" || l.status === "LIVE";
      return isMatch && isUpcoming;
    });
  }, [tutor, studentLessons]);

  const handleSendMessage = async (contentToSend?: string) => {
    const text = contentToSend || inputText.trim();
    if (!text || !activeConvId || sending) return;

    setSending(true);
    setInputText("");

    const newMsg = await messagingService.sendMessage(activeConvId, text);
    if (newMsg) {
      setMessages((prev) => [...prev, newMsg]);
      loadData();
    }
    setSending(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.tutor.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (c.tutor.headline && c.tutor.headline.toLowerCase().includes(search.toLowerCase()));

    if (filterTab === "unread") {
      return matchesSearch && c.unreadCount > 0;
    }
    return matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-8.5rem)] max-w-7xl mx-auto rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden flex flex-col md:flex-row">
      {/* ═══════════════════════════════════════════════════════════
          LEFT COLUMN: Conversations & Inquiries Roster
      ═══════════════════════════════════════════════════════════ */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/60 shrink-0">
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-200/80 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2 tracking-tight">
                <MessageSquare className="w-4 h-4 text-[#14209C]" />
                <span>Tutor Inquiries</span>
              </h2>
              <Badge variant="subtle" size="xs" className="font-extrabold bg-indigo-50 text-[#14209C] border-indigo-100">
                {conversations.length}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterTab("all")}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  filterTab === "all" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterTab("unread")}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  filterTab === "unread" ? "bg-[#14209C] text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Unread
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search tutor conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Conversation Items Feed */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-slate-200/60 animate-pulse" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">No conversations found.</p>
              <p className="text-[11px] text-slate-400">Discover instructors on the marketplace to start chatting.</p>
              <Link href="/find-tutors">
                <Button variant="outline" size="sm" className="mt-2 text-xs font-bold">
                  Browse Tutors
                </Button>
              </Link>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                    isActive
                      ? "bg-white border-l-4 border-[#14209C] shadow-xs"
                      : "hover:bg-slate-100/70"
                  }`}
                >
                  <Avatar
                    src={conv.tutor.avatarUrl}
                    fallbackName={conv.tutor.displayName}
                    size="md"
                    statusIndicator="online"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {conv.tutor.displayName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "font-bold text-slate-900" : "text-slate-500"}`}>
                      {conv.lastMessageText || "Start an inquiry..."}
                    </p>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-400 font-medium truncate">
                        {conv.tutor.headline || "Verified Educator"}
                      </span>

                      {conv.unreadCount > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#14209C] text-white shrink-0">
                          {conv.unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RIGHT COLUMN: Active Chat Thread & Direct Actions
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Tutor Info Header */}
        {tutor ? (
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={tutor.avatarUrl}
                fallbackName={tutor.displayName}
                size="md"
                statusIndicator="online"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {tutor.displayName}
                  </h3>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  <span className="text-emerald-600 font-bold">Online</span> • {tutor.headline || "Certified Instructor"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {tutor.slug && (
                <Link href={`/tutors/${tutor.slug}`} target="_blank">
                  <Button variant="outline" size="sm" className="font-bold text-xs flex items-center gap-1 shadow-xs">
                    <span>Profile</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Button>
                </Link>
              )}

              <Button
                variant="default"
                size="sm"
                onClick={() => setIsBookingOpen(true)}
                className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Lesson</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-slate-200 text-xs text-slate-400">Select a conversation</div>
        )}

        {/* Upcoming Lesson Alert Ribbon */}
        {upcomingLessonWithTutor && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs text-indigo-950 font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Upcoming Class: <strong>{formatDate(upcomingLessonWithTutor.scheduledStart)}</strong> at <strong>{formatTime(upcomingLessonWithTutor.scheduledStart)}</strong> ({upcomingLessonWithTutor.subjectName})
              </span>
            </div>

            <Link href={`/lessons/${upcomingLessonWithTutor.id}/classroom`}>
              <Button size="sm" className="font-bold text-[11px] bg-[#14209C] hover:bg-[#0d1870] text-white px-3 py-1 h-7 flex items-center gap-1 shrink-0">
                <Video className="w-3 h-3" />
                <span>Join Video Room</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
          <div className="text-center my-1">
            <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200/80 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
              End-to-End Encrypted • Sabina Instant Sync Active
            </span>
          </div>

          {/* Quick Prompts Bar if thread is fresh */}
          {messages.length < 2 && (
            <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs space-y-2.5 my-2">
              <span className="text-xs font-bold text-[#14209C] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Conversation Starters</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-200 text-left text-xs text-slate-700 font-medium transition cursor-pointer"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderRole === "STUDENT";
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}
              >
                {!isMe && (
                  <Avatar
                    src={msg.senderAvatar}
                    fallbackName={msg.senderName}
                    size="sm"
                  />
                )}

                <div
                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-xs ${
                    isMe
                      ? "bg-[#14209C] text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-none"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px]">
                    <span className={isMe ? "text-indigo-200" : "text-slate-400"}>
                      {formatTime(msg.createdAt)}
                    </span>
                    {isMe && (
                      <CheckCheck className={`w-3.5 h-3.5 ${msg.readAt ? "text-emerald-300" : "text-indigo-200"}`} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleFormSubmit} className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message ${tutor?.displayName || "instructor"}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14209C]"
          />

          <Button
            type="submit"
            variant="default"
            size="default"
            className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white shrink-0 rounded-2xl cursor-pointer"
            disabled={!inputText.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Direct Booking Modal */}
      {tutor && (
        <BookingModal
          tutor={tutor as any}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={() => {
            setIsBookingOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default function StudentMessagesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading messages...</div>}>
      <StudentMessagesContent />
    </React.Suspense>
  );
}
