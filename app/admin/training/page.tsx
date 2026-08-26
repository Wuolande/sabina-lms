"use client";

import * as React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Radio,
  Calendar,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { TrainingCourse, LiveTrainingSession } from "@/src/modules/training/types/trainingTypes";
import { mockTrainingCourses, mockLiveTrainingSessions } from "@/lib/mock-data/training";
import { trainingService } from "@/services/trainingService";
import { formatDate } from "@/lib/utils";

export default function AdminTrainingDashboard() {
  const [courses, setCourses] = React.useState<TrainingCourse[]>(mockTrainingCourses);
  const [liveSessions, setLiveSessions] = React.useState<LiveTrainingSession[]>(mockLiveTrainingSessions);
  const [activeTab, setActiveTab] = React.useState<"live" | "courses" | "compliance">("live");
  const [stats, setStats] = React.useState({
    totalCourses: 5,
    totalCertificatesIssued: 18,
    totalEnrollments: 42,
    averageCompletionRate: 85,
  });
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modal State for Scheduling Live Session
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isSubmittingSession, setIsSubmittingSession] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newHeadline, setNewHeadline] = React.useState("");
  const [newTrainerName, setNewTrainerName] = React.useState("Dr. Marcus Vance");
  const [newTrainerRole, setNewTrainerRole] = React.useState("Lead Educational Technologist");
  const [newCategory, setNewCategory] = React.useState<any>("Classroom Tools");
  const [newDate, setNewDate] = React.useState("");
  const [newDuration, setNewDuration] = React.useState("60");
  const [newCapacity, setNewCapacity] = React.useState("100");
  const [newIsMandatory, setNewIsMandatory] = React.useState(false);

  // Selected Session Roster Modal
  const [selectedSessionForRoster, setSelectedSessionForRoster] = React.useState<LiveTrainingSession | null>(null);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/admin/training").then((r) => r.json()).catch(() => ({})),
      trainingService.getLiveSessions()
    ])
      .then(([adminData, liveData]) => {
        if (adminData.courses) setCourses(adminData.courses);
        if (adminData.stats) setStats(adminData.stats);
        if (liveData) setLiveSessions(liveData);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateLiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmittingSession(true);
    try {
      const created = await trainingService.createLiveSession({
        title: newTitle,
        headline: newHeadline || newTitle,
        trainerName: newTrainerName,
        trainerRole: newTrainerRole,
        category: newCategory,
        scheduledAt: newDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        durationMinutes: Number(newDuration) || 60,
        maxAttendees: Number(newCapacity) || 100,
        isMandatory: newIsMandatory,
        badgeTitle: `${newTitle} Attendance`
      });

      setLiveSessions((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      // Reset
      setNewTitle("");
      setNewHeadline("");
    } finally {
      setIsSubmittingSession(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── 1. Top Header & Action ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            Tutor Academy & Cohort Training Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Schedule live multi-tutor cohort classrooms, manage certifications, and enforce mandatory safeguarding compliance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="default"
            onClick={() => setIsCreateModalOpen(true)}
            className="font-bold text-xs bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs cursor-pointer"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Schedule Live Masterclass
          </Button>

          <Link href="/tutor/training" target="_blank">
            <Button variant="outline" size="default" className="font-bold text-xs" leftIcon={<ExternalLink className="h-4 w-4" />}>
              Preview Tutor View
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 2. Stat Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Cohorts Scheduled</span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Radio className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950 font-heading">{liveSessions.length}</div>
          <span className="text-[11px] text-slate-400 block font-medium">Multi-tutor live classrooms</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tutors Certified</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-heading">{stats.totalCertificatesIssued}</div>
          <span className="text-[11px] text-slate-400 block font-medium">Official badges active</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Learners</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950 font-heading">{stats.totalEnrollments}</div>
          <span className="text-[11px] text-slate-400 block font-medium">Tutors enrolled in academy</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Safeguarding Compliance</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-heading">96.4%</div>
          <span className="text-[11px] text-slate-400 block font-medium">Mandatory clearance rate</span>
        </div>
      </div>

      {/* ── 3. Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("live")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "live" ? "bg-slate-950 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
          <span>Live Cohort Sessions ({liveSessions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("courses")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "courses" ? "bg-slate-950 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Self-Paced Courses ({courses.length})</span>
        </button>
      </div>

      {/* ── Tab 1: Live Sessions Management Table ── */}
      {activeTab === "live" && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-base font-extrabold text-slate-900 font-heading">
              Scheduled Live Multi-Tutor Masterclasses
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {liveSessions.length} active cohorts
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {liveSessions.map((s) => (
              <div
                key={s.id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                    <Video className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                        {s.title}
                      </h4>
                      <Badge variant="subtle" size="sm" className="bg-slate-100 text-slate-700">
                        {s.category}
                      </Badge>
                      {s.isMandatory && (
                        <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      Lead Trainer: <strong>{s.trainerName}</strong> ({s.trainerRole})
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span>{formatDate(s.scheduledAt)}</span>
                      <span>•</span>
                      <span>{s.durationMinutes} mins</span>
                      <span>•</span>
                      <span className="font-bold text-[#14209C] flex items-center gap-1">
                        <Users className="h-3 w-3" /> {s.currentAttendees} / {s.maxAttendees} Tutors Enrolled
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold"
                    onClick={() => setSelectedSessionForRoster(s)}
                  >
                    View Roster ({s.currentAttendees})
                  </Button>

                  <Link href={`/tutor/training/live/${s.id}`} target="_blank">
                    <Button variant="default" size="sm" className="text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white" rightIcon={<Radio className="h-3.5 w-3.5 text-rose-400 animate-pulse" />}>
                      Host Live Room
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 2: Self-Paced Courses Management ── */}
      {activeTab === "courses" && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 font-heading">
              Self-Paced Courses & Syllabi
            </h3>
            <span className="text-xs font-bold text-slate-500">{courses.length} courses</span>
          </div>

          <div className="divide-y divide-slate-100">
            {courses.map((course, idx) => (
              <div
                key={course.id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs shrink-0">
                    {idx + 1}
                  </span>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                        {course.title}
                      </h4>
                      <Badge variant="subtle" size="sm" className="bg-slate-100 text-slate-700">
                        {course.category}
                      </Badge>
                      {course.isMandatory && (
                        <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{course.headline}</p>
                  </div>
                </div>

                <Link href={`/tutor/training/${course.slug}`} target="_blank">
                  <Button variant="outline" size="sm" className="text-xs font-bold">
                    View Course
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal: Schedule Live Cohort Masterclass ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-heading">
                  Schedule Live Multi-Tutor Masterclass
                </h3>
                <p className="text-xs text-slate-500">
                  Create a live WebRTC workshop cohort for dozens of tutors to attend together
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLiveSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Masterclass Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Live Practice Lab: Active Learning & Socratic Dialogue"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description / Agenda</label>
                <Input
                  value={newHeadline}
                  onChange={(e) => setNewHeadline(e.target.value)}
                  placeholder="e.g. Interactive peer breakout simulations with real-time feedback"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Master Trainer</label>
                  <Input
                    value={newTrainerName}
                    onChange={(e) => setNewTrainerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                  >
                    <option value="Classroom Tools">Classroom Tools</option>
                    <option value="Pedagogy">Pedagogy</option>
                    <option value="Safeguarding">Safeguarding</option>
                    <option value="Exam Coaching">Exam Coaching</option>
                    <option value="Business & Growth">Business & Growth</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <Input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    min={15}
                    max={180}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Tutor Capacity</label>
                  <Input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    min={10}
                    max={500}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mandatoryCheck"
                  checked={newIsMandatory}
                  onChange={(e) => setNewIsMandatory(e.target.checked)}
                  className="rounded border-slate-300 text-[#14209C]"
                />
                <label htmlFor="mandatoryCheck" className="text-xs font-bold text-slate-800">
                  Mark as Mandatory Compliance Training for all Tutors
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  isLoading={isSubmittingSession}
                  className="bg-slate-950 hover:bg-slate-800 text-white font-bold"
                >
                  Publish & Open Cohort
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Cohort Enrolled Tutors Roster ── */}
      {selectedSessionForRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 font-heading">
                  Cohort Roster ({selectedSessionForRoster.currentAttendees} Tutors)
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-sm">
                  {selectedSessionForRoster.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSessionForRoster(null)}
                className="p-1 text-slate-400 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-100 text-xs">
              {(selectedSessionForRoster.registeredAttendees || []).map((att) => (
                <div key={att.id} className="pt-2 first:pt-0 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={att.tutorAvatar} fallbackName={att.tutorName} size="sm" />
                    <div>
                      <strong className="block font-bold text-slate-900">{att.tutorName}</strong>
                      <span className="text-[10px] text-slate-400">RSVP on {formatDate(att.registeredAt)}</span>
                    </div>
                  </div>
                  <Badge variant={att.attended ? "success" : "subtle"} size="sm">
                    {att.attended ? "Attended" : "Enrolled"}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSessionForRoster(null)}
              >
                Close Roster
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
