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
  User,
  GraduationCap,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { messagingService } from "@/services/messagingService";
import { ConversationItem, ChatMessageItem } from "@/src/modules/messaging/domain/types";
import { formatTime, formatDate } from "@/lib/utils";

function TutorMessagesContent() {
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("conv");

  const [conversations, setConversations] = React.useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = React.useState<string | null>(initialConvId);
  const [messages, setMessages] = React.useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Load conversations
  const loadConversations = React.useCallback(async () => {
    const list = await messagingService.getConversations();
    setConversations(list);
    if (list.length > 0 && !activeConvId) {
      setActiveConvId(list[0].id);
    }
    setLoading(false);
  }, [activeConvId]);

  React.useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for active conversation
  const loadMessages = React.useCallback(async (convId: string) => {
    const msgs = await messagingService.getMessages(convId);
    setMessages(msgs);
  }, []);

  React.useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId, loadMessages]);

  // Polling for real-time synchronization every 3.5s
  React.useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
      if (activeConvId) {
        loadMessages(activeConvId);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [activeConvId, loadConversations, loadMessages]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];
  const student = activeConv?.student;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId || sending) return;

    setSending(true);
    const content = inputText.trim();
    setInputText("");

    const newMsg = await messagingService.sendMessage(activeConvId, content);
    if (newMsg) {
      setMessages((prev) => [...prev, newMsg]);
      loadConversations();
    }
    setSending(false);
  };

  const filteredConversations = conversations.filter((c) => {
    return (
      c.student.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (c.student.country && c.student.country.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="h-[calc(100vh-8.5rem)] max-w-7xl mx-auto rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden flex flex-col md:flex-row">
      {/* Left Column: Enrolled Students Conversations */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#14209C]" />
              <span>Student Inquiries</span>
            </h2>
            <Badge variant="subtle" size="sm" className="font-bold text-[11px]">
              {conversations.length} Active
            </Badge>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search student messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-8 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-200/60 animate-pulse" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400">No student conversations found.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                    isActive ? "bg-white border-l-4 border-[#14209C] shadow-sm" : "hover:bg-slate-100/60"
                  }`}
                >
                  <Avatar
                    src={conv.student.avatarUrl}
                    fallbackName={conv.student.displayName}
                    size="md"
                    statusIndicator="online"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {conv.student.displayName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    <p className={`text-xs truncate mt-1 ${conv.unreadCount > 0 ? "font-bold text-slate-900" : "text-slate-500"}`}>
                      {conv.lastMessageText || "Start a conversation..."}
                    </p>

                    {conv.unreadCount > 0 && (
                      <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#14209C] text-white">
                        {conv.unreadCount} new
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Thread */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        {student ? (
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <Avatar
                src={student.avatarUrl}
                fallbackName={student.displayName}
                size="md"
                statusIndicator="online"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {student.displayName}
                </h3>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online • Student ({student.country || "Global"})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/tutor/students/${student.id}`}>
                <Button variant="outline" size="sm" className="text-xs font-semibold flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-[#14209C]" />
                  <span>Student 360</span>
                </Button>
              </Link>

              <Link href="/tutor/calendar">
                <Button variant="outline" size="sm" className="text-xs font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Schedule</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-slate-200 text-xs text-slate-400">Select a student conversation</div>
        )}

        {/* Message stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
          <div className="text-center my-2">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
              Protected by Sabina LMS • Instant Sync Active
            </span>
          </div>

          {messages.map((msg) => {
            const isMe = msg.senderRole === "TUTOR";
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
                  className={`max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-sm ${
                    isMe
                      ? "bg-[#14209C] text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px]">
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
        <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message ${student?.displayName || "student"}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
          />

          <Button
            type="submit"
            variant="default"
            size="default"
            className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white shrink-0"
            disabled={!inputText.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function TutorMessagesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading messages...</div>}>
      <TutorMessagesContent />
    </React.Suspense>
  );
}
