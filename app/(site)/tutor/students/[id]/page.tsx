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
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  Download,
  Plus,
  Save,
  Check,
  Star,
  Users,
  Target,
  GraduationCap,
  Award,
  BookOpen,
  MapPin,
  Globe,
  Layers,
  StickyNote,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { useModal } from "@/components/ui/modal-context";
import { studentService } from "@/services/studentService";
import { TutorStudent360Aggregate } from "@/src/modules/students/domain/types";
import { formatDate, formatTime } from "@/lib/utils";

export default function TutorStudent360Page() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useModal();

  const id = params?.id as string;
  const [student, setStudent] = React.useState<TutorStudent360Aggregate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("goals");

  // Notebook and Roadmap editor states (Tab 3)
  const [privateNotes, setPrivateNotes] = React.useState("");
  const [tutorRoadmap, setTutorRoadmap] = React.useState("");
  const [targetLevel, setTargetLevel] = React.useState("");
  const [enrollmentStatus, setEnrollmentStatus] = React.useState<"ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED">("ACTIVE");
  const [savingNotes, setSavingNotes] = React.useState(false);

  const loadStudent = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentService.getTutorStudent360(id);
      setStudent(data);
      if (data) {
        setPrivateNotes(data.enrollment?.privateTutorNotes || "");
        setTutorRoadmap(data.enrollment?.tutorRoadmap || "");
        setTargetLevel(data.enrollment?.targetLevel || "");
        setEnrollmentStatus(data.enrollment?.status || "ACTIVE");
      }
    } catch {
      toast({ title: "Error", message: "Failed to load student 360 profile.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const handleSaveNotebook = async () => {
    if (!student) return;
    setSavingNotes(true);
    const ok = await studentService.saveTutorNotes(
      student.studentId,
      privateNotes,
      tutorRoadmap,
      enrollmentStatus
    );
    setSavingNotes(false);

    if (ok) {
      toast({
        title: "Student Notebook Saved",
        message: "Teaching notes, roadmap, and enrollment status have been updated.",
        variant: "success",
      });
      loadStudent();
    } else {
      toast({ title: "Error", message: "Failed to save student notebook.", variant: "danger" });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 space-y-6 animate-pulse">
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

  if (!student) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-700">Student Profile Not Found</h2>
        <Button variant="outline" className="mt-4 text-xs font-semibold" onClick={() => router.push("/tutor/students")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Students Roster
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push("/tutor/students")}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#14209C] transition font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Students Roster
      </button>

      {/* Hero Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <Avatar src={student.avatarUrl} fallbackName={student.displayName} size="xl" />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900">{student.displayName}</h1>
                <Badge
                  variant={student.enrollment.status === "ACTIVE" ? "success" : "default"}
                  size="sm"
                  className="font-bold"
                >
                  {student.enrollment.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {student.email} • Joined {formatDate(student.joinedAt)}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {student.country} ({student.timezone})
                </span>
                {student.targetExam && (
                  <Badge variant="subtle" size="sm" className="font-bold text-[10px]">
                    🎯 Target: {student.targetExam}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href={`/tutor/messages`}>
              <Button
                variant="default"
                size="default"
                className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message Student</span>
              </Button>
            </Link>

            <Link href={`/tutor/calendar`}>
              <Button
                variant="outline"
                size="default"
                className="font-bold text-xs flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-[#14209C]" />
                <span>View Schedule</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">1-on-1 Lessons</span>
            <span className="text-lg font-black text-slate-900">{student.enrollment.totalLessonsTogether} sessions</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Hours</span>
            <span className="text-lg font-black text-slate-900">{student.enrollment.totalHoursTogether} hrs</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Learning Goals</span>
            <span className="text-lg font-black text-slate-900">{student.learningGoals.length} goals</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Worksheets Shared</span>
            <span className="text-lg font-black text-slate-900">{student.materials.length} files</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "goals", label: `Goals & Milestones (${student.learningGoals.length})`, icon: <Target className="w-4 h-4" /> },
          { id: "history", label: `Lesson History (${student.lessons.length})`, icon: <BookOpen className="w-4 h-4" /> },
          { id: "notebook", label: "Private Notebook & Roadmap", icon: <StickyNote className="w-4 h-4" /> },
          { id: "materials", label: `Shared Files (${student.materials.length})`, icon: <FileText className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="line"
      />

      {/* TAB 1: GOALS & MILESTONES */}
      {activeTab === "goals" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Student Enrolled Learning Goals & Milestones
          </h3>

          {student.learningGoals.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Target className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No active goals registered</h4>
              <p className="text-xs text-slate-400">Student has not filed custom learning milestones yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.learningGoals.map((g) => (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{g.subjectName}</span>
                    <Badge variant={g.status === "COMPLETED" ? "success" : "default"} size="sm">
                      {g.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">{g.targetGoal}</p>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <span>Progress</span>
                      <span>{g.progressPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-[#14209C] transition-all"
                        style={{ width: `${g.progressPct}%` }}
                      />
                    </div>
                  </div>

                  {g.targetDate && (
                    <span className="text-[10px] text-slate-400 block pt-1">
                      📅 Target Date: {formatDate(g.targetDate)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LESSON HISTORY & ATTENDANCE */}
      {activeTab === "history" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Teaching History with {student.displayName} ({student.lessons.length})
          </h3>

          {student.lessons.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-8 text-center">No past lessons recorded.</p>
          ) : (
            <div className="space-y-3">
              {student.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-slate-900">
                        {lesson.curriculumTopic || lesson.subjectName}
                      </strong>
                      <Badge
                        variant={lesson.status === "COMPLETED" ? "success" : "default"}
                        size="sm"
                      >
                        {lesson.status}
                      </Badge>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Ref: <span className="font-mono">{lesson.bookingRef}</span> · {formatDate(lesson.scheduledStart)} at {formatTime(lesson.scheduledStart)}
                    </p>
                    {lesson.studentFeedback && (
                      <p className="text-slate-700 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100 text-[11px]">
                        Feedback: {lesson.studentFeedback}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {lesson.status === "SCHEDULED" && (
                      <Link href={`/lessons/${lesson.id}/classroom`}>
                        <Button variant="default" size="sm" className="font-bold bg-[#14209C] text-white text-xs">
                          <Video className="w-3.5 h-3.5 mr-1" /> Join Room
                        </Button>
                      </Link>
                    )}

                    <Link href={`/tutor/lessons/${lesson.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Open Workspace
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRIVATE NOTEBOOK & ROADMAP */}
      {activeTab === "notebook" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Private Student Notebook & Curriculum Roadmap
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Proficiency Level
                </label>
                <input
                  type="text"
                  placeholder="e.g. CEFR B2 -> C1 / IELTS Band 7.5"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Enrollment Lifecycle Status
                </label>
                <select
                  value={enrollmentStatus}
                  onChange={(e) => setEnrollmentStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                >
                  <option value="ACTIVE">ACTIVE (Active Learner)</option>
                  <option value="PAUSED">PAUSED (Study Break / Exams)</option>
                  <option value="COMPLETED">COMPLETED (Goal Achieved)</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>

            {/* Curriculum Roadmap */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-4 h-4 text-[#14209C]" />
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tailored Curriculum Roadmap
                </label>
              </div>
              <textarea
                rows={4}
                value={tutorRoadmap}
                onChange={(e) => setTutorRoadmap(e.target.value)}
                placeholder="e.g. Month 1: Grammar foundation & vocabulary range. Month 2: Speaking fluency & timed writing tasks..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              />
            </div>

            {/* Persistent Private Notes */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-amber-600" />
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Private Teaching Notes & Observations
                </label>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Strengths, learning pace, weak areas, and parent contact notes (only visible to you).
              </p>
              <textarea
                rows={5}
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                placeholder="e.g. Student responds very well to interactive diagramming and structured speaking drills..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="default"
                disabled={savingNotes}
                onClick={handleSaveNotebook}
                className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingNotes ? "Saving Notebook..." : "Save Student Notebook"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SHARED WORKSHEETS & FILES */}
      {activeTab === "materials" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            All Shared Files & Homework ({student.materials.length})
          </h3>

          {student.materials.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-8 text-center">No materials shared with this student yet.</p>
          ) : (
            <div className="space-y-2">
              {student.materials.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[#14209C]" />
                    <div>
                      <strong className="text-slate-900 block">{m.name}</strong>
                      <span className="text-[10px] text-slate-400">
                        Uploaded by {m.uploadedByRole} on {formatDate(m.createdAt)}
                      </span>
                    </div>
                  </div>

                  <a href={m.url} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
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
    </div>
  );
}
