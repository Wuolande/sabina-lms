"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Search,
  Ban,
  CheckCircle2,
  Eye,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BadgeCheck,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { useModal } from "@/components/ui/modal-context";
import { adminService } from "@/services/adminService";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function AdminTutorsPage() {
  const router = useRouter();
  const { confirm, prompt, toast } = useModal();
  const [tutors, setTutors] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [isFeaturedFilter, setIsFeaturedFilter] = React.useState<boolean | undefined>();
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);

  // Debounce search input
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  React.useEffect(() => { setPage(1); }, [statusFilter, debouncedSearch, isFeaturedFilter]);

  const fetchTutors = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getTutors({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: debouncedSearch || undefined,
        isFeatured: isFeaturedFilter,
        page,
        limit: PAGE_SIZE,
      });
      setTutors(res.data);
      setTotal(res.total);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", message: "Failed to load tutors.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, isFeaturedFilter, page]);

  React.useEffect(() => { fetchTutors(); }, [fetchTutors]);

  const handleSuspend = async (tutor: any) => {
    const reason = await prompt({
      title: `Suspend Tutor: ${tutor.user.displayName}`,
      message: "State the reason for suspending this tutor. Their public profile will be immediately hidden.",
      placeholder: "e.g. Policy violation regarding off-platform lesson scheduling...",
      required: true,
      multiline: true,
      variant: "danger",
      confirmText: "Suspend Account",
    });
    if (!reason) return;
    const ok = await adminService.suspendTutor(tutor.id, reason);
    if (ok) {
      toast({ title: "Tutor Suspended", message: `${tutor.user.displayName} is now suspended.`, variant: "warning" });
      fetchTutors();
    }
  };

  const handleReactivate = async (tutor: any) => {
    const ok2 = await confirm({
      title: `Reactivate Tutor: ${tutor.user.displayName}?`,
      message: "This will restore the tutor's active status and make them discoverable on the marketplace again.",
      confirmText: "Reactivate Account",
      variant: "success",
    });
    if (!ok2) return;
    const ok = await adminService.reactivateTutor(tutor.id);
    if (ok) {
      toast({ title: "Tutor Reactivated", message: `${tutor.user.displayName} restored to active.`, variant: "success" });
      fetchTutors();
    }
  };

  const handleToggleFeatured = async (tutor: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await adminService.toggleFeatured(tutor.id);
    if (updated !== null) {
      toast({
        title: updated ? "Tutor Featured" : "Featured Status Removed",
        message: `${tutor.user.displayName} is now ${updated ? "featured on the homepage" : "standard"}.`,
        variant: "success",
      });
      fetchTutors();
    }
  };

  const handleToggleSuperTutor = async (tutor: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await adminService.toggleSuperTutor(tutor.id);
    if (updated !== null) {
      toast({
        title: updated ? "Super Tutor Badge Granted" : "Super Tutor Badge Revoked",
        message: `${tutor.user.displayName} ${updated ? "now has the Super Tutor badge" : "status reverted"}.`,
        variant: "success",
      });
      fetchTutors();
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manage Tutors
            {total > 0 && <span className="ml-2 text-base font-semibold text-slate-400">({total})</span>}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directory of approved marketplace educators, performance metrics, and account controls.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === st
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Featured filter toggle */}
          <button
            onClick={() => setIsFeaturedFilter((v) => (v === undefined ? true : undefined))}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              isFeaturedFilter
                ? "bg-[#14209C] text-white border-[#14209C]"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
            title="Filter featured tutors"
          >
            <Sparkles className="w-3 h-3" /> Featured
          </button>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search tutors, subjects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : tutors.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No tutors found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Primary Subject</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Lessons</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tutors.map((tutor) => {
                  const isSuspended = tutor.accountStatus === "SUSPENDED";
                  const primarySubject =
                    tutor.subjects?.find((s: any) => s.isPrimary)?.name
                    || tutor.subjects?.[0]?.name
                    || "General";

                  return (
                    <TableRow
                      key={tutor.id}
                      className={`cursor-pointer hover:bg-slate-50/60 transition ${isSuspended ? "bg-rose-50/30" : ""}`}
                      onClick={() => router.push(`/admin/tutors/${tutor.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={tutor.user.avatarUrl}
                            fallbackName={tutor.user.displayName}
                            size="sm"
                          />
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block">
                              {tutor.user.displayName}
                            </strong>
                            <span className="text-[10px] text-slate-500">
                              {tutor.user.country || tutor.user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700">
                        {primarySubject}
                      </TableCell>
                      <TableCell className="text-xs font-extrabold text-slate-900">
                        {formatCurrency(tutor.hourlyRate, tutor.currency || "USD")}/hr
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {tutor.totalLessons} lessons
                      </TableCell>
                      <TableCell className="text-xs font-bold text-amber-600">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {Number(tutor.averageRating || 5).toFixed(1)} ({tutor.reviewCount || 0})
                        </span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleToggleFeatured(tutor, e)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition-all border ${
                              tutor.isFeatured
                                ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-xs"
                                : "bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700 hover:border-slate-300"
                            }`}
                            title="Click to toggle Featured status on Homepage"
                          >
                            <Sparkles className={`w-3 h-3 ${tutor.isFeatured ? "text-amber-500 fill-amber-400" : "text-slate-300"}`} />
                            <span>{tutor.isFeatured ? "Featured" : "Standard"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleToggleSuperTutor(tutor, e)}
                            className={`p-1 rounded-lg border transition-all ${
                              tutor.isSuperTutor
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                : "bg-slate-50 text-slate-300 border-slate-200 hover:text-slate-600 hover:border-slate-300"
                            }`}
                            title="Click to toggle Super Tutor badge"
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isSuspended ? "destructive" : "success"} size="sm">
                          {isSuspended ? "SUSPENDED" : "ACTIVE"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/tutors/${tutor.id}`)}
                            className="text-xs flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">360 View</span>
                          </Button>

                          {isSuspended ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivate(tutor)}
                              className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                              title="Reactivate Account"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Reactivate</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuspend(tutor)}
                              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                              title="Suspend Account"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Suspend</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} tutors
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
                disabled={!hasMore}
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
