"use client";

import * as React from "react";
import {
  MessageSquare,
  FileText,
  Download,
  Send,
  Copy,
  Check,
  Paperclip,
  ChevronLeft,
  X,
  Upload,
  Link2,
  Loader2,
  Share2,
  Save,
  Sparkles,
  ExternalLink,
  Maximize2,
  Minimize2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole?: "TUTOR" | "STUDENT" | "SYSTEM";
  text: string;
  time: string;
}

export interface MaterialFile {
  id: string;
  name: string;
  url: string;
  uploadedByRole?: string;
  sizeBytes?: number;
  fileType?: string;
}

interface ClassroomSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentUserDisplayName: string;
  currentUserRole: "TUTOR" | "STUDENT";
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  lessonNotes?: string;
  onChangeNotes?: (notes: string) => void;
  onSaveNotes?: (notes: string) => Promise<void> | void;
  notesSyncStatus?: "synced" | "saving" | "live";
  lastNotesEditor?: string;
  materials?: MaterialFile[];
  onUploadMaterial?: (material: {
    name: string;
    url: string;
    sizeBytes?: number;
    fileType?: string;
  }) => Promise<void> | void;
  activeTab?: "chat" | "notes" | "files";
  onChangeTab?: (tab: "chat" | "notes" | "files") => void;
}

