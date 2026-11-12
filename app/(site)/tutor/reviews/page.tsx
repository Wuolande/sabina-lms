"use client";

import * as React from "react";
import {
  Star,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Award,
  Clock,
  Send,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Rating } from "@/components/ui/Rating";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useModal } from "@/components/ui/modal-context";
import { lessonService } from "@/services/lessonService";
import { formatDate } from "@/lib/utils";

interface ReviewItem {
  id: string;
  lessonId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  studentEmail?: string;
  subjectName: string;
  lessonDate: string;
  rating: number;
  comment: string;
  tutorReply?: string;
  tutorRepliedAt?: string;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  repliedCount: number;
  unrepliedCount: number;
  fiveStarPercent: number;
  responseRatePercent: number;
}

const TEMPLATE_REPLIES = [
  "Thank you for the wonderful feedback! It was an absolute pleasure working with you on this topic. Keep up the fantastic effort!",
  "Great job in our session! Your dedication and focus are really paying off. Looking forward to our next class!",
  "Thank you so much! Practice the vocabulary we covered and feel free to reach out if you have any questions before next week.",
];

export default function TutorReviewsPage() {
  const { toast } = useModal();
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [stats, setStats] = React.useState<ReviewStats>({
    averageRating: 5.0,
    totalReviews: 0,
    fiveStarCount: 0,
    fourStarCount: 0,
    threeStarCount: 0,
    twoStarCount: 0,
    oneStarCount: 0,
    repliedCount: 0,
    unrepliedCount: 0,
    fiveStarPercent: 100,
    responseRatePercent: 0,
  });

  const [loading, setLoading] = React.useState(true);
  const [filterTab, setFilterTab] = React.useState<"ALL" | "UNREPLIED" | "5STAR" | "4STAR_BELOW">("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Reply Modal State
  const [replyReview, setReplyReview] = React.useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [submittingReply, setSubmittingReply] = React.useState(false);

  const fetchReviewsData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await lessonService.getTutorReviews360();
      if (data) {
        setStats(data.stats || stats);
        setReviews(data.reviews || []);
      }
    } catch {
      toast({ title: "Error", message: "Failed to load student reviews.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchReviewsData();
  }, [fetchReviewsData]);

  const handleOpenReplyModal = (rev: ReviewItem) => {
    setReplyReview(rev);
    setReplyText(rev.tutorReply || "");
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyReview || !replyText.trim()) return;

    setSubmittingReply(true);
    const ok = await lessonService.replyToTutorReview(replyReview.id, replyText);
    setSubmittingReply(false);

    if (ok) {
      toast({
        title: "Reply Published",
        message: "Your response is now public and the student has been notified.",
        variant: "success",
      });
      setReplyReview(null);
      setReplyText("");
      fetchReviewsData();
    } else {
      toast({ title: "Error", message: "Failed to publish reply.", variant: "danger" });
    }
  };

  // Filter and search computation
  const filteredReviews = React.useMemo(() => {
    return reviews.filter((r) => {
      // Tab filter
      if (filterTab === "UNREPLIED" && r.tutorReply && r.tutorReply.trim() !== "") return false;
      if (filterTab === "5STAR" && r.rating !== 5) return false;
      if (filterTab === "4STAR_BELOW" && r.rating > 4) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.studentName.toLowerCase().includes(q);
        const matchesSubject = r.subjectName.toLowerCase().includes(q);
        const matchesComment = r.comment.toLowerCase().includes(q);
        return matchesName || matchesSubject || matchesComment;
      }
      return true;
    });
  }, [reviews, filterTab, searchQuery]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Student Reviews & Reputation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Student feedback, 5-star ratings, and public replies from verified 1-on-1 lessons.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReviewsData}
          className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Hero KPI Strip & Star Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: KPI Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Average Rating */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Average Rating
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-amber-500 font-bold">★ / 5.0</span>
            </div>
            <div className="pt-1">
              <Rating value={Math.round(stats.averageRating)} size="sm" showCount={false} />
            </div>
          </div>

          {/* Total Reviews */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Verified Reviews
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                {stats.totalReviews}
              </span>
              <span className="text-xs text-slate-400">Total</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">100% verified lessons</p>
          </div>

          {/* 5-Star Share */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              5-Star Share
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-heading">
                {stats.fiveStarPercent}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">{stats.fiveStarCount} top ratings</p>
          </div>

          {/* Reply Rate */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tutor Reply Rate
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#14209C] font-heading">
                {stats.responseRatePercent}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {stats.unrepliedCount > 0 ? (
                <span className="text-amber-600 font-bold">{stats.unrepliedCount} pending reply</span>
              ) : (
                <span className="text-emerald-600">All answered</span>
              )}
            </p>
          </div>
        </div>

        {/* Right 1 Col: Rating Distribution Progress Bars */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Rating Breakdown
          </h3>

          <div className="space-y-2 text-xs">
            {[
              { stars: 5, count: stats.fiveStarCount },
              { stars: 4, count: stats.fourStarCount },
              { stars: 3, count: stats.threeStarCount },
              { stars: 2, count: stats.twoStarCount },
              { stars: 1, count: stats.oneStarCount },
            ].map(({ stars: starNum, count }) => {
              const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
              return (
                <div key={starNum} className="flex items-center gap-2">
                  <span className="w-6 text-slate-600 font-bold font-mono text-[11px] text-right">
                    {starNum}★
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        starNum >= 4 ? "bg-amber-400" : "bg-slate-300"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-[11px] text-slate-400 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filterTab === "ALL"
                ? "bg-[#14209C] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All Reviews ({reviews.length})
          </button>

          <button
            onClick={() => setFilterTab("UNREPLIED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterTab === "UNREPLIED"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>Needs Reply</span>
            {stats.unrepliedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                filterTab === "UNREPLIED" ? "bg-white text-amber-700" : "bg-amber-100 text-amber-800"
              }`}>
                {stats.unrepliedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterTab("5STAR")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filterTab === "5STAR"
                ? "bg-[#14209C] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            5 Stars ({stats.fiveStarCount})
          </button>

          <button
            onClick={() => setFilterTab("4STAR_BELOW")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filterTab === "4STAR_BELOW"
                ? "bg-[#14209C] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            4 Stars & Below ({stats.fourStarCount + stats.threeStarCount + stats.twoStarCount + stats.oneStarCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student or keyword..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#14209C]"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 divide-y divide-slate-100">
        {loading ? (
          <div className="space-y-4 py-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Star className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No matching reviews</h4>
            <p className="text-xs text-slate-400">
              {searchQuery ? "Try searching for a different keyword or student name." : "No reviews found in this filter."}
            </p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div key={rev.id} className="pt-6 first:pt-0 space-y-3.5">
              {/* Top Row: Student Avatar, Name, Subject, Rating */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={rev.studentAvatar}
                    fallbackName={rev.studentName}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{rev.studentName}</h4>
                      <Badge
                        variant="neutral"
                        size="xs"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-semibold"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        Verified Student
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {rev.subjectName} · Lesson completed on {formatDate(rev.lessonDate || rev.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Rating value={rev.rating} size="sm" showCount={false} />
                  <span className="text-xs font-bold text-amber-500 font-mono">
                    {rev.rating}.0
                  </span>
                </div>
              </div>

              {/* Student Comment */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs sm:text-sm text-slate-800 leading-relaxed italic">
                “{rev.comment}”
              </div>

              {/* Tutor Response Box or Reply Button */}
              {rev.tutorReply ? (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border-l-4 border-[#14209C] text-xs space-y-1.5 ml-4 sm:ml-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <MessageSquare className="w-3.5 h-3.5 text-[#14209C]" />
                      <span>Your Response:</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {rev.tutorRepliedAt ? formatDate(rev.tutorRepliedAt) : "Recently"}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{rev.tutorReply}</p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenReplyModal(rev)}
                      className="text-[11px] font-bold text-[#14209C] hover:underline"
                    >
                      Edit Response
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Awaiting your reply</span>
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenReplyModal(rev)}
                    className="text-xs font-bold text-[#14209C] border-indigo-200 hover:bg-indigo-50 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reply to Student</span>
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      <Modal
        isOpen={!!replyReview}
        onClose={() => setReplyReview(null)}
        title="Reply to Student Review"
        description={`Respond to ${replyReview?.studentName}'s review for ${replyReview?.subjectName}.`}
      >
        <form onSubmit={handleReplySubmit} className="space-y-4 pt-2 text-slate-900">
          {/* Original review preview */}
          {replyReview && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
              “{replyReview.comment}”
            </div>
          )}

          {/* Quick template suggestions */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick Suggestions:
            </span>
            <div className="space-y-1">
              {TEMPLATE_REPLIES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReplyText(tmpl)}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-600 transition border border-slate-100"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Your Response Message
            </label>
            <Textarea
              required
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Thank the student for their dedication and highlight their progress..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setReplyReview(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={submittingReply || !replyText.trim()}
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingReply ? "Publishing..." : "Publish Response"}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
