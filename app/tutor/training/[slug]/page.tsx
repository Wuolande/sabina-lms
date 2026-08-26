"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Play,
  FileText,
  HelpCircle,
  Award,
  Clock,
  Download,
  ExternalLink,
  ChevronRight,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { trainingService } from "@/services/trainingService";
import { TrainingCourse, TrainingModule } from "@/src/modules/training/types/trainingTypes";

export default function CourseLearningPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [course, setCourse] = React.useState<TrainingCourse | null>(null);
  const [activeModuleId, setActiveModuleId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [isMarkingComplete, setIsMarkingComplete] = React.useState(false);

  React.useEffect(() => {
    if (slug) {
      trainingService.getCourseBySlug(slug)
        .then((data) => {
          setCourse(data);
          if (data && data.modules && data.modules.length > 0) {
            const firstIncomplete = data.modules.find((m) => !m.isCompleted) || data.modules[0];
            setActiveModuleId(firstIncomplete.id);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-slate-100 rounded-3xl" />
          <div className="lg:col-span-1 h-96 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Course Not Found</h2>
        <p className="text-xs text-slate-500">The training track you requested does not exist.</p>
        <Link href="/tutor/training">
          <Button variant="default" size="default">Back to Academy</Button>
        </Link>
      </div>
    );
  }

  const modules = course.modules || [];
  const currentModule = modules.find((m) => m.id === activeModuleId) || modules[0];
  const currentModuleIndex = modules.findIndex((m) => m.id === currentModule?.id);
  const isLastModule = currentModuleIndex === modules.length - 1;
  const allModulesCompleted = modules.every((m) => m.isCompleted);

  const handleMarkComplete = async () => {
    if (!currentModule) return;
    setIsMarkingComplete(true);
    try {
      await trainingService.completeModule(currentModule.id, course.id);
      
      // Update local state
      setCourse((prev) => {
        if (!prev) return null;
        const updatedMods = (prev.modules || []).map((m) =>
          m.id === currentModule.id ? { ...m, isCompleted: true } : m
        );
        return { ...prev, modules: updatedMods };
      });

      // Advance to next module or quiz
      if (!isLastModule && modules[currentModuleIndex + 1]) {
        setActiveModuleId(modules[currentModuleIndex + 1].id);
      } else if (course.quiz) {
        router.push(`/tutor/training/${course.slug}/quiz`);
      }
    } finally {
      setIsMarkingComplete(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Top Bar Breadcrumb ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/tutor/training"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tutor Academy
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
            {course.category}
          </span>
          {course.isMandatory && (
            <Badge variant="destructive" size="sm">Mandatory</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ═══════════════════════════════════════════════════════════
            LEFT 2 COLS: Active Lesson Player / Content Surface
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Lesson Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-card">
            {/* Player / Content header */}
            <div className="p-6 sm:p-7 border-b border-slate-100 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Lesson {currentModuleIndex + 1} of {modules.length}
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {currentModule?.durationMinutes} mins
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                {currentModule?.title}
              </h1>
              {currentModule?.description && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentModule.description}
                </p>
              )}
            </div>

            {/* Content Body: Video or Markdown Reading */}
            <div className="p-6 sm:p-8">
              {currentModule?.moduleType === "video" && (
                <div className="space-y-6">
                  <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden shadow-inner border border-slate-200">
                    <video
                      src={currentModule.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-online-learning-concept-42526-large.mp4"}
                      controls
                      autoPlay={false}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    Tip: Take notes on key terminology and protocols. You will be tested on these concepts in the certification exam.
                  </p>
                </div>
              )}

              {currentModule?.moduleType === "reading" && (
                <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-4">
                  {currentModule.readingContent ? (
                    <div className="whitespace-pre-line text-slate-700 font-sans">
                      {currentModule.readingContent}
                    </div>
                  ) : (
                    <p className="text-slate-600">
                      Please review the pedagogical guidelines and standards carefully before taking the certification assessment.
                    </p>
                  )}
                </div>
              )}

              {/* Downloadable Resources */}
              {currentModule?.resources && currentModule.resources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Lesson Attachments & Downloads
                  </h4>
                  <div className="space-y-2">
                    {currentModule.resources.map((res, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-colors text-xs font-bold text-slate-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-4 w-4 text-brand-700" />
                          <span>{res.title}</span>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bottom Bar */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {currentModule?.isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="h-4 w-4" /> Marked as completed
                  </span>
                ) : (
                  <span>Complete this lesson to advance your certification progress.</span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  variant="default"
                  size="default"
                  className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs cursor-pointer"
                  onClick={handleMarkComplete}
                  isLoading={isMarkingComplete}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {isLastModule
                    ? "Complete & Take Certification Exam"
                    : "Mark Complete & Next Lesson"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT 1 COL: Course Syllabus & Quiz Launch Card
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-1 space-y-6">
          {/* Syllabus Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-elevation space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                Course Syllabus ({modules.length} Lessons)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete all modules to unlock the certification exam
              </p>
            </div>

            {/* Modules List */}
            <div className="space-y-2">
              {modules.map((m, idx) => {
                const isActive = m.id === currentModule?.id;
                const isDone = m.isCompleted;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveModuleId(m.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isActive
                        ? "border-slate-950 bg-slate-950 text-white shadow-xs"
                        : isDone
                        ? "border-slate-200 bg-emerald-50/40 text-slate-800 hover:bg-emerald-50"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-emerald-600"}`} />
                      ) : m.moduleType === "video" ? (
                        <Play className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                      ) : (
                        <FileText className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold leading-snug truncate ${isActive ? "text-white" : "text-slate-900"}`}>
                        {idx + 1}. {m.title.replace(/^\d+\.\s*/, "")}
                      </p>
                      <span className={`text-[11px] block mt-0.5 ${isActive ? "text-slate-400" : "text-slate-500"}`}>
                        {m.durationMinutes} mins • {m.moduleType === "video" ? "Video Lesson" : "Reading Guide"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Certification Exam Card */}
            {course.quiz && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 border border-amber-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-600 shrink-0" />
                    <strong className="text-xs font-bold text-amber-950">
                      Final Certification Exam
                    </strong>
                  </div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    Passing score: <strong>{course.quiz.passingScore}%</strong>. Earns the official <strong>{course.badgeTitle}</strong> credential.
                  </p>

                  <Link href={`/tutor/training/${course.slug}/quiz`} className="block pt-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl cursor-pointer"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      {course.status === "completed" ? "Retake Exam" : "Take Exam Now"}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
