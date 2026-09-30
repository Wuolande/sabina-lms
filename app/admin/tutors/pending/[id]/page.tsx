"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  FileText,
  GraduationCap,
  Briefcase,
  Globe,
  BookOpen,
  Video,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  History,
  User,
  Clock,
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  Award,
  Check,
  X,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useModal } from "@/components/ui/modal-context";
import { adminService } from "@/services/adminService";
import { TutorApplication, ApplicationDocument } from "@/src/modules/tutor-applications/domain/types";
import { formatDate } from "@/lib/utils";
import { DocumentViewerModal } from "@/components/admin/DocumentViewerModal";

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview & Bio", icon: User },
  { id: "documents", label: "Verification Documents", icon: ShieldCheck },
  { id: "education", label: "Education & Credentials", icon: GraduationCap },
  { id: "experience", label: "Teaching Experience", icon: Briefcase },
  { id: "subjects", label: "Subjects & Languages", icon: Globe },
  { id: "audit", label: "Review History & Audit", icon: History },
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

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon: Icon,
  badge,
  children,
  className = "",
}: {
  title: string;
  icon: React.ElementType;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#14209C]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Document Status Badge ────────────────────────────────────────────────────
function DocStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    VERIFIED: { cls: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "VERIFIED" },
    REJECTED: { cls: "bg-rose-100 text-rose-800 border-rose-200", label: "REJECTED" },
    PENDING: { cls: "bg-amber-100 text-amber-800 border-amber-200", label: "PENDING" },
  };
  const conf = map[status] || map.PENDING;
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${conf.cls}`}>
      {conf.label}
    </span>
  );
}

// ─── Application Status Badge ─────────────────────────────────────────────────
function AppStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "destructive" | "warning" | "default" | "secondary" | "subtle" }> = {
    APPROVED: { variant: "success" },
    ACTIVE: { variant: "success" },
    REJECTED: { variant: "destructive" },
    REQUESTED_CHANGES: { variant: "destructive" },
    UNDER_REVIEW: { variant: "warning" },
    SUBMITTED: { variant: "warning" },
    RESUBMITTED: { variant: "warning" },
    DRAFT: { variant: "subtle" },
  };
  const variant = map[status]?.variant || "warning";
  return (
    <Badge variant={variant} size="default" className="font-bold">
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

// ─── Main Application Inspection Page ─────────────────────────────────────────
export default function TutorApplicationInspectPage() {
  const params = useParams();
  const router = useRouter();
  const { confirm, prompt, toast } = useModal();

  const applicationId = params?.id as string;

  const [app, setApp] = React.useState<(TutorApplication & { auditTrail?: any[] }) | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<TabId>("overview");
  const [actionLoading, setActionLoading] = React.useState(false);
  const [selectedDocForViewer, setSelectedDocForViewer] = React.useState<ApplicationDocument | null>(null);

  const loadApplication = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getApplication(applicationId);
      setApp(data as any);
    } catch {
      toast({
        title: "Failed to load application",
        message: "Please verify the application ID or check your connection.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  React.useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleStartReview = async () => {
    if (!app) return;
    setActionLoading(true);
    const ok = await adminService.startReview(app.id);
    setActionLoading(false);
    if (ok) {
      toast({
        title: "Review Started",
        message: `Application for ${app.applicantName} is now UNDER REVIEW.`,
        variant: "warning",
      });
      loadApplication();
    }
  };

  const handleApprove = async () => {
    if (!app) return;
    const isConfirmed = await confirm({
      title: `Approve Application: ${app.applicantName}?`,
      message: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            This will immediately provision an active instructor profile for{" "}
            <strong>{app.applicantName}</strong> in the public tutor directory.
          </p>
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5 font-medium">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Active Tutor profile created in database</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Assigned platform role: <strong>TUTOR</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Hourly Rate set to <strong>${app.hourlyRate}/hr</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Credentials and subjects copied to active profile</span>
            </div>
          </div>
        </div>
      ),
      confirmText: "Approve & Provision Tutor",
      variant: "success",
    });

    if (isConfirmed) {
      setActionLoading(true);
      const ok = await adminService.approveTutor(app.id);
      setActionLoading(false);
      if (ok) {
        toast({
          title: "Application Approved!",
          message: `${app.applicantName} is now an active marketplace tutor.`,
          variant: "success",
        });
        loadApplication();
      }
    }
  };

  const handleReject = async () => {
    if (!app) return;
    const reason = await prompt({
      title: `Reject Application: ${app.applicantName}`,
      message:
        "Provide a detailed reason for the rejection. This feedback will be recorded in the audit trail and sent to the applicant.",
      placeholder:
        "e.g. Unclear identity verification documents or insufficient subject credentials...",
      required: true,
      multiline: true,
      variant: "danger",
      confirmText: "Reject Application",
    });

    if (reason) {
      setActionLoading(true);
      const ok = await adminService.rejectTutor(app.id, reason);
      setActionLoading(false);
      if (ok) {
        toast({
          title: "Application Rejected",
          message: `Application for ${app.applicantName} has been rejected.`,
          variant: "danger",
        });
        loadApplication();
      }
    }
  };

  const handleRequestChanges = async () => {
    if (!app) return;
    const notes = await prompt({
      title: `Request Changes from ${app.applicantName}`,
      message:
        "Explain what documents, corrections, or credential updates are required before this application can be approved.",
      placeholder:
        "e.g. Please re-upload a higher-resolution degree certificate and clarify teaching experience period...",
      required: true,
      multiline: true,
      variant: "warning",
      confirmText: "Send Change Request",
    });

    if (notes) {
      setActionLoading(true);
      const ok = await adminService.requestChanges(app.id, notes);
      setActionLoading(false);
      if (ok) {
        toast({
          title: "Changes Requested",
          message: `Applicant notified with requested amendments.`,
          variant: "warning",
        });
        loadApplication();
      }
    }
  };

  const handleReopen = async () => {
    if (!app) return;
    const notes = await prompt({
      title: `Re-open Application: ${app.applicantName}`,
      message: "Explain the reason for re-opening this rejected application for re-evaluation.",
      placeholder: "e.g. Applicant submitted supplementary proof via support...",
      required: true,
      multiline: true,
      variant: "warning",
      confirmText: "Re-open Application",
    });

    if (notes) {
      setActionLoading(true);
      const ok = await adminService.reopenApplication(app.id, notes);
      setActionLoading(false);
      if (ok) {
        toast({
          title: "Application Re-opened",
          message: `Application moved back to UNDER REVIEW.`,
          variant: "success",
        });
        loadApplication();
      }
    }
  };

  const handleVerifyDocument = async (docId: string, status: "VERIFIED" | "REJECTED") => {
    if (!app) return;
    const notes =
      status === "REJECTED"
        ? await prompt({
            title: "Document Rejection Reason",
            message: "Why is this document rejected?",
            placeholder: "e.g. Low resolution, expired document, wrong type...",
            required: false,
            multiline: true,
            variant: "danger",
            confirmText: "Reject Document",
          })
        : undefined;

    if (status === "REJECTED" && notes === null) return;

    setActionLoading(true);
    const ok = await adminService.verifyDocument(app.id, docId, status, notes || undefined);
    setActionLoading(false);

    if (ok) {
      toast({
        title: status === "VERIFIED" ? "Document Verified" : "Document Rejected",
        message: `Document status updated successfully.`,
        variant: status === "VERIFIED" ? "success" : "warning",
      });
      loadApplication();
    }
  };

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-64" />
        <div className="h-44 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserCheck className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">Application not found</h2>
        <p className="text-xs text-slate-400 mt-1">The requested tutor application does not exist or has been removed.</p>
        <Button variant="outline" className="mt-4 text-xs font-semibold" onClick={() => router.push("/admin/tutors/pending")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Applications Queue
        </Button>
      </div>
    );
  }

  const verifiedDocsCount = app.documents.filter((d) => d.verificationStatus === "VERIFIED").length;
  const totalDocsCount = app.documents.length;
  const isApproved = app.status === "APPROVED";
  const isRejected = app.status === "REJECTED";
  const isUnderReview = app.status === "UNDER_REVIEW";
  const isSubmitted = app.status === "SUBMITTED" || app.status === "RESUBMITTED";

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">

      {/* ── Breadcrumbs & Back Navigation ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/admin/tutors/pending")}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#14209C] transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Tutor Applications
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-700 font-semibold">{app.applicantName}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadApplication}
          disabled={actionLoading}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">

        {/* ══ LEFT — Main Application Inspection ════════════════════════════ */}
        <div className="space-y-6">

          {/* ── Hero Card ─────────────────────────────────────────────────── */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <Avatar
                src={app.applicantAvatar}
                fallbackName={app.applicantName}
                size="xl"
                className="shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h1 className="text-2xl font-black text-slate-900">{app.applicantName}</h1>
                  <AppStatusBadge status={app.status} />
                </div>

                <p className="text-sm font-semibold text-slate-700 mb-3">{app.headline}</p>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
                  {app.applicantEmail && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {app.applicantEmail}
                    </span>
                  )}
                  {app.submittedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Submitted {formatDate(app.submittedAt)}
                    </span>
                  )}
                  {app.reviewerName && (
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Reviewer: {app.reviewerName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Requested Changes Banner */}
            {app.requestedChanges && (
              <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs font-bold text-amber-900 block">Requested Amendments</span>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">{app.requestedChanges}</p>
                </div>
              </div>
            )}

            {/* Rejection Reason Banner */}
            {app.rejectionReason && (
              <div className="mt-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs font-bold text-rose-900 block">Rejection Feedback</span>
                  <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">{app.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Approval Notes Banner */}
            {app.approvalNotes && (
              <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs font-bold text-emerald-900 block">Approval Notes</span>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">{app.approvalNotes}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── KPI Metric Bar ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              label="Proposed Rate"
              value={`$${app.hourlyRate}/hr`}
              sub={app.currency || "USD"}
            />
            <KpiCard
              label="Experience"
              value={`${app.yearsExperience} yrs`}
              sub="teaching background"
            />
            <KpiCard
              label="Documents"
              value={`${verifiedDocsCount} / ${totalDocsCount}`}
              sub={verifiedDocsCount === totalDocsCount && totalDocsCount > 0 ? "All Verified" : "Pending Verification"}
            />
            <KpiCard
              label="Subjects / Langs"
              value={`${app.subjects.length} / ${app.languages.length}`}
              sub="offered capabilities"
            />
          </div>

          {/* ── Tab Navigation ────────────────────────────────────────────── */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none bg-slate-100 p-1 rounded-2xl">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  activeTab === id
                    ? "bg-white text-[#14209C] shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {id === "documents" && totalDocsCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      verifiedDocsCount === totalDocsCount
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {verifiedDocsCount}/{totalDocsCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ══ TAB CONTENTS ═════════════════════════════════════════════════ */}

          {/* Tab 1: Overview & Bio */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <SectionCard title="Professional Biography" icon={User}>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {app.bio || "No biography provided."}
                </p>
              </SectionCard>

              {app.teachingStyle && (
                <SectionCard title="Teaching Philosophy & Methodology" icon={BookOpen}>
                  <p className="text-sm text-slate-700 leading-relaxed">{app.teachingStyle}</p>
                </SectionCard>
              )}

              {app.introVideoUrl && (
                <SectionCard title="Video Introduction" icon={Video}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Video className="w-5 h-5 text-[#14209C] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">Introductory Video Pitch</p>
                        <p className="text-[10px] text-slate-400 truncate">{app.introVideoUrl}</p>
                      </div>
                      <a
                        href={app.introVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#14209C] text-white text-xs font-semibold hover:bg-[#0d1870] transition"
                      >
                        <ExternalLink className="w-3 h-3" /> Watch Video
                      </a>
                    </div>
                  </div>
                </SectionCard>
              )}
            </div>
          )}

          {/* Tab 2: Documents Verification Hub */}
          {activeTab === "documents" && (
            <SectionCard
              title="Verification Documents Hub"
              icon={ShieldCheck}
              badge={
                <span className="text-xs text-slate-400 font-semibold">
                  {verifiedDocsCount} of {totalDocsCount} verified
                </span>
              }
            >
              {app.documents.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">No Documents Uploaded</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      The applicant has not submitted government identity or academic diploma documents yet.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRequestChanges}
                    className="text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50 rounded-xl"
                  >
                    Request Documents from Applicant
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Category groups */}
                  {[
                    {
                      category: "IDENTITY",
                      title: "Government Identity Documents",
                      icon: ShieldCheck,
                      desc: "Passports, national ID cards, and driver's licenses for KYC verification.",
                    },
                    {
                      category: "DEGREE_CERTIFICATE",
                      title: "Academic Degrees & Diplomas",
                      icon: GraduationCap,
                      desc: "Undergraduate, Master's, or Ph.D. graduation diplomas and university transcripts.",
                    },
                    {
                      category: "TEACHING_CREDENTIAL",
                      title: "Teaching Accreditations & Certifications",
                      icon: Award,
                      desc: "Qualified Teacher Status, TEFL/CELTA, and state licensing credentials.",
                    },
                    {
                      category: "OTHER",
                      title: "Other Supporting Documents",
                      icon: FileText,
                      desc: "Curriculum Vitae, resumes, reference letters, and supplementary certificates.",
                    },
                  ].map(({ category, title, icon: CatIcon, desc }) => {
                    const catDocs = app.documents.filter((d) =>
                      category === "OTHER"
                        ? !["IDENTITY", "DEGREE_CERTIFICATE", "TEACHING_CREDENTIAL"].includes(d.documentType)
                        : d.documentType === category
                    );

                    if (catDocs.length === 0) return null;

                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                          <CatIcon className="w-4 h-4 text-[#14209C]" />
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                              {title} ({catDocs.length})
                            </h4>
                            <p className="text-[10px] text-slate-400">{desc}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {catDocs.map((doc) => {
                            const isPdf = doc.fileUrl.toLowerCase().endsWith(".pdf") || doc.fileUrl.includes(".pdf?");
                            return (
                              <div
                                key={doc.id}
                                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xs transition space-y-3"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-start gap-3 min-w-0">
                                    <div
                                      onClick={() => setSelectedDocForViewer(doc)}
                                      className="w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 flex items-center justify-center text-[#14209C] shrink-0 cursor-pointer transition relative group overflow-hidden"
                                    >
                                      {!isPdf ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={doc.fileUrl}
                                          alt={doc.title}
                                          className="w-full h-full object-cover rounded-xl"
                                        />
                                      ) : (
                                        <FileText className="w-6 h-6 text-indigo-700" />
                                      )}
                                      <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                        <Eye className="w-4 h-4 text-white" />
                                      </div>
                                    </div>

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-xs font-bold text-slate-900 truncate">{doc.title}</h4>
                                        <DocStatusBadge status={doc.verificationStatus} />
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          Format: {isPdf ? "PDF Document" : "Image / Scan"}
                                        </span>
                                        <span className="text-[10px] text-slate-400">•</span>
                                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                                          {doc.fileUrl}
                                        </span>
                                      </div>
                                      {doc.notes && (
                                        <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium">
                                          <strong>Rejection Reason:</strong> {doc.notes}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => setSelectedDocForViewer(doc)}
                                      className="text-xs bg-[#14209C] hover:bg-[#0f1877] text-white h-8 px-3 rounded-lg shadow-xs"
                                    >
                                      <Eye className="w-3.5 h-3.5 mr-1" />
                                      Inspect
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleVerifyDocument(doc.id, "VERIFIED")}
                                      disabled={actionLoading || doc.verificationStatus === "VERIFIED"}
                                      className="text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-300 h-8 px-2.5 rounded-lg"
                                    >
                                      <Check className="w-3.5 h-3.5 mr-1" />
                                      Verify
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleVerifyDocument(doc.id, "REJECTED")}
                                      disabled={actionLoading || doc.verificationStatus === "REJECTED"}
                                      className="text-xs text-rose-700 hover:bg-rose-50 border-rose-300 h-8 px-2.5 rounded-lg"
                                    >
                                      <X className="w-3.5 h-3.5 mr-1" />
                                      Reject
                                    </Button>

                                    <a
                                      href={doc.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Open in new window"
                                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          )}

          {/* Tab 3: Education & Credentials */}
          {activeTab === "education" && (
            <SectionCard title="Academic Qualifications & Degrees" icon={GraduationCap}>
              {app.education.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No academic qualifications entered.
                </p>
              ) : (
                <div className="space-y-4">
                  {app.education.map((e) => {
                    const matchingDoc =
                      app.documents.find(
                        (d) =>
                          d.documentType === "DEGREE_CERTIFICATE" &&
                          (d.title.toLowerCase().includes(e.degree.toLowerCase()) ||
                            d.title.toLowerCase().includes(e.institution.toLowerCase()))
                      ) || app.documents.find((d) => d.documentType === "DEGREE_CERTIFICATE");

                    return (
                      <div
                        key={e.id}
                        className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900">{e.degree}</h4>
                            <p className="text-xs text-slate-600 font-semibold">{e.institution}</p>
                            {e.fieldOfStudy && (
                              <p className="text-[11px] text-slate-500 mt-0.5">Field of Study: {e.fieldOfStudy}</p>
                            )}
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {e.startYear} — {e.endYear || "Present"}
                            </p>
                            {e.honors && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                {e.honors}
                              </span>
                            )}
                          </div>
                          {matchingDoc?.verificationStatus === "VERIFIED" || e.isVerified ? (
                            <Badge variant="success" size="sm">
                              <ShieldCheck className="w-3 h-3 mr-1" /> Degree Verified
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">Unverified</Badge>
                          )}
                        </div>

                        {/* Associated Diploma Document Preview Strip */}
                        {matchingDoc ? (
                          <div className="p-3 rounded-xl bg-white border border-indigo-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{matchingDoc.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <DocStatusBadge status={matchingDoc.verificationStatus} />
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedDocForViewer(matchingDoc)}
                              className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 h-8 px-3 rounded-lg shrink-0 font-bold"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> Inspect Diploma
                            </Button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic bg-white/60 p-2.5 rounded-xl border border-slate-100">
                            No diploma file attached for this degree entry.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          )}

          {/* Tab 4: Teaching Experience & Certifications */}
          {activeTab === "experience" && (
            <div className="space-y-6">
              {/* Teaching Accreditations Strip */}
              {app.documents.some((d) => d.documentType === "TEACHING_CREDENTIAL") && (
                <SectionCard title="Teaching Accreditations & Licenses" icon={Award}>
                  <div className="space-y-3">
                    {app.documents
                      .filter((d) => d.documentType === "TEACHING_CREDENTIAL")
                      .map((credDoc) => (
                        <div
                          key={credDoc.id}
                          className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Award className="w-5 h-5 text-amber-700 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{credDoc.title}</p>
                              <DocStatusBadge status={credDoc.verificationStatus} />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDocForViewer(credDoc)}
                            className="text-xs text-amber-900 border-amber-300 hover:bg-amber-100 h-8 px-3 rounded-lg shrink-0 font-bold"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Inspect Credential
                          </Button>
                        </div>
                      ))}
                  </div>
                </SectionCard>
              )}

              <SectionCard title="Employment & Tutoring Experience" icon={Briefcase}>
                {app.experience.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No teaching experience records provided.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {app.experience.map((ex) => (
                      <div key={ex.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{ex.role}</h4>
                            <p className="text-xs text-slate-600 font-semibold">{ex.organization}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-bold">
                            {ex.startYear} — {ex.isCurrent ? "Present" : ex.endYear || "Present"}
                          </span>
                        </div>
                        {ex.location && <p className="text-[11px] text-slate-400">{ex.location}</p>}
                        {ex.description && (
                          <p className="text-xs text-slate-600 leading-relaxed pt-1 whitespace-pre-line">
                            {ex.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {/* Tab 5: Subjects & Languages */}
          {activeTab === "subjects" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SectionCard title="Teaching Subjects" icon={BookOpen}>
                {app.subjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No subjects listed.</p>
                ) : (
                  <div className="space-y-2">
                    {app.subjects.map((s) => (
                      <div key={s.subjectId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{s.subjectName}</span>
                          {s.isPrimary && (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              ★ Primary
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(s.levels || []).map((lvl) => (
                            <span
                              key={lvl}
                              className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 text-[10px] font-semibold"
                            >
                              {lvl}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Spoken Languages" icon={Globe}>
                {app.languages.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No languages specified.</p>
                ) : (
                  <div className="space-y-2">
                    {app.languages.map((l) => (
                      <div
                        key={l.languageId}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <span className="text-xs font-bold text-slate-900">{l.languageName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            l.proficiency === "NATIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {l.proficiency}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {/* Tab 6: Review History & Audit Trail */}
          {activeTab === "audit" && (
            <SectionCard title="Application Review History & Audit Logs" icon={History}>
              {(!app.auditTrail || app.auditTrail.length === 0) ? (
                <div className="text-center py-8 space-y-2">
                  <History className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 italic">No admin actions recorded yet for this application.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {app.auditTrail.map((log: any) => (
                    <div key={log.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</span>
                      </div>
                      {log.details && <p className="text-xs text-slate-700">{log.details}</p>}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <User className="w-3 h-3" />
                        <span>{log.actorName}</span>
                        {log.actorRole && <span className="px-1.5 rounded bg-slate-100 text-slate-600">{log.actorRole}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

        </div>

        {/* ══ RIGHT — Sticky Workflow Action Sidebar ════════════════════════ */}
        <div className="xl:sticky xl:top-6 space-y-4">

          {/* Review Actions Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Review Decisions
            </h3>

            {/* Current Status */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Status</span>
              <AppStatusBadge status={app.status} />
            </div>

            {/* Proposed Rate Display */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Requested Rate</span>
              <span className="text-base font-black text-slate-900">${app.hourlyRate}/hr</span>
            </div>

            {/* Action Buttons based on workflow status */}
            <div className="space-y-2 pt-1">
              {/* Start Review (when submitted) */}
              {isSubmitted && (
                <Button
                  variant="outline"
                  className="w-full text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={handleStartReview}
                  disabled={actionLoading}
                >
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  Start Review Process
                </Button>
              )}

              {/* Approve & Provision Button */}
              {!isApproved && (
                <Button
                  variant="default"
                  className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Approve & Provision Tutor
                </Button>
              )}

              {/* Request Changes Button */}
              {!isApproved && !isRejected && (
                <Button
                  variant="outline"
                  className="w-full text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={handleRequestChanges}
                  disabled={actionLoading}
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
                  Request Changes
                </Button>
              )}

              {/* Reject Button */}
              {!isApproved && !isRejected && (
                <Button
                  variant="outline"
                  className="w-full text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  Reject Application
                </Button>
              )}

              {/* Reopen Button (if rejected) */}
              {isRejected && (
                <Button
                  variant="outline"
                  className="w-full text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={handleReopen}
                  disabled={actionLoading}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Re-open Application
                </Button>
              )}
            </div>
          </div>

          {/* Quick Shortcuts Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Navigation
            </h3>

            <button
              onClick={() => router.push("/admin/tutors/pending")}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              All Applications Queue
            </button>

            <button
              onClick={() => router.push("/admin/tutors")}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
            >
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              Active Tutors Directory
            </button>
          </div>

          {/* Metadata Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[10px] text-slate-400 space-y-1 font-mono">
            <p className="truncate">App ID: {app.id}</p>
            <p className="truncate">User ID: {app.applicantUserId}</p>
            <p>Created: {formatDate(app.createdAt)}</p>
            <p>Updated: {formatDate(app.updatedAt)}</p>
          </div>

        </div>

      </div>

      {/* ── Document Inspection High-Resolution Modal ── */}
      <DocumentViewerModal
        document={selectedDocForViewer}
        isOpen={Boolean(selectedDocForViewer)}
        onClose={() => setSelectedDocForViewer(null)}
        onVerify={async (docId) => {
          await handleVerifyDocument(docId, "VERIFIED");
          setSelectedDocForViewer(null);
        }}
        onReject={async (docId) => {
          await handleVerifyDocument(docId, "REJECTED");
          setSelectedDocForViewer(null);
        }}
        isActionLoading={actionLoading}
      />
    </div>
  );
}
