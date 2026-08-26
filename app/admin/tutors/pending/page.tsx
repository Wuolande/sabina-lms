"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  FileText,
  Eye,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { useModal } from "@/components/ui/modal-context";
import { adminService } from "@/services/adminService";
import { TutorApplication } from "@/src/modules/tutor-applications/domain/types";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function AdminPendingTutorsPage() {
  const router = useRouter();
  const { confirm, prompt, toast } = useModal();
  const [applications, setApplications] = React.useState<TutorApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const fetchApplications = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getApplications({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setApplications(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", message: "Failed to load tutor applications.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, page]);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = async (app: TutorApplication) => {
    const isConfirmed = await confirm({
      title: `Approve Tutor: ${app.applicantName}?`,
      message: (
        <div className="space-y-2">
          <p>
            This will immediately provision an active instructor profile for <strong>{app.applicantName}</strong>, granting them live classroom capabilities and public marketplace discoverability.
          </p>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800">
            ✓ Role assigned: TUTOR<br />
            ✓ Initial Rate: ${app.hourlyRate}/hr<br />
            ✓ Profile published to marketplace directory
          </div>
        </div>
      ),
      confirmText: "Approve & Provision",
      variant: "success",
    });

    if (isConfirmed) {
      const success = await adminService.approveTutor(app.id);
      if (success) {
        toast({
          title: "Application Approved",
          message: `${app.applicantName} is now an active tutor on Sabina Edge.`,
          variant: "success",
        });
        fetchApplications();
      }
    }
  };

  const handleReject = async (app: TutorApplication) => {
    const reason = await prompt({
      title: `Reject Application: ${app.applicantName}`,
      message: "Provide a detailed reason for the rejection. This feedback will be recorded in the audit trail and sent to the applicant.",
      placeholder: "e.g., Unclear audio/video credentials, or degree verification failed...",
      required: true,
      multiline: true,
      variant: "danger",
      confirmText: "Reject Application",
    });

    if (reason) {
      const success = await adminService.rejectTutor(app.id, reason);
      if (success) {
        toast({
          title: "Application Rejected",
          message: `Application for ${app.applicantName} has been rejected.`,
          variant: "danger",
        });
        fetchApplications();
      }
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tutor Applications
            {total > 0 && <span className="ml-2 text-base font-semibold text-slate-400">({total})</span>}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review educator credentials, identity verification, and video introductions with multi-step review workflows.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {(["ALL", "SUBMITTED", "UNDER_REVIEW", "REQUESTED_CHANGES", "APPROVED", "REJECTED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search applicants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Application Queue Clear</h3>
            <p className="text-xs text-slate-500">
              All submitted tutor applications in this filter have been processed and reviewed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Proposed Headline</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer hover:bg-slate-50/70 transition"
                    onClick={() => router.push(`/admin/tutors/pending/${app.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={app.applicantAvatar}
                          fallbackName={app.applicantName}
                          size="md"
                        />
                        <div>
                          <strong className="text-xs font-bold text-slate-900 block">
                            {app.applicantName}
                          </strong>
                          <span className="text-[11px] text-slate-500">{app.applicantEmail}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 max-w-xs truncate">
                      {app.headline || 'Online Educator'}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-900">
                      ${app.hourlyRate}/hr
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          app.status === 'APPROVED'
                            ? 'success'
                            : app.status === 'REJECTED' || app.status === 'REQUESTED_CHANGES'
                            ? 'destructive'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {app.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(app.submittedAt || app.createdAt)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/tutors/pending/${app.id}`)}
                          className="text-xs flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Inspect 360</span>
                        </Button>
                        {app.status !== 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(app)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            title="Approve Application"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Approve</span>
                          </Button>
                        )}
                        {app.status !== 'REJECTED' && app.status !== 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(app)}
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                            title="Reject Application"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Reject</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} applications
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-semibold text-slate-700">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
