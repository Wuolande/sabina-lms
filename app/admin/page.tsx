"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  UserCheck,
  ShieldAlert,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { adminService } from "@/services/adminService";
import { AdminStats, UserProfile } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminOverviewPage() {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [pendingTutors, setPendingTutors] = React.useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);

  React.useEffect(() => {
    adminService.getStats().then(setStats);
    adminService.getPendingTutors().then(setPendingTutors);
    adminService.getAuditLogs().then((res) => setAuditLogs(res.data));
  }, []);

  const handleApprove = async (id: string) => {
    await adminService.approveTutor(id);
    const updated = await adminService.getPendingTutors();
    setPendingTutors([...updated]);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Marketplace Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time operations, revenue metrics, tutor verification, and system audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/tutors/pending">
            <Button variant="default" size="sm" className="font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-card">
              Review Applications ({pendingTutors.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Bookings Volume"
          value={formatCurrency(stats?.grossRevenue ?? 0)}
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: 18, isPositive: true, label: "vs last month" }}
        />
        <StatCard
          title="Platform Net Commission (18%)"
          value={formatCurrency(stats?.platformFees ?? 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="brand"
        />
        <StatCard
          title="Active Approved Tutors"
          value={stats?.activeTutors ?? 0}
          icon={<GraduationCap className="h-5 w-5" />}
          description="Across 16+ subject categories"
        />
        <StatCard
          title="Pending Applications"
          value={pendingTutors.length}
          icon={<UserCheck className="h-5 w-5 text-amber-900" />}
          variant="accent"
          description="Needs credential verification"
        />
      </div>

      {/* Main 2-Col: Pending Applications + Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Pending Tutor Verification Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-amber-600" /> Pending Instructor Applications ({pendingTutors.length})
              </h3>
              <Link href="/admin/tutors/pending" className="text-xs font-bold text-brand-700 hover:underline">
                View all applications &rarr;
              </Link>
            </div>

            {pendingTutors.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                All tutor applications have been reviewed! 🎉
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTutors.map((tutor) => (
                    <TableRow key={tutor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={tutor.avatarUrl}
                            fallbackName={tutor.displayName}
                            size="sm"
                          />
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block">
                              {tutor.displayName}
                            </strong>
                            <span className="text-[10px] text-slate-500">{tutor.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {tutor.country}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(tutor.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 h-7 px-2.5"
                          onClick={() => handleApprove(tutor.id)}
                        >
                          Approve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Right 1 Col: Platform Audit Trail */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-700" /> Recent Audit Trail
              </h3>
              <Link href="/admin/audit-logs" className="text-xs font-bold text-brand-700 hover:underline">
                All logs
              </Link>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="subtle" size="sm" className="text-[10px]">
                      {log.action}
                    </Badge>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 mt-1">
                    {log.targetName}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
