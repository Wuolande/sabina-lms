"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  BookOpen,
  Globe,
  GraduationCap,
  Award,
  Briefcase,
  ShieldCheck,
  FileText,
  History,
  BarChart3,
  Ban,
  CheckCircle2,
  Edit2,
  Sparkles,
  BadgeCheck,
  ExternalLink,
  Video,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  TrendingUp,
  MessageSquare,
  Check,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useModal } from "@/components/ui/modal-context";
import { adminService } from "@/services/adminService";
import { Tutor360Aggregate } from "@/src/modules/tutors/domain/types";
import { formatDate } from "@/lib/utils";

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "credentials", label: "Credentials", icon: GraduationCap },
  { id: "subjects", label: "Subjects & Languages", icon: Globe },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "performance", label: "Performance", icon: BarChart3 },
  { id: "audit", label: "Audit Trail", icon: History },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-lg font-black text-slate-900 leading-tight">{value}</span>
      {sub && <span className="text-[10px] text-slate-400">{sub}</span>}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children, className = "" }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#14209C]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Document status badge ────────────────────────────────────────────────────
function DocStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    VERIFIED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${map[status] || map.PENDING}`}>
      {status}
    </span>
  );
}

// ─── Audit action color ───────────────────────────────────────────────────────
function auditActionColor(action: string) {
  if (action.includes("SUSPEND")) return "text-rose-600 bg-rose-50 border-rose-200";
  if (action.includes("REACTIVATE") || action.includes("APPROVED")) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (action.includes("REJECT")) return "text-rose-700 bg-rose-50 border-rose-200";
  if (action.includes("FEATURED") || action.includes("SUPER")) return "text-indigo-700 bg-indigo-50 border-indigo-200";
  if (action.includes("RATE")) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-slate-700 bg-slate-50 border-slate-200";
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TutorProfile360Page() {
  const params = useParams();
  const router = useRouter();
  const { confirm, prompt, toast } = useModal();

  const tutorId = params?.id as string;

  const [tutor, setTutor] = React.useState<Tutor360Aggregate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<TabId>("overview");
  const [editingRate, setEditingRate] = React.useState(false);
  const [newRate, setNewRate] = React.useState("");
  const [savingRate, setSavingRate] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getTutor360(tutorId);
      setTutor(data);
      setNewRate(String(data.hourlyRate));
    } catch {
      toast({ title: "Failed to load tutor profile", message: "Please try again.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  React.useEffect(() => { load(); }, [load]);

  const handleSuspend = async () => {
    if (!tutor) return;
    const reason = await prompt({
      title: `Suspend ${tutor.user.displayName}`,
      message: "State the reason for suspension. Their public profile will be immediately hidden.",
      placeholder: "e.g. Policy violation regarding off-platform scheduling...",
      required: true,
      multiline: true,
      variant: "danger",
      confirmText: "Suspend Account",
    });
    if (!reason) return;
    setActionLoading(true);
    const ok = await adminService.suspendTutor(tutor.id, reason);
    setActionLoading(false);
    if (ok) { toast({ title: "Tutor Suspended", message: `${tutor.user.displayName} suspended.`, variant: "warning" }); load(); }
    else toast({ title: "Error", message: "Failed to suspend account.", variant: "danger" });
  };

  const handleReactivate = async () => {
    if (!tutor) return;
    const ok2 = await confirm({
      title: `Reactivate ${tutor.user.displayName}?`,
      message: "This will restore full marketplace access for this tutor.",
      confirmText: "Reactivate",
      variant: "success",
    });
    if (!ok2) return;
    setActionLoading(true);
    const ok = await adminService.reactivateTutor(tutor.id);
    setActionLoading(false);
    if (ok) { toast({ title: "Tutor Reactivated", message: `${tutor.user.displayName} restored.`, variant: "success" }); load(); }
    else toast({ title: "Error", message: "Failed to reactivate.", variant: "danger" });
  };

  const handleSaveRate = async () => {
    if (!tutor) return;
    const rate = Number(newRate);
    if (isNaN(rate) || rate < 1) { toast({ title: "Invalid rate", message: "Must be a number ≥ $1.", variant: "danger" }); return; }
    setSavingRate(true);
    const ok = await adminService.updateTutorRate(tutor.id, rate);
    setSavingRate(false);
    if (ok) { toast({ title: "Rate Updated", message: `Hourly rate set to $${rate}.`, variant: "success" }); setEditingRate(false); load(); }
    else toast({ title: "Error", message: "Failed to update rate.", variant: "danger" });
  };

  const handleToggleFeatured = async () => {
    if (!tutor) return;
    setActionLoading(true);
    await adminService.toggleFeatured(tutor.id);
    setActionLoading(false);
    load();
  };

  const handleToggleSuperTutor = async () => {
    if (!tutor) return;
    setActionLoading(true);
    await adminService.toggleSuperTutor(tutor.id);
    setActionLoading(false);
    load();
  };

  const handleVerifyDocument = async (appId: string, docId: string, status: "VERIFIED" | "REJECTED") => {
    const notes = status === "REJECTED"
      ? await prompt({ title: "Rejection Notes", message: "Why is this document being rejected?", placeholder: "e.g. Image unclear, wrong document type...", required: false, multiline: true, variant: "danger", confirmText: "Reject Document" })
      : undefined;

    // If prompt was cancelled for rejected status
    if (status === "REJECTED" && notes === null) return;

    const ok = await adminService.verifyDocument(appId, docId, status, notes || undefined);
    if (ok) {
      toast({ title: status === "VERIFIED" ? "Document Verified" : "Document Rejected", message: "Document status updated.", variant: status === "VERIFIED" ? "success" : "warning" });
      load();
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-48" />
        <div className="h-40 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-xl font-bold text-slate-700">Tutor not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/tutors")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tutors
        </Button>
      </div>
    );
  }

  const isSuspended = tutor.accountStatus === "SUSPENDED";

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/admin/tutors")}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#14209C] transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Manage Tutors
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-xs text-slate-700 font-semibold">{tutor.user.displayName}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ══ LEFT — Main Profile Content ═══════════════════════════════════ */}
        <div className="space-y-6">

          {/* ── Hero Card ─────────────────────────────────────────────────── */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="relative shrink-0">
                <Avatar src={tutor.user.avatarUrl} fallbackName={tutor.user.displayName} size="xl" />
                {tutor.isSuperTutor && (
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow">★</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-black text-slate-900">{tutor.user.displayName}</h1>
                  {tutor.isFeatured && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#14209C] text-white">FEATURED</span>
                  )}
                  {tutor.isSuperTutor && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">SUPER TUTOR</span>
                  )}
                  <Badge
                    variant={isSuspended ? "destructive" : "success"}
                    size="sm"
                  >
                    {tutor.accountStatus}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-slate-600 mb-3">{tutor.headline}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
                  {tutor.user.email && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {tutor.user.email}
                    </span>
                  )}
                  {tutor.user.country && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {tutor.user.country}
                    </span>
                  )}
                  {tutor.user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {tutor.user.phone}
                    </span>
                  )}
                  {tutor.user.timezone && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {tutor.user.timezone}
                    </span>
                  )}
                  {tutor.user.createdAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Member since {formatDate(tutor.user.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Suspension Alert */}
            {isSuspended && (
              <div className="mt-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-rose-800 block">Account Suspended</span>
                  <p className="text-xs text-rose-700 mt-0.5">{tutor.suspensionReason || "No reason provided."}</p>
                  {tutor.suspendedAt && (
                    <p className="text-[10px] text-rose-400 mt-0.5">Suspended on {formatDate(tutor.suspendedAt)}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── KPI Metrics Bar ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Hourly Rate" value={`$${tutor.hourlyRate}/hr`} sub={tutor.currency} />
            <KpiCard label="Rating" value={<span className="text-amber-600">{tutor.averageRating.toFixed(1)} ★</span>} sub={`${tutor.reviewCount} reviews`} />
            <KpiCard label="Total Lessons" value={tutor.totalLessons} sub={`${tutor.totalStudents} students`} />
            <KpiCard label="Experience" value={`${tutor.yearsExperience} yrs`} sub="teaching" />
            <KpiCard label="Response Time" value={`${tutor.responseTimeMinutes}m`} sub="avg" />
            <KpiCard label="Attendance" value={`${tutor.attendanceRate}%`} />
            <KpiCard label="Repeat Students" value={`${tutor.repeatStudentRate}%`} />
            <KpiCard label="Slug" value={<span className="text-xs font-mono text-slate-600 truncate block">{tutor.slug}</span>} />
          </div>

          {/* ── Tab Navigation ────────────────────────────────────────────── */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none bg-slate-100 p-1 rounded-2xl">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  activeTab === id
                    ? "bg-white text-[#14209C] shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ══ TAB CONTENT ══════════════════════════════════════════════════ */}

          {/* Tab: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <SectionCard title="Biography" icon={User}>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{tutor.bio}</p>
              </SectionCard>

              {tutor.teachingStyle && (
                <SectionCard title="Teaching Style & Methodology" icon={BookOpen}>
                  <p className="text-sm text-slate-700 leading-relaxed">{tutor.teachingStyle}</p>
                </SectionCard>
              )}

              {tutor.introVideoUrl && (
                <SectionCard title="Intro Video" icon={Video}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Video className="w-5 h-5 text-[#14209C] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">External Video Link</p>
                      <p className="text-[10px] text-slate-400 truncate">{tutor.introVideoUrl}</p>
                    </div>
                    <a
                      href={tutor.introVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#14209C] text-white text-xs font-semibold hover:bg-[#0d1870] transition"
                    >
                      <ExternalLink className="w-3 h-3" /> Watch
                    </a>
                  </div>
                </SectionCard>
              )}
            </div>
          )}

          {/* Tab: Credentials */}
          {activeTab === "credentials" && (
            <div className="space-y-4">
              <SectionCard title="Education" icon={GraduationCap}>
                {tutor.education.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No education records.</p>
                ) : (
                  <div className="space-y-3">
                    {tutor.education.map((e) => (
                      <div key={e.id} className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-50">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">{e.degree}</p>
                          <p className="text-xs text-slate-500">{e.institution}</p>
                          {e.fieldOfStudy && <p className="text-[11px] text-slate-400">Field: {e.fieldOfStudy}</p>}
                          <p className="text-[11px] text-slate-400">{e.startYear} – {e.endYear || "Present"}</p>
                          {e.honors && <p className="text-[11px] text-amber-600 font-semibold">{e.honors}</p>}
                        </div>
                        {e.isVerified ? (
                          <Badge variant="success" size="sm"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Unverified</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Certifications" icon={Award}>
                {tutor.certifications.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No certifications.</p>
                ) : (
                  <div className="space-y-3">
                    {tutor.certifications.map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-50">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">{c.title}</p>
                          <p className="text-xs text-slate-500">{c.issuer} · {c.issueYear}</p>
                          {c.credentialId && <p className="text-[11px] text-slate-400 font-mono">ID: {c.credentialId}</p>}
                          {c.certificateUrl && (
                            <a href={c.certificateUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[#14209C] flex items-center gap-0.5 hover:underline">
                              <ExternalLink className="w-3 h-3" /> View Certificate
                            </a>
                          )}
                        </div>
                        {c.isVerified ? (
                          <Badge variant="success" size="sm"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Unverified</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Teaching Experience" icon={Briefcase}>
                {tutor.experiences.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No experience records.</p>
                ) : (
                  <div className="space-y-3">
                    {tutor.experiences.map((ex) => (
                      <div key={ex.id} className="p-3.5 rounded-xl bg-slate-50">
                        <p className="text-sm font-bold text-slate-900">{ex.role}</p>
                        <p className="text-xs text-slate-500">{ex.organization} {ex.location && `· ${ex.location}`}</p>
                        <p className="text-[11px] text-slate-400">{ex.period}</p>
                        {ex.description && <p className="text-xs text-slate-600 mt-1.5">{ex.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {/* Tab: Subjects & Languages */}
          {activeTab === "subjects" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SectionCard title="Teaching Subjects" icon={BookOpen}>
                {tutor.subjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No subjects assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {tutor.subjects.map((s) => (
                      <div key={s.id} className="flex items-start justify-between gap-2 p-3 rounded-xl bg-slate-50">
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            {s.name} {s.isPrimary && <span className="text-amber-500">★ Primary</span>}
                          </span>
                          {s.category && <p className="text-[10px] text-slate-400">{s.category}</p>}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(s.levels || []).map((l) => (
                              <span key={l} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 text-[10px] font-semibold">{l}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Spoken Languages" icon={Globe}>
                {tutor.languages.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No languages listed.</p>
                ) : (
                  <div className="space-y-2">
                    {tutor.languages.map((l) => (
                      <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                        <span className="text-xs font-bold text-slate-900">{l.name}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          l.proficiency === "NATIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                        }`}>
                          {l.proficiency}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {/* Tab: Documents */}
          {activeTab === "documents" && (
            <SectionCard title="Verification Documents" icon={FileText}>
              {!tutor.applicationId ? (
                <p className="text-xs text-slate-400 italic">No linked application found. Documents are attached to the original application.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400">
                    Application ID: <span className="font-mono">{tutor.applicationId}</span>
                  </p>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-xs text-amber-800 font-semibold">Document verification is managed on the application inspection page.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
                      onClick={() => router.push(`/admin/tutors/pending`)}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Go to Applications
                    </Button>
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* Tab: Performance */}
          {activeTab === "performance" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Total Revenue" value="—" sub="Coming soon" />
                <KpiCard label="Platform Fee" value="—" sub="Coming soon" />
                <KpiCard label="Net Payout" value="—" sub="Coming soon" />
                <KpiCard label="Pending" value="—" sub="Coming soon" />
              </div>
              <SectionCard title="Recent Activity" icon={TrendingUp}>
                <p className="text-xs text-slate-400 italic">Booking and earnings data will appear here once lessons are recorded.</p>
              </SectionCard>
            </div>
          )}

          {/* Tab: Audit Trail */}
          {activeTab === "audit" && (
            <SectionCard title="Administrative Audit Trail" icon={History}>
              {tutor.auditTrail.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No admin actions recorded yet for this tutor profile.</p>
              ) : (
                <div className="space-y-3">
                  {tutor.auditTrail.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-xl border bg-white space-y-1.5">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${auditActionColor(log.action)}`}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</span>
                      </div>
                      {log.details && <p className="text-xs text-slate-600">{log.details}</p>}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <User className="w-3 h-3" />
                        <span>{log.actorName}</span>
                        {log.actorRole && <span className="px-1.5 rounded bg-slate-100 text-slate-600">{log.actorRole}</span>}
                        {log.ipAddress && <span className="font-mono">{log.ipAddress}</span>}
                      </div>
                      {(log.beforeState || log.afterState) && (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {log.beforeState && (
                            <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                              <p className="text-[10px] font-bold text-rose-600 mb-1">BEFORE</p>
                              <pre className="text-[10px] text-slate-600 whitespace-pre-wrap break-all">{JSON.stringify(log.beforeState, null, 2)}</pre>
                            </div>
                          )}
                          {log.afterState && (
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                              <p className="text-[10px] font-bold text-emerald-600 mb-1">AFTER</p>
                              <pre className="text-[10px] text-slate-600 whitespace-pre-wrap break-all">{JSON.stringify(log.afterState, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}
        </div>

        {/* ══ RIGHT — Sticky Admin Action Sidebar ══════════════════════════ */}
        <div className="xl:sticky xl:top-6 space-y-4">

          {/* Status Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Actions</h3>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Status</span>
              <Badge variant={isSuspended ? "destructive" : "success"}>
                {tutor.accountStatus}
              </Badge>
            </div>

            {/* Suspend / Reactivate */}
            {isSuspended ? (
              <Button
                variant="default"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={handleReactivate}
                disabled={actionLoading}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Reactivate Account
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
                onClick={handleSuspend}
                disabled={actionLoading}
              >
                <Ban className="w-3.5 h-3.5 mr-1.5" />
                Suspend Account
              </Button>
            )}
          </div>

          {/* Rate Editor */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hourly Rate</h3>
            {editingRate ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 overflow-hidden">
                  <span className="px-2 py-2 bg-slate-50 text-slate-500 text-sm font-bold border-r border-slate-200">$</span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="flex-1 px-2 py-2 text-sm font-bold outline-none"
                    autoFocus
                  />
                  <span className="px-2 text-slate-400 text-xs">/hr</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-[#14209C] hover:bg-[#0d1870] text-white text-xs"
                    onClick={handleSaveRate}
                    disabled={savingRate}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    {savingRate ? "Saving..." : "Save"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => { setEditingRate(false); setNewRate(String(tutor.hourlyRate)); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-slate-900">${tutor.hourlyRate}/hr</span>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditingRate(true)}>
                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                </Button>
              </div>
            )}
          </div>

          {/* Badges & Flags */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile Flags</h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#14209C]" />
                <span className="text-xs font-semibold text-slate-700">Featured</span>
              </div>
              <button
                onClick={handleToggleFeatured}
                disabled={actionLoading}
                className={`relative w-10 h-5 rounded-full transition-colors ${tutor.isFeatured ? "bg-[#14209C]" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${tutor.isFeatured ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-700">Super Tutor</span>
              </div>
              <button
                onClick={handleToggleSuperTutor}
                disabled={actionLoading}
                className={`relative w-10 h-5 rounded-full transition-colors ${tutor.isSuperTutor ? "bg-amber-500" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${tutor.isSuperTutor ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick Links</h3>
            {tutor.applicationId && (
              <button
                onClick={() => router.push(`/admin/tutors/pending`)}
                className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" /> View Original Application
              </button>
            )}
            <button
              onClick={() => router.push(`/admin/audit-logs?entity=TUTOR_PROFILE&entityId=${tutor.id}`)}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
            >
              <History className="w-3.5 h-3.5 text-slate-400" /> Full Audit Log
            </button>
            <button
              onClick={() => router.push(`/admin/tutors`)}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" /> Back to Tutors
            </button>
          </div>

          {/* Profile Meta */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[10px] text-slate-400 space-y-1 font-mono">
            <p>ID: {tutor.id}</p>
            <p>User: {tutor.userId}</p>
            {tutor.applicationId && <p>App: {tutor.applicationId}</p>}
            <p>Joined: {formatDate(tutor.createdAt)}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
