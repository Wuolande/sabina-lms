"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  BookOpen,
  Clock,
  StickyNote,
  Check,
  Edit2,
  Users,
  Eye,
  GraduationCap,
  Sparkles,
  Award,
  RefreshCw,
  Hourglass,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { StatCard } from "@/components/ui/StatCard";
import { studentService } from "@/services/studentService";
import { formatDate } from "@/lib/utils";

export default function TutorStudentsPage() {
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("ALL");

  // Notes Modal state
  const [selectedStudent, setSelectedStudent] = React.useState<any | null>(null);
  const [notesText, setNotesText] = React.useState("");
  const [savingNotes, setSavingNotes] = React.useState(false);

  const fetchStudents = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentService.getTutorStudents();
      setStudents(data);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenNotes = (stu: any) => {
    setSelectedStudent(stu);
    setNotesText(stu.privateTutorNotes || "");
  };

  const handleSaveNotes = async () => {
    if (!selectedStudent) return;
    setSavingNotes(true);
    await studentService.saveTutorNotes(selectedStudent.studentId, notesText);
    setSavingNotes(false);
    setSelectedStudent(null);
    fetchStudents();
  };

  const totalHoursTaught = students.reduce((acc, s) => acc + (s.totalHoursTogether || 0), 0);
  const totalLessonsTaught = students.reduce((acc, s) => acc + (s.totalLessonsTogether || 0), 0);

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.displayName.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.country && s.country.toLowerCase().includes(q)) ||
      (s.targetExam && s.targetExam.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Enrolled Students Roster
            {students.length > 0 && <span className="ml-2 text-base font-semibold text-slate-400">({students.length})</span>}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Active learners enrolled in your 1-on-1 sessions, study roadmaps, and progress milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudents}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Link href="/tutor/calendar">
            <Button
              variant="default"
              size="sm"
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Calendar</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Learners"
          value={students.length}
          icon={<Users className="h-5 w-5 text-indigo-600" />}
          description="Total active students"
        />
        <StatCard
          title="Teaching Sessions"
          value={totalLessonsTaught}
          icon={<BookOpen className="h-5 w-5 text-emerald-600" />}
          description="1-on-1 lessons delivered"
        />
        <StatCard
          title="Total Hours Taught"
          value={`${Math.round(totalHoursTaught * 10) / 10}h`}
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          description="Accumulated contact time"
        />
        <StatCard
          title="Super Tutor Standing"
          value="100%"
          icon={<Award className="h-5 w-5 text-purple-600" />}
          description="Active verified badge"
        />
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <Tabs
          tabs={[
            { id: "ALL", label: "All Students", count: students.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="line"
        />

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search student, exam, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No students enrolled yet</h3>
          <p className="text-xs text-slate-400">Students who book 1-on-1 sessions with you will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((stu) => (
            <div
              key={stu.studentId}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start gap-4">
                  <Avatar
                    src={stu.avatarUrl}
                    fallbackName={stu.displayName}
                    size="lg"
                  />
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {stu.displayName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {stu.country} • {stu.timezone}
                    </p>
                    {stu.targetExam && (
                      <Badge variant="subtle" size="sm" className="text-[10px] truncate max-w-[180px]">
                        🎯 {stu.targetExam}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Lesson metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Lessons</span>
                    <span className="text-sm font-black text-slate-900">{stu.totalLessonsTogether} sessions</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Hours Completed</span>
                    <span className="text-sm font-black text-slate-900">{stu.totalHoursTogether} hrs</span>
                  </div>
                </div>

                {/* Private Notes preview */}
                {stu.privateTutorNotes && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-xs">
                    <span className="text-[10px] font-bold text-amber-900 uppercase block mb-0.5">Teaching Notes:</span>
                    <p className="text-amber-800 text-[11px] leading-snug line-clamp-2">{stu.privateTutorNotes}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <Link href={`/tutor/students/${stu.studentId}`}>
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs font-bold bg-[#14209C] hover:bg-[#0d1870] text-white flex items-center gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>360 Profile</span>
                  </Button>
                </Link>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenNotes(stu)}
                    className="text-xs text-slate-700 flex items-center gap-1"
                  >
                    <StickyNote className="h-3.5 w-3.5 text-amber-600" />
                    <span>Notes</span>
                  </Button>

                  <Link href={`/tutor/messages`}>
                    <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Private Notes Modal */}
      {selectedStudent && (
        <Modal
          isOpen={Boolean(selectedStudent)}
          onClose={() => setSelectedStudent(null)}
          title={`Teaching Notes: ${selectedStudent.displayName}`}
          description="Private observations, learning pace, and target milestone notes (visible only to you)."
        >
          <div className="space-y-4 pt-2">
            <textarea
              rows={5}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="e.g. Student excels in conceptual understanding but needs more practice on timed problem-solving..."
              className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                Cancel
              </Button>
              <Button
                variant="default"
                disabled={savingNotes}
                onClick={handleSaveNotes}
                className="font-bold bg-[#14209C] text-white"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
