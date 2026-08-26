"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  User,
  GraduationCap,
  Award,
  BookOpen,
  DollarSign,
  ShieldCheck,
  FileText,
  Star,
  Download,
  AlertTriangle,
  Ban,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useModal } from "@/components/ui/modal-context";
import { bookingService } from "@/services/bookingService";
import { Booking360Aggregate } from "@/src/modules/bookings/domain/types";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

export default function AdminBooking360Page() {
  const params = useParams();
  const router = useRouter();
  const { confirm, prompt, toast } = useModal();

  const id = params?.id as string;
  const [booking, setBooking] = React.useState<Booking360Aggregate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  const loadBooking = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingService.getBooking360(id);
      setBooking(data);
    } catch {
      toast({ title: "Error", message: "Failed to load booking details.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    const reason = await prompt({
      title: `Cancel Booking: ${booking.bookingRef}`,
      message: "State the administrative reason for cancelling this booking.",
      placeholder: "e.g. Mutual reschedule requested by student and tutor...",
      required: true,
      multiline: true,
      variant: "danger",
      confirmText: "Cancel & Void Session",
    });

    if (reason) {
      setActionLoading(true);
      const ok = await bookingService.cancelBooking(booking.id, reason);
      setActionLoading(false);
      if (ok) {
        toast({ title: "Booking Cancelled", message: "Session marked as CANCELLED.", variant: "warning" });
        loadBooking();
      }
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

  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-700">Booking Not Found</h2>
        <Button variant="outline" className="mt-4 text-xs font-semibold" onClick={() => router.push("/admin/bookings")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Bookings Ledger
        </Button>
      </div>
    );
  }

  const isCancelled = booking.status === "CANCELLED";
  const isCompleted = booking.status === "COMPLETED";

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/admin/bookings")}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#14209C] transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Bookings Ledger
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-mono font-bold text-slate-900">{booking.bookingRef}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadBooking}
          disabled={actionLoading}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">

        {/* ══ LEFT — Main Booking Details ════════════════════════════════════ */}
        <div className="space-y-6">

          {/* Hero Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-2xl font-black font-mono text-slate-900">{booking.bookingRef}</h1>
                  <Badge
                    variant={isCompleted ? "success" : isCancelled ? "destructive" : "default"}
                    size="default"
                    className="font-bold"
                  >
                    {booking.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {booking.subject?.name || "General Tutoring"} · {booking.durationMinutes} minutes session
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(booking.price, booking.currency)}
                </span>
                <Badge variant="subtle" size="sm" className="block text-[10px] text-emerald-700 font-bold mt-0.5">
                  Payment {booking.paymentStatus}
                </Badge>
              </div>
            </div>

            {/* Participants Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
              {/* Student */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <Avatar src={booking.student.avatarUrl} fallbackName={booking.student.displayName} size="md" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student</span>
                  <Link href={`/admin/users/${booking.student.id}`} className="text-xs font-bold text-slate-900 hover:text-[#14209C] truncate block">
                    {booking.student.displayName} ↗
                  </Link>
                  <span className="text-[10px] text-slate-400">{booking.student.email}</span>
                </div>
              </div>

              {/* Tutor */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <Avatar src={booking.tutor.avatarUrl} fallbackName={booking.tutor.displayName} size="md" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tutor</span>
                  <Link href={`/admin/tutors/${booking.tutor.id}`} className="text-xs font-bold text-slate-900 hover:text-[#14209C] truncate block">
                    {booking.tutor.displayName} ↗
                  </Link>
                  <span className="text-[10px] text-slate-400">${booking.tutor.hourlyRate}/hr rate</span>
                </div>
              </div>
            </div>

            {/* Cancellation Banner */}
            {isCancelled && booking.cancellationReason && (
              <div className="mt-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                <span className="font-bold block mb-0.5">Cancellation Reason:</span>
                <p className="text-rose-800">{booking.cancellationReason}</p>
              </div>
            )}
          </div>

          {/* Session Timing & Room Telemetry */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Session Schedule & Classroom Telemetry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Scheduled Date & Time</span>
                <span className="text-slate-900 font-bold text-sm block mt-0.5">
                  {formatDate(booking.startTime)} at {formatTime(booking.startTime)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">LiveKit Video Room ID</span>
                <span className="text-slate-900 font-mono font-bold text-xs block mt-1 truncate">
                  {booking.videoRoomId}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Classroom Status</span>
                <span className="text-slate-900 font-bold text-sm block mt-0.5">
                  {booking.lesson?.status || "SCHEDULED"}
                </span>
              </div>
            </div>

            {booking.studentNotes && (
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
                <span className="text-[10px] font-bold text-indigo-900 uppercase block mb-0.5">Student Goal / Pre-lesson Note:</span>
                <p className="text-indigo-800">{booking.studentNotes}</p>
              </div>
            )}
          </div>

          {/* Lesson Materials & Worksheets */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Attached Materials & Worksheets ({booking.materials?.length || 0})
              </h3>
            </div>

            {!booking.materials || booking.materials.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">No files uploaded for this session.</p>
            ) : (
              <div className="space-y-2">
                {booking.materials.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#14209C]" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{m.name}</span>
                        <span className="text-[10px] text-slate-400">Uploaded by {m.uploadedByRole}</span>
                      </div>
                    </div>
                    <a href={m.url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="text-xs">
                        <Download className="w-3.5 h-3.5 mr-1" /> View File
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Post-Lesson Review */}
          {booking.review && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Student Review & Rating
              </h3>
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 space-y-2 text-xs">
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  {[...Array(booking.review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-slate-900 ml-1.5">{booking.review.rating} / 5 Stars</span>
                </div>
                {booking.review.comment && (
                  <p className="text-slate-700 italic">"{booking.review.comment}"</p>
                )}
                <span className="text-[10px] text-slate-400 block">Submitted {formatDate(booking.review.createdAt)}</span>
              </div>
            </div>
          )}

        </div>

        {/* ══ RIGHT — Actions Sidebar ═════════════════════════════════════════ */}
        <div className="xl:sticky xl:top-6 space-y-4">

          {/* Administrative Controls */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Booking Actions
            </h3>

            <div className="space-y-2">
              <Link href={`/lessons/${booking.lesson?.id || booking.id}/classroom`}>
                <Button variant="default" className="w-full text-xs font-bold bg-[#14209C] hover:bg-[#0d1870] text-white">
                  <Video className="w-3.5 h-3.5 mr-1.5" />
                  Launch Classroom
                </Button>
              </Link>

              {!isCancelled && !isCompleted && (
                <Button
                  variant="outline"
                  className="w-full text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={handleCancelBooking}
                  disabled={actionLoading}
                >
                  <Ban className="w-3.5 h-3.5 mr-1.5" />
                  Cancel & Void Booking
                </Button>
              )}
            </div>
          </div>

          {/* Telemetry Metadata */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[10px] text-slate-400 space-y-1 font-mono">
            <p className="truncate">Booking ID: {booking.id}</p>
            <p>Created: {formatDate(booking.createdAt)}</p>
            <p>Updated: {formatDate(booking.updatedAt)}</p>
          </div>

        </div>

      </div>
    </div>
  );
}
