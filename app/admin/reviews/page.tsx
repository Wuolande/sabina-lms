"use client";

import * as React from "react";
import { Star, ShieldAlert, Trash2, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { adminService } from "@/services/adminService";
import { formatDate } from "@/lib/utils";

export default function AdminReviewsPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const loadReviews = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getReviews();
      setData(res);
    } catch (err) {
      console.error('[AdminReviewsPage] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleRemove = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this student review?")) return;
    setDeletingId(id);
    try {
      await adminService.deleteReview(id);
      await loadReviews();
    } finally {
      setDeletingId(null);
    }
  };

  const summary = data?.summary || {
    totalReviews: 0,
    averageRating: 5.0,
    fiveStarReviews: 0,
    reportedCount: 0,
  };

  const reviews: any[] = data?.reviews || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Review Moderation & Feedback
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor public student feedback and enforce marketplace community guidelines.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadReviews}
          disabled={loading}
          className="text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Reviews</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Student Reviews"
          value={summary.totalReviews}
          icon={<Star className="h-5 w-5" />}
          variant="brand"
        />
        <StatCard
          title="Average Rating Across Platform"
          value={`${summary.averageRating} ★`}
          icon={<CheckCircle2 className="h-5 w-5 text-amber-500" />}
          variant="accent"
        />
        <StatCard
          title="5-Star Verified Ratings"
          value={summary.fiveStarReviews}
          icon={<Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Public Student Reviews ({reviews.length})
          </h3>
        </div>

        {reviews.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No reviews published yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review Content</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((rev) => (
                <TableRow key={rev.id}>
                  <TableCell className="text-xs font-bold text-slate-900">
                    <div>
                      <span>{rev.studentName}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">{rev.studentEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">
                    {rev.tutorName}
                  </TableCell>
                  <TableCell>
                    <Rating value={rev.rating} size="sm" showCount={false} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 max-w-md">
                    &ldquo;{rev.comment}&rdquo;
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(rev.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      title="Delete / Moderation Removal"
                      disabled={deletingId === rev.id}
                      onClick={() => handleRemove(rev.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
