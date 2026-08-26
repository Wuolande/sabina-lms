"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  Globe,
  Mail,
  Phone,
  Calendar,
  History,
  CheckCircle2,
  XCircle,
  Ban,
  RefreshCw,
  Target,
  Sparkles,
  ExternalLink,
  Lock,
  Edit2,
  Check,
  AlertTriangle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useModal } from "@/components/ui/modal-context";
import { adminService } from "@/services/adminService";
import { User360Aggregate } from "@/src/modules/users/domain/types";
import { formatDate } from "@/lib/utils";

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Identity & Profile", icon: User },
  { id: "roles", label: "Roles & RBAC Access", icon: ShieldCheck },
  { id: "student", label: "Student Learning Profile", icon: GraduationCap },
  { id: "tutor", label: "Tutor Profile", icon: Award },
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

export default function AdminUser360Page() {
  const params = useParams();
  const router = useRouter();
  const { confirm, prompt, toast } = useModal();

  const userId = params?.id as string;

  const [user, setUser] = React.useState<User360Aggregate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<TabId>("overview");
  const [actionLoading, setActionLoading] = React.useState(false);

  // Editable fields state
  const [isEditingRoles, setIsEditingRoles] = React.useState(false);
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);

  const loadUser = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getUser360(userId);
      setUser(data);
      setSelectedRoles(data.roles || []);
    } catch {
      toast({
        title: "Failed to load user",
        message: "Please check user ID or network connection.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSuspend = async () => {
    if (!user) return;
    const reason = await prompt({
      title: `Suspend User: ${user.displayName}`,
      message: "Provide a detailed reason for the suspension.",
      placeholder: "e.g. Terms violation or suspicious activity...",
      required: true,
      multiline: true,
      variant: "danger",
      confirmText: "Suspend Account",
    });

    if (reason) {
      setActionLoading(true);
      const ok = await adminService.suspendUser(user.id, reason);
      setActionLoading(false);
      if (ok) {
        toast({ title: "User Suspended", message: `${user.displayName} is now suspended.`, variant: "warning" });
        loadUser();
      }
    }
  };

  const handleReactivate = async () => {
    if (!user) return;
    const ok2 = await confirm({
      title: `Reactivate: ${user.displayName}?`,
      message: "This will restore full platform login and privileges.",
      confirmText: "Reactivate Account",
      variant: "success",
    });

    if (ok2) {
      setActionLoading(true);
      const ok = await adminService.reactivateUser(user.id);
      setActionLoading(false);
      if (ok) {
        toast({ title: "User Reactivated", message: `${user.displayName} is now active.`, variant: "success" });
        loadUser();
      }
    }
  };

  const handleSaveRoles = async () => {
    if (!user || selectedRoles.length === 0) return;
    setActionLoading(true);
    const ok = await adminService.updateUserRoles(user.id, selectedRoles);
    setActionLoading(false);
    if (ok) {
      toast({ title: "Roles Updated", message: "Platform access permissions saved.", variant: "success" });
      setIsEditingRoles(false);
      loadUser();
    }
  };

  const toggleRole = (r: string) => {
    if (selectedRoles.includes(r)) {
      if (selectedRoles.length === 1) {
        toast({ title: "Warning", message: "User must have at least one role.", variant: "warning" });
        return;
      }
      setSelectedRoles(selectedRoles.filter((item) => item !== r));
    } else {
      setSelectedRoles([...selectedRoles, r]);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-64" />
        <div className="h-44 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-700">User Account Not Found</h2>
        <Button variant="outline" className="mt-4 text-xs font-semibold" onClick={() => router.push("/admin/users")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users Directory
        </Button>
      </div>
    );
  }

  const isSuspended = user.status === "SUSPENDED";
  const isStudent = user.roles.includes("STUDENT" as any);
  const isTutor = user.roles.includes("TUTOR" as any);

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/admin/users")}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#14209C] transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Users Directory
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-700 font-semibold">{user.displayName}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadUser}
          disabled={actionLoading}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">

        {/* ══ LEFT — Main User 360 Content ════════════════════════════════════ */}
        <div className="space-y-6">

          {/* Hero Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <Avatar
                src={user.avatarUrl}
                fallbackName={user.displayName}
                size="xl"
                className="shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h1 className="text-2xl font-black text-slate-900">{user.displayName}</h1>
                  <Badge variant={isSuspended ? "destructive" : "success"} size="default" className="font-bold">
                    {user.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {user.roles.map((r) => (
                    <Badge
                      key={r}
                      variant={
                        r === "SUPER_ADMIN" || r === "ADMIN"
                          ? "destructive"
                          : r === "TUTOR"
                          ? "default"
                          : "subtle"
                      }
                      size="sm"
                      className="text-[11px] font-bold"
                    >
                      {r}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
                  </span>
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {user.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" /> {user.country || "Global"} ({user.timezone})
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member since {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Suspension Banner */}
            {isSuspended && (
              <div className="mt-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-rose-900 block">Account Suspended</span>
                  <p className="text-xs text-rose-800 mt-0.5">
                    This account is currently blocked from signing in or taking lessons.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              label="Assigned Roles"
              value={user.roles.length}
              sub={user.roles.join(", ")}
            />
            <KpiCard
              label="Completed Lessons"
              value={user.studentProfile?.completedLessons || user.tutorProfile?.totalLessons || 0}
              sub={isStudent ? "as student" : isTutor ? "as tutor" : "platform activity"}
            />
            <KpiCard
              label="Study Hours"
              value={`${user.studentProfile?.totalHoursLearned || 0} hrs`}
              sub={`${user.studentProfile?.learningStreakDays || 0} days streak`}
            />
            <KpiCard
              label="Account Status"
              value={user.status}
              sub={`ID: ${user.id.slice(0, 8)}...`}
            />
          </div>

          {/* Tabs Navigation */}
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
              </button>
            ))}
          </div>

          {/* ══ TAB CONTENTS ═════════════════════════════════════════════════ */}

          {/* Tab 1: Identity & Profile */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <SectionCard title="Contact & Identity Details" icon={User}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Display Name</span>
                    <span className="text-slate-900 font-semibold text-sm">{user.displayName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Email Address</span>
                    <span className="text-slate-900 font-semibold text-sm">{user.email}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Country / Region</span>
                    <span className="text-slate-900 font-semibold">{user.country || "Global"}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Timezone</span>
                    <span className="text-slate-900 font-semibold">{user.timezone}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Preferred Language</span>
                    <span className="text-slate-900 font-semibold">{user.preferredLanguage || "English"}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Phone Number</span>
                    <span className="text-slate-900 font-semibold">{user.phone || "Not provided"}</span>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* Tab 2: Roles & RBAC Access */}
          {activeTab === "roles" && (
            <SectionCard
              title="Platform Roles & Permissions"
              icon={ShieldCheck}
              badge={
                !isEditingRoles ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingRoles(true)} className="text-xs">
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Roles
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingRoles(false)} className="text-xs">
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveRoles}
                      disabled={actionLoading}
                      className="text-xs bg-[#14209C] text-white"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Save Roles
                    </Button>
                  </div>
                )
              }
            >
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Select the platform roles granted to this account. Users can hold multiple roles simultaneously.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "STUDENT", title: "Student / Learner", desc: "Access to student learning dashboard, 1-on-1 bookings, and progress tracking." },
                    { id: "TUTOR", title: "Tutor / Educator", desc: "Access to educator portal, classroom schedule, earnings, and student roster." },
                    { id: "ADMIN", title: "Platform Administrator", desc: "Access to marketplace command center, application reviews, and tutor moderation." },
                    { id: "SUPER_ADMIN", title: "Super Administrator", desc: "Full unrestricted platform access, security management, and audit logs." },
                  ].map((r) => {
                    const isChecked = selectedRoles.includes(r.id);
                    return (
                      <div
                        key={r.id}
                        onClick={() => isEditingRoles && toggleRole(r.id)}
                        className={`p-4 rounded-2xl border transition-all ${
                          isEditingRoles ? "cursor-pointer" : ""
                        } ${
                          isChecked
                            ? "border-[#14209C] bg-indigo-50/50 shadow-xs"
                            : "border-slate-200 bg-white opacity-70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-slate-900">{r.title}</h4>
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                              isChecked
                                ? "bg-[#14209C] text-white"
                                : "border border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && "✓"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{r.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionCard>
          )}

          {/* Tab 3: Student Learning Profile */}
          {activeTab === "student" && (
            <div className="space-y-4">
              {!user.studentProfile ? (
                <SectionCard title="Student Learning Profile" icon={GraduationCap}>
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    This user does not have an active student profile yet.
                  </p>
                </SectionCard>
              ) : (
                <>
                  <SectionCard title="Learning Objectives & Target Exam" icon={Target}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Target Exam / Goal</span>
                        <span className="text-slate-900 font-bold text-sm mt-0.5 block">
                          {user.studentProfile.targetExam || "General Fluency"}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Level</span>
                        <span className="text-slate-900 font-bold text-sm mt-0.5 block">
                          {user.studentProfile.currentLevel || "Intermediate"}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Weekly Study Target</span>
                        <span className="text-slate-900 font-bold text-sm mt-0.5 block">
                          {user.studentProfile.weeklyStudyHoursTarget || 5} hrs / week
                        </span>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Active Learning Milestones & Goals"
                    icon={Award}
                    badge={
                      <span className="text-xs text-slate-400 font-semibold">
                        {user.studentProfile.goals?.length || 0} target goals
                      </span>
                    }
                  >
                    {!user.studentProfile.goals || user.studentProfile.goals.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">No learning goals registered.</p>
                    ) : (
                      <div className="space-y-3">
                        {user.studentProfile.goals.map((g) => (
                          <div key={g.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-slate-900">{g.title}</span>
                                {g.subjectName && (
                                  <span className="text-[10px] text-slate-400 block">{g.subjectName}</span>
                                )}
                              </div>
                              <Badge variant={g.status === "COMPLETED" ? "success" : "subtle"} size="sm">
                                {g.progressPercent}% · {g.status}
                              </Badge>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full ${g.status === "COMPLETED" ? "bg-emerald-600" : "bg-[#14209C]"}`}
                                style={{ width: `${g.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </>
              )}
            </div>
          )}

          {/* Tab 4: Tutor Profile */}
          {activeTab === "tutor" && (
            <SectionCard title="Tutor Marketplace Profile" icon={Award}>
              {!user.tutorProfile ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  This user does not have a tutor profile provisioned.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{user.tutorProfile.headline}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ${user.tutorProfile.hourlyRate}/hr · {user.tutorProfile.averageRating}★ ({user.tutorProfile.reviewCount} reviews)
                      </p>
                    </div>
                    <Link href={`/admin/tutors/${user.tutorProfile.id}`}>
                      <Button variant="default" size="sm" className="bg-[#14209C] text-white text-xs font-bold">
                        Open Tutor 360 View <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* Tab 5: Audit Trail */}
          {activeTab === "audit" && (
            <SectionCard title="Administrative Audit Trail" icon={History}>
              {!user.auditTrail || user.auditTrail.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <History className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 italic">No admin actions recorded yet for this user.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.auditTrail.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-700">{log.details}</p>
                      <p className="text-[10px] text-slate-400">By: {log.actorName} ({log.actorRole || "ADMIN"})</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

        </div>

        {/* ══ RIGHT — Sticky Action Sidebar ═══════════════════════════════════ */}
        <div className="xl:sticky xl:top-6 space-y-4">

          {/* Account Controls Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account Controls
            </h3>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Status</span>
              <Badge variant={isSuspended ? "destructive" : "success"} size="sm">
                {user.status}
              </Badge>
            </div>

            <div className="space-y-2 pt-1">
              {isSuspended ? (
                <Button
                  variant="default"
                  className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={handleReactivate}
                  disabled={actionLoading}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Reactivate Account
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={handleSuspend}
                  disabled={actionLoading}
                >
                  <Ban className="w-3.5 h-3.5 mr-1.5" />
                  Suspend Account
                </Button>
              )}
            </div>
          </div>

          {/* Metadata Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[10px] text-slate-400 space-y-1 font-mono">
            <p className="truncate">User ID: {user.id}</p>
            <p>Created: {formatDate(user.createdAt)}</p>
            <p>Updated: {formatDate(user.updatedAt)}</p>
          </div>

        </div>

      </div>
    </div>
  );
}
