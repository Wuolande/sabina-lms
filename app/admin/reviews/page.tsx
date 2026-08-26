"use client";

import * as React from "react";
import { Star, ShieldAlert, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { mockReviews } from "@/lib/mock-data/reviews";
import { formatDate } from "@/lib/utils";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = React.useState(mockReviews);

  const handleRemove = (id: string) => {
    setReviews(reviews.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Review Moderation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor public student feedback and enforce marketplace community guidelines.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Tutor ID</TableHead>
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
                  {rev.student.displayName}
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-mono">
                  {rev.tutorId}
                </TableCell>
                <TableCell>
                  <Rating value={rev.rating} size="sm" showCount={false} />
                </TableCell>
                <TableCell className="text-xs text-slate-700 max-w-md truncate">
                  &quot;{rev.reviewText}&quot;
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {formatDate(rev.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    title="Delete / Moderation Removal"
                    onClick={() => handleRemove(rev.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
