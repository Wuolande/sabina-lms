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
  Upload,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  Download,
  Plus,
  Save,
  Check,
  Star,
  Trash2,
  BookOpen,
  Award,
  DollarSign,
  Send,
  HelpCircle,
  GraduationCap,
  Target,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useModal } from "@/components/ui/modal-context";
import { lessonService } from "@/services/lessonService";
import { TutorLesson360 } from "@/src/modules/lessons/domain/types";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export default function TutorLessonWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { toast, confirm, prompt } = useModal();

  const id = params?.id as string;
  const [lesson, setLesson] = React.useState<TutorLesson360 | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("curriculum");

  // Form states (Tab 1)
  const [curriculumTopic, setCurriculumTopic] = React.useState("");
  const [homeworkAssigned, setHomeworkAssigned] = React.useState("");
  const [homeworkDueDate, setHomeworkDueDate] = React.useState("");
  const [privateNotes, setPrivateNotes] = React.useState("");
  const [studentFeedback, setStudentFeedback] = React.useState("");
  const [savingWorkspace, setSavingWorkspace] = React.useState(false);

  // Material Upload Modal state (Tab 2)
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [fileName, setFileName] = React.useState("");
  const [fileUrl, setFileUrl] = React.useState("");
  const [fileType, setFileType] = React.useState("Worksheet / PDF");
  const [uploadingFile, setUploadingFile] = React.useState(false);

  // Review reply state (Tab 3)
  const [tutorReplyText, setTutorReplyText] = React.useState("");
  const [submittingReply, setSubmittingReply] = React.useState(false);

  const loadLesson = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await lessonService.getTutorLesson360(id);
      setLesson(data);
      if (data) {
        setCurriculumTopic(data.curriculumTopic || "");
        setHomeworkAssigned(data.homeworkAssigned || "");
        setHomeworkDueDate(data.homeworkDueDate || "");
        setPrivateNotes(data.privateTutorNotes || "");
        setStudentFeedback(data.studentFeedback || "");
        if (data.review?.tutorReply) {
          setTutorReplyText(data.review.tutorReply);
        }
      }
    } catch {
      toast({ title: "Error", message: "Failed to load lesson workspace.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadLesson();
  }, [loadLesson]);

  // Save Workspace (Curriculum, Homework, Notes, Feedback)
  const handleSaveWorkspace = async () => {
    if (!lesson) return;
    setSavingWorkspace(true);
    const ok = await lessonService.updateLessonWorkspace(lesson.id, {
      curriculumTopic,
      homeworkAssigned,
      homeworkDueDate,
      privateTutorNotes: privateNotes,
      studentFeedback,
    });
    setSavingWorkspace(false);

    if (ok) {
      toast({
        title: "Workspace Updated",
        message: "Curriculum topic, homework, and feedback notes have been saved.",
        variant: "success",
      });
      loadLesson();
    } else {
      toast({ title: "Error", message: "Failed to save workspace.", variant: "danger" });
    }
  };

  // Complete Lesson
  const handleCompleteLesson = async () => {
    if (!lesson) return;
    const confirmed = await confirm({
      title: "Complete Teaching Session?",
      message: `Are you ready to mark lesson "${lesson.subjectName}" as COMPLETED? Completed study hours will be credited to ${lesson.student.displayName}.`,
      confirmText: "Complete & Finalize",
    });

    if (confirmed) {
      const ok = await lessonService.completeLesson(lesson.id, {
        studentFeedback: studentFeedback || "Completed scheduled teaching session.",
        privateNotes,
      });
      if (ok) {
        toast({
          title: "Session Completed",
          message: "The lesson is now marked as COMPLETED.",
          variant: "success",
        });
        loadLesson();
      }
    }
  };

  // Attach Material
  const handleAttachMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson || !fileName.trim() || !fileUrl.trim()) return;

    setUploadingFile(true);
    const ok = await lessonService.uploadMaterial(lesson.id, {
      name: `${fileName.trim()} (${fileType})`,
      url: fileUrl.trim(),
      fileType: "application/pdf",
      sizeBytes: 1048576,
    });
    setUploadingFile(false);

    if (ok) {
      toast({
        title: "Worksheet Attached",
        message: `${fileName} is now available for your student to download.`,
        variant: "success",
      });
      setIsUploadModalOpen(false);
      setFileName("");
      setFileUrl("");
      loadLesson();
    }
  };

  // Delete Material
  const handleDeleteMaterial = async (materialId: string) => {
    if (!lesson) return;
    const ok = await lessonService.deleteMaterial(lesson.id, materialId);
    if (ok) {
      toast({ title: "Material Removed", message: "File removed from lesson.", variant: "warning" });
      loadLesson();
    }
  };

  // Reply to Student Review
  const handleReplyReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson || !tutorReplyText.trim()) return;

    setSubmittingReply(true);
    const ok = await lessonService.replyToReview(lesson.id, tutorReplyText.trim());
    setSubmittingReply(false);

    if (ok) {
      toast({
        title: "Reply Published",
        message: "Your response to the student review is now visible.",
        variant: "success",
      });
      loadLesson();
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-64" />
        <div className="h-44 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-700">Lesson Workspace Not Found</h2>
        <Button variant="outline" className="mt-4 text-xs font-semibold" onClick={() => router.push("/tutor/lessons")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Lessons Hub
        </Button>
      </div>
    );
  }

  const isCompleted = lesson.status === "COMPLETED";

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/tutor/lessons")}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#14209C] transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Lessons Hub
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={loadLesson}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Hero Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-black text-slate-900">{lesson.subjectName}</h1>
              <Badge
                variant={isCompleted ? "success" : "default"}
                size="default"
                className="font-bold"
              >
                {lesson.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Ref: <span className="font-mono font-bold text-slate-700">{lesson.bookingRef}</span> · Room: <span className="font-mono text-slate-500">{lesson.videoRoomId}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isCompleted ? (
              <>
                <Link href={`/lessons/${lesson.id}/classroom`}>
                  <Button
                    variant="default"
                    className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
                  >
                    <Video className="w-4 h-4" />
                    <span>Launch Live Classroom</span>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="default"
                  onClick={handleCompleteLesson}
                  className="font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Completed</span>
                </Button>
              </>
            ) : (
              <Badge variant="success" size="default" className="font-bold text-xs py-1.5 px-3">
                ✓ Session Completed & Hours Credited
              </Badge>
            )}
          </div>
        </div>

        {/* Student strip & Schedule Telemetry */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs">
          {/* Student Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <Avatar src={lesson.student.avatarUrl} fallbackName={lesson.student.displayName} size="md" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student</span>
              <strong className="text-slate-900 block text-sm truncate">{lesson.student.displayName}</strong>
              <span className="text-[11px] text-slate-500">{lesson.student.country || "Global"} ({lesson.student.timezone})</span>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Schedule</span>
            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{formatDate(lesson.scheduledStart)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatTime(lesson.scheduledStart)} – {formatTime(lesson.scheduledEnd)}</span>
            </div>
          </div>

          {/* Financial Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lesson Value & Fee</span>
            <div className="text-slate-900 font-black text-lg">
              {formatCurrency(lesson.price, lesson.currency)}
            </div>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-block">
              Payment Settled
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "curriculum", label: "Curriculum & Notes", icon: <BookOpen className="w-4 h-4" /> },
          { id: "materials", label: `Worksheets (${lesson.materials.length})`, icon: <FileText className="w-4 h-4" /> },
          { id: "review", label: "Review & Student Rating", icon: <Star className="w-4 h-4" /> },
          { id: "history", label: "Student Learning Goals", icon: <GraduationCap className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="line"
      />

      {/* TAB 1: CURRICULUM, HOMEWORK & NOTES */}
      {activeTab === "curriculum" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lesson Curriculum & Homework Assignment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Curriculum Topic / Module Name
                </label>
                <Input
                  placeholder="e.g. IELTS Speaking Part 2 & Lexical Cohesion"
                  value={curriculumTopic}
                  onChange={(e) => setCurriculumTopic(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Homework Due Date
                </label>
                <Input
                  type="date"
                  value={homeworkDueDate}
                  onChange={(e) => setHomeworkDueDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Homework & Exercises
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Complete Cambridge IELTS Practice Test 4 Speaking Mock and review grammar worksheet..."
                value={homeworkAssigned}
                onChange={(e) => setHomeworkAssigned(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              />
            </div>
          </div>

          {/* Teaching Notes & Feedback Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Private Notes */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Private Teaching Notes
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Observations, strengths, and pacing adjustments (only visible to you).
              </p>
              <textarea
                rows={5}
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                placeholder="e.g. Student mastered connectors today. Need extra focus on prepositional phrases next week..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              />
            </div>

            {/* Public Feedback */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#14209C]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Public Student Feedback
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Praise, encouragement, and actionable takeaways (visible on student summary).
              </p>
              <textarea
                rows={5}
                value={studentFeedback}
                onChange={(e) => setStudentFeedback(e.target.value)}
                placeholder="e.g. Fantastic speaking fluency today! Be sure to review the attached PDF notes before our next class..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="default"
              disabled={savingWorkspace}
              onClick={handleSaveWorkspace}
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingWorkspace ? "Saving Workspace..." : "Save Workspace"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSHEETS & MATERIALS HUB */}
      {activeTab === "materials" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Worksheets & Homework Files ({lesson.materials.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload PDFs, cheat sheets, homework exercises, or session recordings.
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="font-bold bg-[#14209C] text-white text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach Worksheet</span>
            </Button>
          </div>

          {lesson.materials.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No materials attached yet</h4>
              <p className="text-xs text-slate-400">
                Attach lesson handouts or homework exercises for your student.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {lesson.materials.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 text-[#14209C] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">{m.name}</strong>
                      <span className="text-[10px] text-slate-400">
                        Uploaded by {m.uploadedByRole} on {formatDate(m.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a href={m.url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </Button>
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMaterial(m.id)}
                      className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDENT REVIEW & QUALITY RATING */}
      {activeTab === "review" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Student Review & Rating
          </h3>

          {!lesson.review ? (
            <div className="text-center py-12 space-y-2">
              <Star className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No review submitted yet</h4>
              <p className="text-xs text-slate-400">
                When the student leaves a 1-5 star review, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Review Card */}
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    {[...Array(lesson.review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-slate-900 ml-1.5">{lesson.review.rating} / 5 Stars</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{formatDate(lesson.review.createdAt)}</span>
                </div>

                {lesson.review.comment && (
                  <p className="text-slate-800 text-sm italic font-medium">"{lesson.review.comment}"</p>
                )}
              </div>

              {/* Tutor Reply Section */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 text-xs">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#14209C]" />
                  <h4 className="font-bold text-slate-900">Your Public Reply</h4>
                </div>

                {lesson.review.tutorReply ? (
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <p className="text-slate-800">{lesson.review.tutorReply}</p>
                    <span className="text-[10px] text-slate-400 block">
                      Replied {formatDate(lesson.review.tutorRepliedAt || new Date().toISOString())}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleReplyReview} className="space-y-3">
                    <textarea
                      rows={3}
                      value={tutorReplyText}
                      onChange={(e) => setTutorReplyText(e.target.value)}
                      placeholder="e.g. Thank you so much, Alex! It was a pleasure working through IELTS Task 2 with you..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                    />
                    <Button
                      variant="default"
                      type="submit"
                      disabled={submittingReply}
                      className="font-bold bg-[#14209C] text-white text-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingReply ? "Posting Reply..." : "Post Public Reply"}</span>
                    </Button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STUDENT LEARNING GOALS & PAST HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Enrolled Goals */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Student Enrolled Goals & Target Milestones
            </h3>

            {lesson.learningGoals.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No custom learning goals filed by student.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lesson.learningGoals.map((g) => (
                  <div key={g.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{g.subjectName}</span>
                      <Badge variant="subtle" size="sm">{g.status}</Badge>
                    </div>
                    <p className="text-slate-600">{g.targetGoal}</p>
                    {g.targetScore && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        Target Score: {g.targetScore}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past lessons with this student */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Past Lesson Records with {lesson.student.displayName} ({lesson.pastLessons.length})
            </h3>

            {lesson.pastLessons.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">This is the first lesson scheduled with this student.</p>
            ) : (
              <div className="space-y-2">
                {lesson.pastLessons.map((pl) => (
                  <div key={pl.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {pl.curriculumTopic || "1-on-1 Class"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(pl.scheduledStart)} at {formatTime(pl.scheduledStart)}
                      </span>
                    </div>
                    <Badge variant={pl.status === "COMPLETED" ? "success" : "default"} size="sm">
                      {pl.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attach Material Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Attach Lesson Material / Worksheet"
        description="Provide a document title, category, and file URL."
      >
        <form onSubmit={handleAttachMaterial} className="space-y-4 pt-2 text-slate-900">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Document Name / Title
            </label>
            <Input
              required
              placeholder="e.g. IELTS_Speaking_Band8_Notes.pdf"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Document Category
            </label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800"
            >
              <option value="Worksheet / PDF">Worksheet / PDF Handout</option>
              <option value="Homework Assignment">Homework Assignment</option>
              <option value="Exam Prep / Cheat Sheet">Exam Prep / Cheat Sheet</option>
              <option value="Audio / Video Resource">Audio / Video Resource</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Document URL (Cloudinary / CDN / Drive)
            </label>
            <Input
              type="url"
              required
              placeholder="https://res.cloudinary.com/..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={uploadingFile}
              className="font-bold bg-[#14209C] text-white"
            >
              {uploadingFile ? "Attaching..." : "Attach File"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
