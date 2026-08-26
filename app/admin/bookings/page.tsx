"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Video,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { bookingService } from "@/services/bookingService";
import { BookingListItem } from "@/src/modules/bookings/domain/types";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = React.useState<BookingListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState("");

  const fetchBookings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingService.getAllBookings({
        status: statusFilter,
        search: search || undefined,
      });
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = bookings.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.bookingRef.toLowerCase().includes(q) ||
      b.studentName.toLowerCase().includes(q) ||
      b.tutorName.toLowerCase().includes(q) ||
      b.subjectName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Marketplace Bookings & Lessons
            {bookings.length > 0 && <span className="ml-2 text-base font-semibold text-slate-400">({bookings.length})</span>}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time ledger of scheduled 1-on-1 sessions, video room tokens, and payment settlement states.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchBookings}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {(["ALL", "CONFIRMED", "COMPLETED", "CANCELLED", "DISPUTED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === s
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {s === "ALL" ? "All Bookings" : s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search booking ref, student, tutor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No bookings match your criteria</h3>
            <p className="text-xs text-slate-400">Try adjusting your status filter or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref & Subject</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Scheduled UTC</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer hover:bg-slate-50/70 transition"
                    onClick={() => router.push(`/admin/bookings/${b.id}`)}
                  >
                    <TableCell>
                      <div>
                        <span className="font-mono text-xs font-bold text-[#14209C] block">
                          {b.bookingRef}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {b.subjectName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar src={b.studentAvatar} fallbackName={b.studentName} size="sm" />
                        <div>
                          <strong className="text-xs font-bold text-slate-900 block">{b.studentName}</strong>
                          <span className="text-[10px] text-slate-400">{b.studentEmail}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar src={b.tutorAvatar} fallbackName={b.tutorName} size="sm" />
                        <div>
                          <strong className="text-xs font-bold text-slate-900 block">{b.tutorName}</strong>
                          <span className="text-[10px] text-slate-400">Tutor</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <span className="font-semibold block">{formatDate(b.startTime)}</span>
                      <span className="text-[10px] text-slate-400">{formatTime(b.startTime)}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-medium">
                      {b.durationMinutes} mins
                    </TableCell>
                    <TableCell className="text-xs font-extrabold text-slate-900">
                      {formatCurrency(b.price, b.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          b.status === "COMPLETED"
                            ? "success"
                            : b.status === "CONFIRMED"
                            ? "default"
                            : "destructive"
                        }
                        size="sm"
                        className="text-[10px] font-bold"
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/bookings/${b.id}`)}
                        className="text-xs flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
