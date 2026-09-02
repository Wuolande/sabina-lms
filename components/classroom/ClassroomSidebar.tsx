"use client";

import * as React from "react";
import {
  MessageSquare,
  FileText,
  Download,
  Send,
  Sparkles,
  Copy,
  Check,
  Smile,
  Paperclip,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ChatMessage {
  id: string;
  sender: string;
  senderRole?: "TUTOR" | "STUDENT" | "SYSTEM";
  text: string;
  time: string;
}

interface MaterialFile {
  id: string;
  name: string;
  url: string;
  uploadedByRole?: string;
}

interface ClassroomSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentUserDisplayName: string;
  currentUserRole: "TUTOR" | "STUDENT";
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  lessonNotes?: string;
  materials?: MaterialFile[];
}

export function ClassroomSidebar({
  isOpen,
  onToggle,
  currentUserDisplayName,
  currentUserRole,
  messages,
  onSendMessage,
  lessonNotes = "",
  materials = [],
}: ClassroomSidebarProps) {
  const [activeTab, setActiveTab] = React.useState<"chat" | "notes" | "files">("chat");
  const [chatInput, setChatInput] = React.useState("");
  const [notesContent, setNotesContent] = React.useState(lessonNotes);
  const [copiedNotes, setCopiedNotes] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  const handleQuickEmoji = (emoji: string) => {
    onSendMessage(emoji);
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(notesContent);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title="Open Classroom Side Panel"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-slate-900 border-l border-y border-slate-700/80 p-2 rounded-l-2xl text-slate-300 hover:text-white shadow-xl transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    );
  }

  return (
    <aside className="w-80 sm:w-88 border-l border-slate-800 bg-slate-900/95 flex flex-col shrink-0 text-white z-30 select-none">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 px-3 pt-2">
        <div className="flex flex-1">
          {[
            { id: "chat", label: "Class Chat", icon: MessageSquare },
            { id: "notes", label: "Live Notes", icon: FileText },
            { id: "files", label: "Files", icon: Download },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === id
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onToggle}
          title="Collapse Panel"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-1"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-3 overflow-hidden flex flex-col text-xs">
        {/* ─── TAB 1: CHAT ─── */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-full justify-between overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-2xl border space-y-1 transition ${
                    m.senderRole === "SYSTEM"
                      ? "bg-indigo-950/40 border-indigo-800/40 text-center"
                      : m.sender === currentUserDisplayName
                      ? "bg-indigo-600/20 border-indigo-500/40 ml-4"
                      : "bg-slate-800/80 border-slate-700/60 mr-4"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-black ${
                          m.senderRole === "TUTOR"
                            ? "text-indigo-400"
                            : m.senderRole === "STUDENT"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {m.sender}
                      </span>
                      {m.senderRole === "TUTOR" && (
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-bold">
                          Tutor
                        </span>
                      )}
                    </div>
                    <span>{m.time}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed text-xs break-words">{m.text}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emoji Bar */}
            <div className="flex items-center justify-around py-1.5 border-t border-slate-800/80 bg-slate-900/50">
              {["👍", "👏", "💡", "❓", "🔥", "🎉", "❤️"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleQuickEmoji(emoji)}
                  className="text-base hover:scale-125 transition p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="pt-2 flex gap-1.5 border-t border-slate-800">
              <input
                type="text"
                placeholder="Send message to classroom..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        )}

        {/* ─── TAB 2: LIVE NOTES & SCRATCHPAD ─── */}
        {activeTab === "notes" && (
          <div className="flex flex-col h-full justify-between space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Shared Scratchpad
              </span>
              <button
                type="button"
                onClick={handleCopyNotes}
                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
              >
                {copiedNotes ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedNotes ? "Copied" : "Copy Notes"}</span>
              </button>
            </div>

            <textarea
              rows={16}
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              placeholder="Live session vocabulary, key concepts, and homework summary..."
              className="flex-1 w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 leading-relaxed placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-mono"
            />

            <div className="pt-2 text-[10px] text-slate-500 text-center">
              Notes automatically persist with lesson completion.
            </div>
          </div>
        )}

        {/* ─── TAB 3: WORKSHEETS & MATERIALS ─── */}
        {activeTab === "files" && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Attached Lesson Materials ({materials.length})
            </span>

            {materials.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Paperclip className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-slate-500 text-xs italic">
                  No materials uploaded for this class yet.
                </p>
              </div>
            ) : (
              materials.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-white block text-xs truncate max-w-[170px]">
                      {m.name}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-semibold block">
                      {m.uploadedByRole || "Educator Worksheet"}
                    </span>
                  </div>
                  <a href={m.url} target="_blank" rel="noreferrer" className="shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[10px] border-slate-600 text-slate-200 hover:bg-slate-700 px-2.5 py-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Get
                    </Button>
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
