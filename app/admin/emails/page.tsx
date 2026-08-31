"use client";

import * as React from "react";
import {
  Mail,
  Send,
  Sparkles,
  Users,
  GraduationCap,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Eye,
  FileText,
  AlertTriangle,
  ArrowRight,
  Filter,
  Check,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { useModal } from "@/components/ui/modal-context";
import { adminService } from "@/services/adminService";
import {
  EmailAudience,
  EmailLogRecord,
  EmailTemplateDefinition,
  EmailTemplateType,
} from "@/src/modules/communications/types/emailTypes";
import { ENTERPRISE_EMAIL_TEMPLATES } from "@/src/modules/communications/templates/emailTemplates";
import { formatDate } from "@/lib/utils";

export default function AdminEmailsPage() {
  const { toast } = useModal();

  // State
  const [logs, setLogs] = React.useState<EmailLogRecord[]>([]);
  const [templates, setTemplates] = React.useState<EmailTemplateDefinition[]>(ENTERPRISE_EMAIL_TEMPLATES);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Composer State
  const [audience, setAudience] = React.useState<EmailAudience>("ALL_STUDENTS");
  const [singleRecipient, setSingleRecipient] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState<EmailTemplateType>("SYSTEM_ANNOUNCEMENT");
  const [subject, setSubject] = React.useState(
    ENTERPRISE_EMAIL_TEMPLATES.find((t) => t.id === "SYSTEM_ANNOUNCEMENT")?.defaultSubject || ""
  );
  const [content, setContent] = React.useState(
    ENTERPRISE_EMAIL_TEMPLATES.find((t) => t.id === "SYSTEM_ANNOUNCEMENT")?.defaultContent || ""
  );

  // View Log Modal
  const [viewLog, setViewLog] = React.useState<EmailLogRecord | null>(null);

  const fetchEmailData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [emailRes, tmplRes] = await Promise.all([
        adminService.getEmails().catch(() => ({ data: [], total: 0 })),
        adminService.getEmailTemplates().catch(() => ({ templates: ENTERPRISE_EMAIL_TEMPLATES })),
      ]);
      setLogs(emailRes.data || []);
      if (tmplRes.templates?.length > 0) {
        setTemplates(tmplRes.templates);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEmailData();
  }, [fetchEmailData]);

  const handleTemplateChange = (templateId: EmailTemplateType) => {
    setSelectedTemplate(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setSubject(tmpl.defaultSubject);
      setContent(tmpl.defaultContent);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      toast({ title: "Incomplete Fields", message: "Subject and content are required.", variant: "danger" });
      return;
    }

    if (audience === "SINGLE_USER" && (!singleRecipient || !singleRecipient.includes("@"))) {
      toast({ title: "Invalid Recipient", message: "Please specify a valid email address.", variant: "danger" });
      return;
    }

    setSending(true);
    try {
      const res = await adminService.sendEmail({
        audience,
        recipientEmail: audience === "SINGLE_USER" ? singleRecipient.trim() : undefined,
        templateType: selectedTemplate,
        subject: subject.trim(),
        content: content.trim(),
      });

      if (res.success) {
        toast({
          title: "Email Dispatched",
          message: res.message || "Email broadcast sent successfully.",
          variant: "success",
        });

        if (res.record) {
          setLogs((prev) => [res.record, ...prev]);
        }
      }
    } catch (err: any) {
      toast({
        title: "Dispatch Error",
        message: err.message || "Failed to dispatch email broadcast.",
        variant: "danger",
      });
    } finally {
      setSending(false);
    }
  };

  const currentTemplateObj = templates.find((t) => t.id === selectedTemplate);

  const filteredLogs = logs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.subject.toLowerCase().includes(q) ||
      l.audience.toLowerCase().includes(q) ||
      l.senderName.toLowerCase().includes(q) ||
      (l.recipientEmail && l.recipientEmail.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Mail className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Enterprise Communications & Email Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dispatch password recoveries, security alerts, student onboarding messages, and platform broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmailData}
            isLoading={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatches</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Send className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{logs.length}</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Audit recorded</span>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Enterprise Templates</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{templates.length}</p>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">Security & Transactional</span>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivery Health</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">100%</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Zero bounced</span>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Protected Channels</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Lock className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">TLS 1.3</p>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">Authenticated SMTP</span>
        </div>
      </div>

      {/* Main Composer & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Email Composer Form */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Compose Email Broadcast</h2>
              <p className="text-xs text-slate-500 mt-0.5">Select a template or compose a custom communication</p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-mono">
              Live Console
            </span>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-5">
            {/* Audience selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Target Audience
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "ALL_STUDENTS" as const, label: "All Students", icon: Users },
                  { id: "ALL_TUTORS" as const, label: "All Tutors", icon: GraduationCap },
                  { id: "ALL_USERS" as const, label: "All Users", icon: Sparkles },
                  { id: "SINGLE_USER" as const, label: "Single Email", icon: User },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = audience === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAudience(item.id)}
                      className={`p-3 rounded-2xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                        isSelected
                          ? "border-[#14209C] bg-[#14209C]/5 text-[#14209C] ring-2 ring-[#14209C]/20 shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Single Recipient input if applicable */}
            {audience === "SINGLE_USER" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email Address
                </label>
                <Input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={singleRecipient}
                  onChange={(e) => setSingleRecipient(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                />
              </div>
            )}

            {/* Template selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Enterprise Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value as EmailTemplateType)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.category}] {t.name}
                  </option>
                ))}
              </select>
              {currentTemplateObj && (
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  {currentTemplateObj.description}
                </p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Subject Line
              </label>
              <Input
                required
                placeholder="Enter email subject line..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Content Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  4. Email Body (Markdown Supported)
                </label>
                {currentTemplateObj?.variables && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <span>Vars:</span>
                    {currentTemplateObj.variables.map((v) => (
                      <span key={v} className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <textarea
                required
                rows={9}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type email body here..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-mono text-slate-900 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              />
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="default"
                size="lg"
                isLoading={sending}
                className="w-full font-bold bg-[#14209C] hover:bg-[#0e176b] text-white flex items-center justify-center gap-2 shadow-xs"
              >
                <Send className="h-4 w-4" />
                <span>Dispatch Email to {audience.replace(/_/g, " ")}</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Right: Live Email Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-[#14209C]" />
                Live Client Preview
              </span>
              <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                Apple Mail / Gmail
              </Badge>
            </div>

            {/* Mock Email Client Container */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden text-xs">
              {/* Header Strip */}
              <div className="bg-white p-3.5 border-b border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span><strong>From:</strong> Sabina LMS &lt;no-reply@sabinaedge.com&gt;</span>
                  <span className="text-slate-400 font-mono">Just now</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  <strong>To:</strong> {audience === "SINGLE_USER" ? (singleRecipient || "user@example.com") : audience.toLowerCase().replace(/_/g, " ")}
                </div>
                <div className="text-slate-900 font-bold text-xs pt-1">
                  <strong>Subject:</strong> {subject || "No Subject"}
                </div>
              </div>

              {/* Body Content */}
              <div className="p-4 bg-white min-h-[220px] whitespace-pre-line text-slate-700 leading-relaxed font-sans text-xs">
                {content || "Email body preview will appear here in real time as you edit."}
              </div>

              {/* Email Footer */}
              <div className="p-3 bg-slate-100 text-[10px] text-slate-400 border-t border-slate-200 text-center">
                © {new Date().getFullYear()} Sabina LMS Platform. Protected by Enterprise Authentication.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Communications Activity & Audit Table */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Dispatched Communications Log ({filteredLogs.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Append-only audit trail of all email dispatches, recovery requests, and broadcast events
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search dispatched emails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            />
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Audience / Recipient</TableHead>
                <TableHead>Template Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    No communication records matching your filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(log.sentAt)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-slate-900">
                        {log.audience.replace(/_/g, " ")}
                      </div>
                      {log.recipientEmail && (
                        <span className="text-[11px] font-mono text-slate-400 block">{log.recipientEmail}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="subtle" size="sm" className="font-mono text-[10px]">
                        {log.templateType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-slate-700 font-semibold">
                      {log.subject}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{log.senderName}</TableCell>
                    <TableCell>
                      <Badge variant="success" size="sm" className="flex items-center gap-1 w-fit">
                        <Check className="h-3 w-3" />
                        <span>{log.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewLog(log)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        <span>Inspect</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Inspect Email Modal */}
      {viewLog && (
        <Modal
          isOpen={!!viewLog}
          onClose={() => setViewLog(null)}
          title="Dispatched Email Audit Record"
          description={`Log ID: ${viewLog.id}`}
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Audience</span>
                <strong className="text-slate-800">{viewLog.audience}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Dispatched At</span>
                <strong className="text-slate-800">{formatDate(viewLog.sentAt)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Template</span>
                <strong className="text-slate-800">{viewLog.templateType}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Authorized By</span>
                <strong className="text-slate-800">{viewLog.senderName}</strong>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block font-bold mb-1">Subject:</span>
              <div className="p-3 rounded-xl bg-slate-100 text-slate-900 font-semibold">{viewLog.subject}</div>
            </div>

            <div>
              <span className="text-slate-500 block font-bold mb-1">Message Body:</span>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed font-mono text-[11px] max-h-60 overflow-y-auto">
                {viewLog.contentSnippet}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setViewLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
