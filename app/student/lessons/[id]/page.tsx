"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  FileText,
  Download,
  Star,
  CheckCircle2,
  Send,
  MessageSquare,
  Sparkles,
  Award,
  BookOpen,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Layers,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { useModal } from "@/components/ui/modal-context";
import { lessonService } from "@/services/lessonService";
import { formatDate, formatTime } from "@/lib/utils";

export default function StudentLessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useModal();

  const id = params?.id as string;
  const [lesson, setLesson] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("curriculum");

  // Homework submission state
  const [homeworkNotes, setHomeworkNotes] = React.useState("");
  const [savingHomework, setSavingHomework] = React.useState(false);

  // Review Form state
  const [rating, setRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState("");
  const [submittingReview, setSubmittingReview] = React.useState(false);

  const loadLesson = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await lessonService.getLessonById(id);
      setLesson(data);
      if (data?.studentHomeworkNotes) {
        setHomeworkNotes(data.studentHomeworkNotes);
      }
    } catch {
      toast({ title: "Error", message: "Failed to load lesson details.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadLesson();
  }, [loadLesson]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson) return;

    setSubmittingReview(true);
    const ok = await lessonService.submitReview(lesson.id, lesson.tutor.id, rating, reviewComment);
    setSubmittingReview(false);

    if (ok) {
      toast({
        title: "Review Submitted",
        message: "Thank you for rating your instructor!",
        variant: "success",
      });
      loadLesson();
    } else {
      toast({ title: "Error", message: "Failed to submit review.", variant: "danger" });
    }
  };

  const handleSaveHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkNotes.trim()) {
      toast({ title: "Empty Note", message: "Please enter your homework submission notes.", variant: "danger" });
      return;
    }

    setSavingHomework(true);
    const ok = await lessonService.submitStudentHomeworkNotes(id, homeworkNotes);
    setSavingHomework(false);

    if (ok) {
      toast({
        title: "Homework Notes Saved",
        message: "Your homework response has been shared with your tutor.",
        variant: "success",
      });
      loadLesson();
    } else {
      toast({ title: "Error", message: "Failed to save homework notes.", variant: "danger" });
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-64" />
        <div className="h-44 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-5xl mx-auto py-24 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Lesson Workspace Not Found</h2>
        <p className="text-xs text-slate-400">The requested lesson record could not be loaded.</p>
        <Button variant="outline" className="mt-2 text-xs font-semibold" onClick={() => router.push("/student/lessons")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Lessons
        </Button>
      </div>
    );
  }

  const isLiveOrScheduled = lesson.status === "SCHEDULED" || lesson.status === "CONFIRMED" || lesson.status === "IN_PROGRESS" || lesson.status === "LIVE";
  const isCompleted = lesson.status === "COMPLETED";
  const tutor = lesson.tutor || {};
  const subject = lesson.subject || {};
  const materials = lesson.materials || [];
  const review = lesson.review || null;

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push("/student/lessons")}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#14209C] transition font-bold cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Lessons
      </button>

      {/* 1. HERO LESSON HEADER */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {subject.name || "1-on-1 Tutoring Session"}
              </h1>
              <Badge
                variant={isLiveOrScheduled ? "default" : isCompleted ? "success" : "destructive"}
                size="sm"
                className="font-bold"
              >
                {lesson.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Booking Ref: <span className="font-mono font-bold text-slate-800">{lesson.bookingRef}</span> · Video Room: <span className="font-mono text-slate-600">{lesson.videoRoomId}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isLiveOrScheduled && (
              <Link href={`/lessons/${lesson.id}/classroom`}>
                <Button
                  variant="default"
                  size="default"
                  className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white flex items-center gap-1.5 shadow-md hover:scale-102 transition-transform"
                >
                  <Video className="w-4 h-4" />
                  <span>Launch Live Classroom</span>
                </Button>
              </Link>
            )}

            <Link href="/student/messages">
              <Button variant="outline" size="default" className="text-xs font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Message Tutor</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Tutor Identity & Timings Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3.5">
            <Avatar
              src={tutor.avatarUrl}
              fallbackName={tutor.displayName || "Tutor"}
              size="md"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Instructor</span>
              <div className="flex items-center gap-1.5">
                <strong className="text-slate-900 text-sm font-bold truncate">{tutor.displayName}</strong>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              </div>
              <p className="text-slate-500 text-[11px] truncate">{tutor.headline || "Verified Educator"}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Schedule</span>
            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
              <Calendar className="w-4 h-4 text-[#14209C]" />
              <span>{formatDate(lesson.scheduledStart)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatTime(lesson.scheduledStart)} – {formatTime(lesson.scheduledEnd)} ({lesson.durationMinutes || 50} mins)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. WORKSPACE TABS */}
      <Tabs
        tabs={[
          { id: "curriculum", label: "Curriculum & Homework", icon: <BookOpen className="w-4 h-4" /> },
          { id: "materials", label: `Worksheets & Files (${materials.length})`, icon: <FileText className="w-4 h-4" /> },
          { id: "review", label: "Review & Tutor Reply", icon: <Star className="w-4 h-4" /> },
          { id: "classroom", label: "Classroom Info", icon: <Video className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="line"
      />

      {/* TAB 1: CURRICULUM & HOMEWORK */}
      {activeTab === "curriculum" && (
        <div className="space-y-6">
          {/* Topic Focus */}
          {lesson.curriculumTopic && (
            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6 space-y-2">
              <div className="flex items-center gap-2 text-[#14209C]">
                <Sparkles className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#14209C]">
                  Lesson Curriculum & Topic Focus
                </h3>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {lesson.curriculumTopic}
              </p>
            </div>
          )}

          {/* Tutor Notes / Feedback */}
          {(lesson.lessonNotes || lesson.studentFeedback) && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tutor Session Notes & Guidance
              </h3>

              {lesson.lessonNotes && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <span className="font-bold text-slate-700 block">Classroom Agenda:</span>
                  <p className="text-slate-600 leading-relaxed">{lesson.lessonNotes}</p>
                </div>
              )}

              {lesson.studentFeedback && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1">
                  <span className="font-bold text-[#14209C] block">Personalized Feedback from Instructor:</span>
                  <p className="text-slate-800 leading-relaxed">{lesson.studentFeedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Assigned Homework & Submission */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Assigned Homework & Exercises</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete before your next scheduled lesson to reinforce lesson mastery.
                </p>
              </div>

              {lesson.homeworkDueDate && (
                <Badge variant="neutral" size="sm" className="bg-amber-50 text-amber-900 border-amber-200 font-bold">
                  Due: {formatDate(lesson.homeworkDueDate)}
                </Badge>
              )}
            </div>

            {lesson.homeworkAssigned ? (
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2">
                <span className="text-xs font-bold text-amber-900 block">Instructor Instructions:</span>
                <p className="text-xs text-amber-950 font-medium leading-relaxed">{lesson.homeworkAssigned}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">No homework assigned for this session.</p>
            )}

            {/* Student Homework Notes Submission */}
            <form onSubmit={handleSaveHomework} className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Your Homework Notes & Solution Links
              </label>
              <textarea
                rows={4}
                value={homeworkNotes}
                onChange={(e) => setHomeworkNotes(e.target.value)}
                placeholder="Type your essay summary, speaking task notes, or paste Google Docs / repository links for your tutor..."
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              />

              <div className="flex items-center justify-between pt-1">
                {lesson.studentHomeworkSubmittedAt ? (
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Last saved on {formatDate(lesson.studentHomeworkSubmittedAt)}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Your tutor will review these notes in your next session.
                  </span>
                )}

                <Button
                  type="submit"
                  disabled={savingHomework}
                  variant="default"
                  size="sm"
                  className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingHomework ? "Saving..." : "Save Homework Response"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSHEETS & STUDY MATERIALS */}
      {activeTab === "materials" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Lesson Worksheets & Study Materials ({materials.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Files uploaded by your tutor for preparation, classroom exercises, and homework.
            </p>
          </div>

          {materials.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No files or worksheets have been attached to this lesson yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {materials.map((m: any) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#14209C] shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <strong className="text-xs font-bold text-slate-900 block truncate">{m.name}</strong>
                      <span className="text-[10px] text-slate-400">
                        {m.sizeBytes ? `${(m.sizeBytes / 1024 / 1024).toFixed(1)} MB · ` : ""}
                        Uploaded {formatDate(m.createdAt)}
                      </span>
                    </div>
                  </div>

                  <a href={m.url} target="_blank" rel="noreferrer" download>
                    <Button variant="outline" size="sm" className="text-xs font-bold flex items-center gap-1.5 shrink-0">
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REVIEW & TUTOR RESPONSE */}
      {activeTab === "review" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Instructor Review & Star Rating
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Share your feedback to help your instructor improve and guide future students.
            </p>
          </div>

          {review ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-slate-900 ml-2">{review.rating} / 5 Stars Given</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{formatDate(review.createdAt)}</span>
                </div>

                {review.comment && (
                  <p className="text-xs text-slate-800 italic leading-relaxed">
                    “{review.comment}”
                  </p>
                )}
              </div>

              {/* Tutor's Reply Box */}
              {review.tutorReply && (
                <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2 ml-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#14209C] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Instructor's Personal Reply ({tutor.displayName}):</span>
                    </span>
                    {review.tutorRepliedAt && (
                      <span className="text-[10px] text-indigo-700">{formatDate(review.tutorRepliedAt)}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {review.tutorReply}
                  </p>
                </div>
              )}
            </div>
          ) : isCompleted ? (
            <form onSubmit={handleSubmitReview} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{rating} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Your Review / Testimonial
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was the lesson? Share your experience with explanations, clarity, and pacing..."
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                />
              </div>

              <Button
                variant="default"
                type="submit"
                disabled={submittingReview}
                className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingReview ? "Submitting..." : "Publish Review"}</span>
              </Button>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
              Reviews can be submitted once the teaching session has been completed by your instructor.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CLASSROOM & CONNECTION INFO */}
      {activeTab === "classroom" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              WebRTC LiveKit Classroom Connection
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure HD video, bidirectional screen sharing, whiteboard, and live audio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LiveKit Room ID</span>
              <strong className="text-slate-900 font-mono text-sm block">{lesson.videoRoomId}</strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled Duration</span>
              <strong className="text-slate-900 text-sm block">{lesson.durationMinutes || 50} Minutes</strong>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-bold text-xs text-slate-900 block">Classroom Ready to Join</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ensure your camera and microphone permissions are enabled in your browser before entering.
              </p>
            </div>

            <Link href={`/lessons/${lesson.id}/classroom`}>
              <Button variant="default" className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5 shrink-0">
                <Video className="w-3.5 h-3.5" />
                <span>Enter Video Classroom</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