export function ClassroomSidebar({
  isOpen,
  onToggle,
  currentUserDisplayName,
  currentUserRole,
  messages,
  onSendMessage,
  lessonNotes = "",
  onChangeNotes,
  onSaveNotes,
  notesSyncStatus = "synced",
  lastNotesEditor,
  materials = [],
  onUploadMaterial,
  activeTab: externalTab,
  onChangeTab,
}: ClassroomSidebarProps) {
  const [internalTab, setInternalTab] = React.useState<"chat" | "notes" | "files">("chat");
  const activeTab = externalTab !== undefined ? externalTab : internalTab;

  const setActiveTab = (tab: "chat" | "notes" | "files") => {
    setInternalTab(tab);
    onChangeTab?.(tab);
  };

  const [chatInput, setChatInput] = React.useState("");
  const [notesContent, setNotesContent] = React.useState(lessonNotes);
  const [copiedNotes, setCopiedNotes] = React.useState(false);
  const [sharedToChat, setSharedToChat] = React.useState(false);

  // File / Link upload states
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [showLinkForm, setShowLinkForm] = React.useState(false);
  const [linkTitle, setLinkTitle] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Resizable Sidebar Width (Desktop)
  const [sidebarWidth, setSidebarWidth] = React.useState<number>(352);
  const [isDraggingWidth, setIsDraggingWidth] = React.useState(false);

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingWidth(true);
    const startX = e.clientX;
    const startW = sidebarWidth;

    const onMove = (moveEvent: PointerEvent) => {
      // Moving pointer left increases right-docked sidebar width
      const deltaX = startX - moveEvent.clientX;
      const maxW = Math.min(680, Math.floor(window.innerWidth * 0.55));
      const nextW = Math.max(260, Math.min(maxW, startW + deltaX));
      setSidebarWidth(nextW);
    };

    const onUp = () => {
      setIsDraggingWidth(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  // Keep local notesContent in sync with incoming remote updates
  React.useEffect(() => {
    setNotesContent(lessonNotes);
  }, [lessonNotes]);

  React.useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  const handleQuickEmoji = (emoji: string) => {
    onSendMessage(emoji);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotesContent(val);
    onChangeNotes?.(val);
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(notesContent || "");
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  const handleDownloadNotes = () => {
    const blob = new Blob([notesContent || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sabina-class-notes-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareNotesSnippetToChat = () => {
    if (!notesContent.trim()) return;
    const preview = notesContent.trim().length > 280 ? `${notesContent.trim().slice(0, 280)}...` : notesContent.trim();
    onSendMessage(`📝 Shared Live Notes:\n${preview}`);
    setSharedToChat(true);
    setTimeout(() => setSharedToChat(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadError(null);
    setIsUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/document", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      let resolvedUrl: string = data.documentUrl || data.url || "";

      // Fallback for unauthenticated sandbox testing sessions
      if (!res.ok || !resolvedUrl) {
        const cloudForm = new FormData();
        cloudForm.append("file", file);
        cloudForm.append("upload_preset", "sabina");
        const cloudRes = await fetch("https://api.cloudinary.com/v1_1/vtjhrq1w/auto/upload", {
          method: "POST",
          body: cloudForm,
        });
        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          resolvedUrl = cloudData.secure_url || cloudData.url || "";
        }
      }

      if (!resolvedUrl) {
        throw new Error(data.error || "Failed to upload file");
      }

      await onUploadMaterial?.({
        name: file.name,
        url: resolvedUrl,
        sizeBytes: file.size,
        fileType: file.type || "application/octet-stream",
      });
    } catch (err: any) {
      setUploadError(err.message || "Could not upload file");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    const name = linkTitle.trim() || formattedUrl.replace(/^https?:\/\//i, "").slice(0, 40);
    await onUploadMaterial?.({
      name,
      url: formattedUrl,
      fileType: "link",
    });
    setLinkTitle("");
    setLinkUrl("");
    setShowLinkForm(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title="Open Classroom Side Panel (Chat, Live Notes & Files)"
        className="hidden lg:flex flex-col items-center gap-1.5 absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-slate-900/95 border-l border-y border-slate-700/80 px-2 py-3 rounded-l-2xl text-slate-300 hover:text-white hover:bg-slate-800 shadow-2xl transition"
      >
        <ChevronLeft className="h-4 w-4 text-indigo-400" />
        <MessageSquare className="h-4 w-4" />
        <FileText className="h-4 w-4 text-emerald-400" />
      </button>
    );
  }

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className="lg:hidden fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onToggle}
      />

      {/* Sidebar Drawer Container (Overlay on Mobile, Docked & Resizable on Desktop) */}
      <aside
        style={{
          width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${sidebarWidth}px` : undefined,
        }}
        className="fixed lg:relative inset-y-0 right-0 z-50 w-[92vw] max-w-sm lg:max-w-none border-l border-slate-800 bg-slate-900/98 flex flex-col shrink-0 text-white select-none shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Left Drag Resize Handle (Desktop) */}
        <div
          onPointerDown={handleResizePointerDown}
          onDoubleClick={() => setSidebarWidth(352)}
          title="Drag left or right to resize panel (double-click to reset)"
          className={`hidden lg:flex items-center justify-center absolute -left-2 inset-y-0 w-3.5 cursor-col-resize z-30 group transition ${
            isDraggingWidth ? "bg-indigo-500/30" : "hover:bg-indigo-500/20"
          }`}
        >
          <div
            className={`w-1 h-12 rounded-full flex items-center justify-center transition ${
              isDraggingWidth
                ? "bg-indigo-400 scale-y-125"
                : "bg-slate-700 group-hover:bg-indigo-400"
            }`}
          />
        </div>

        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 px-2.5 pt-2 shrink-0">
          <div className="flex flex-1 min-w-0">
            {[
              { id: "chat", label: "Class Chat", icon: MessageSquare, count: messages.length > 1 ? messages.length - 1 : 0 },
              { id: "notes", label: "Live Notes", icon: FileText, dot: Boolean(notesContent && notesContent.trim().length > 0) },
              { id: "files", label: "Files", icon: Download, count: materials.length },
            ].map(({ id, label, icon: Icon, count, dot }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as "chat" | "notes" | "files")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition relative min-w-0 ${
                  activeTab === id
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{label}</span>
                {typeof count === "number" && count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[9px] text-indigo-300 font-extrabold shrink-0">
                    {count}
                  </span>
                )}
                {dot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Live notes active" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 ml-1 shrink-0">
            <button
              type="button"
              onClick={() => setSidebarWidth((w) => (w > 420 ? 352 : 520))}
              title={sidebarWidth > 420 ? "Restore Standard Width" : "Expand Panel Width"}
              className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {sidebarWidth > 420 ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={onToggle}
              title="Close Panel"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 p-3 overflow-hidden flex flex-col text-xs min-h-0">
          {/* ─── TAB 1: CHAT ─── */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-full justify-between overflow-hidden min-h-0">
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-2 min-h-0">
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
                    <p className="text-slate-200 leading-relaxed text-xs break-words whitespace-pre-wrap">{m.text}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Emoji Bar */}
              <div className="flex items-center justify-around py-1.5 border-t border-slate-800/80 bg-slate-900/50 shrink-0">
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
              <form onSubmit={handleSend} className="pt-2 flex gap-1.5 border-t border-slate-800 shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
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

          {/* ─── TAB 2: LIVE COLLABORATIVE NOTES & SCRATCHPAD ─── */}
          {activeTab === "notes" && (
            <div className="flex flex-col h-full justify-between space-y-2.5 min-h-0">
              {/* Top Status & Quick Actions Bar */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      notesSyncStatus === "saving"
                        ? "bg-amber-400 animate-ping"
                        : notesSyncStatus === "live"
                        ? "bg-emerald-400 animate-pulse"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-[11px] font-bold text-slate-300 truncate">
                    {notesSyncStatus === "saving"
                      ? "Syncing notes..."
                      : lastNotesEditor
                      ? `Updated by ${lastNotesEditor}`
                      : "Real-Time Shared Notes"}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onSaveNotes && (
                    <button
                      type="button"
                      onClick={() => onSaveNotes(notesContent)}
                      title="Save notes now"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-400 font-bold border border-slate-700 transition"
                    >
                      <Save className="h-3 w-3" />
                      <span>Save</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyNotes}
                    title="Copy notes to clipboard"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-indigo-300 font-bold border border-slate-700 transition"
                  >
                    {copiedNotes ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedNotes ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Helper banner */}
              <div className="px-2.5 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-[10px] text-indigo-200 flex items-center justify-between gap-2 shrink-0">
                <span>Both Tutor & Student see edits live as you type.</span>
              </div>

              {/* Collaborative Textarea */}
              <textarea
                value={notesContent}
                onChange={handleNotesChange}
                placeholder="Type shared vocabulary, formulas, examples, or homework here... Both participants can view and edit in real time."
                className="flex-1 w-full min-h-0 rounded-2xl border border-slate-700/80 bg-slate-950 p-3 text-xs text-slate-100 leading-relaxed placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 resize-none font-mono select-text"
              />

              {/* Bottom Notes Utility Bar */}
              <div className="flex items-center justify-between gap-2 pt-1 shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
                <button
                  type="button"
                  onClick={handleShareNotesSnippetToChat}
                  disabled={!notesContent.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 disabled:opacity-40 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition"
                >
                  {sharedToChat ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                  <span>{sharedToChat ? "Posted to Chat!" : "Post to Chat"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadNotes}
                  disabled={!notesContent.trim()}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 text-[11px] font-bold transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>.txt</span>
                </button>
              </div>
            </div>
          )}

          {/* ─── TAB 3: WORKSHEETS & SHARED FILES ─── */}
          {activeTab === "files" && (
            <div className="flex flex-col h-full justify-between space-y-3 overflow-hidden min-h-0">
              {/* Upload / Share Controls */}
              <div className="space-y-2 pb-2 border-b border-slate-800 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Shared Materials ({materials.length})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingFile}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold shadow-sm transition"
                  >
                    {isUploadingFile ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingFile ? "Uploading..." : "Upload File"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLinkForm(!showLinkForm)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition"
                  >
                    <Link2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Share Link</span>
                  </button>
                </div>

                {uploadError && (
                  <p className="text-[10px] text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg px-2.5 py-1.5">
                    {uploadError}
                  </p>
                )}

                {showLinkForm && (
                  <form onSubmit={handleAddLink} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <input
                      type="text"
                      placeholder="Resource title (e.g. Grammar Worksheet)"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        placeholder="https://..."
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] px-3">
                        Share
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* Materials List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                {materials.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Paperclip className="h-8 w-8 text-slate-600 mx-auto" />
                    <p className="text-slate-400 text-xs font-medium">
                      No files shared in this lesson yet.
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Upload PDFs, images, or share links above so both participants can open them immediately.
                    </p>
                  </div>
                ) : (
                  materials.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-2.5 shadow-xs hover:border-slate-600 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-white block text-xs truncate">
                          {m.name}
                        </span>
                        <span className="text-[10px] text-indigo-400 font-semibold block">
                          {m.uploadedByRole === "TUTOR"
                            ? "Shared by Tutor"
                            : m.uploadedByRole === "STUDENT"
                            ? "Shared by Student"
                            : m.uploadedByRole || "Lesson Resource"}
                        </span>
                      </div>
                      <a href={m.url} target="_blank" rel="noreferrer" className="shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] border-slate-600 text-slate-200 hover:bg-slate-700 px-2.5 py-1 flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Open</span>
                        </Button>
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
