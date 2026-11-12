"use client";

import * as React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  Clock,
  BookOpen,
  Plus,
  CheckCircle2,
  Sparkles,
  Target,
  Flame,
  Calendar,
  Layers,
  Edit3,
  Trash2,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  MessageSquare,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { StatCard } from "@/components/ui/StatCard";
import { useModal } from "@/components/ui/modal-context";
import { studentService } from "@/services/studentService";
import { formatDate } from "@/lib/utils";

export default function StudentProgressPage() {
  const { toast } = useModal();
  const [progress, setProgress] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeGoalTab, setActiveGoalTab] = React.useState("all");

  // Create Goal Modal
  const [isAddGoalOpen, setIsAddGoalOpen] = React.useState(false);
  const [newGoalTitle, setNewGoalTitle] = React.useState("");
  const [newGoalDescription, setNewGoalDescription] = React.useState("");
  const [newGoalSubject, setNewGoalSubject] = React.useState("IELTS & TOEFL Prep");
  const [newGoalDate, setNewGoalDate] = React.useState("2026-11-30");
  const [savingGoal, setSavingGoal] = React.useState(false);

  // Target Settings Modal
  const [isTargetSettingsOpen, setIsTargetSettingsOpen] = React.useState(false);
  const [targetHours, setTargetHours] = React.useState(6);
  const [targetExam, setTargetExam] = React.useState("");
  const [targetLevel, setTargetLevel] = React.useState("Intermediate");
  const [savingTarget, setSavingTarget] = React.useState(false);

  const loadProgress = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentService.getLearningProgress();
      setProgress(data);
      if (data) {
        setTargetHours(data.weeklyStudyHoursTarget ?? 6);
        setTargetExam(data.targetExam || "");
        setTargetLevel(data.currentLevel || "Intermediate");
      }
    } catch {
      toast({ title: "Error", message: "Failed to load learning progress.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    setSavingGoal(true);
    try {
      await studentService.addLearningGoal({
        title: newGoalTitle.trim(),
        description: newGoalDescription.trim(),
        subjectName: newGoalSubject,
        targetDate: newGoalDate,
      });

      toast({
        title: "Milestone Created",
        message: "Your new target goal has been added to your roadmap.",
        variant: "success",
      });

      setIsAddGoalOpen(false);
      setNewGoalTitle("");
      setNewGoalDescription("");
      loadProgress();
    } catch {
      toast({ title: "Error", message: "Failed to create learning goal.", variant: "danger" });
    } finally {
      setSavingGoal(false);
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, newPercent: number) => {
    const clamped = Math.min(100, Math.max(0, newPercent));
    try {
      await studentService.updateGoalProgress(goalId, clamped);
      loadProgress();
      if (clamped === 100) {
        toast({
          title: "🎉 Goal Completed!",
          message: "Congratulations on achieving this learning milestone!",
          variant: "success",
        });
      }
    } catch {
      toast({ title: "Error", message: "Failed to update goal progress.", variant: "danger" });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await studentService.deleteGoal(goalId);
      toast({ title: "Goal Deleted", message: "The learning goal has been removed.", variant: "info" });
      loadProgress();
    } catch {
      toast({ title: "Error", message: "Failed to delete goal.", variant: "danger" });
    }
  };

  const handleSaveTargetSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTarget(true);
    try {
      await studentService.updateStudyTarget({
        weeklyStudyHoursTarget: Number(targetHours),
        targetExam,
        currentLevel: targetLevel,
      });

      toast({
        title: "Study Target Updated",
        message: "Your weekly study goal and target exam have been saved.",
        variant: "success",
      });

      setIsTargetSettingsOpen(false);
      loadProgress();
    } catch {
      toast({ title: "Error", message: "Failed to update study targets.", variant: "danger" });
    } finally {
      setSavingTarget(false);
    }
  };

  const goals = progress?.goals || [];
  const inProgressGoals = goals.filter((g: any) => g.status === "IN_PROGRESS" || g.progressPercent < 100);
  const completedGoals = goals.filter((g: any) => g.status === "COMPLETED" || g.progressPercent >= 100);

  const filteredGoals =
    activeGoalTab === "all"
      ? goals
      : activeGoalTab === "inprogress"
      ? inProgressGoals
      : completedGoals;

  const enrolledTutors = progress?.enrolledTutors || [];
  const weeklyTarget = progress?.weeklyStudyHoursTarget ?? 0;
  const hoursThisWeek = progress?.weeklyPaceHours ?? 0;
  const weeklyPacePercent = weeklyTarget > 0 ? Math.min(100, Math.round((hoursThisWeek / weeklyTarget) * 100)) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Learning Progress & Mastery
            </h1>
            <Badge variant="subtle" size="sm" className="bg-indigo-50 text-[#14209C] border-indigo-200 font-bold">
              {progress?.currentLevel || "Student"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your milestones, homework assignments, and scheduled curriculum study targets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTargetSettingsOpen(true)}
            className="font-bold text-xs flex items-center gap-1.5"
          >
            <Sliders className="h-4 w-4 text-slate-500" />
            <span>Target Settings</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddGoalOpen(true)}
            className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Target Milestone</span>
          </Button>
        </div>
      </div>

      {/* 2. Executive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Hours Learned"
          value={`${progress?.totalHoursLearned ?? 0} hrs`}
          icon={<Clock className="h-5 w-5 text-[#14209C]" />}
          description="Cumulative 1-on-1 time"
        />
        <StatCard
          title="Completed Lessons"
          value={progress?.completedLessons ?? 0}
          icon={<BookOpen className="h-5 w-5 text-emerald-600" />}
          description="Finished tutoring sessions"
        />
        <StatCard
          title="Active Subjects"
          value={progress?.activeSubjects ?? 0}
          icon={<Target className="h-5 w-5 text-blue-600" />}
          description="Subject specializations"
        />
        <StatCard
          title="Learning Streak"
          value={`${progress?.learningStreakDays ?? 0} Days`}
          icon={<Flame className="h-5 w-5 text-amber-500 fill-amber-500" />}
          description="Active consecutive days"
        />
      </div>

      {/* 3. Weekly Goal Target & Learning Pace Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#14209C]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Weekly Study Pace & Exam Focus
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Goal: <strong className="text-slate-900">{weeklyTarget} hours/week</strong> • Target Exam: <strong className="text-slate-900">{progress?.targetExam || "Active Target"}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm" className="bg-indigo-50 text-[#14209C] border-indigo-100 font-bold">
              Level: {progress?.currentLevel || "Intermediate"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTargetSettingsOpen(true)}
              className="text-xs font-bold text-[#14209C] hover:bg-indigo-50"
            >
              Edit Pace
            </Button>
          </div>
        </div>

        {/* Progress Bar & Pace Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">
              This Week&apos;s Progress: <strong className="text-slate-900">{hoursThisWeek} of {weeklyTarget} hours</strong>
            </span>
            <span className="text-[#14209C] font-black">{weeklyPacePercent}% achieved</span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#14209C] rounded-full transition-all duration-500"
              style={{ width: `${weeklyPacePercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            You are on track to meet your weekly study target. 1.5 hours remaining for this cycle.
          </p>
        </div>
      </div>

      {/* 4. Subject Mastery & Enrolled Tutors Matrix */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#14209C]" />
              <span>Subject Mastery & Enrolled Instructors</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative lesson breakdown and tutor guidance roadmaps.
            </p>
          </div>

          <Link href="/find-tutors">
            <Button variant="outline" size="sm" className="text-xs font-bold">
              Explore More Subjects
            </Button>
          </Link>
        </div>

        {enrolledTutors.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">No enrolled instructors yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrolledTutors.map((tut: any, idx: number) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all space-y-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={tut.tutorAvatar}
                      fallbackName={tut.tutorName}
                      size="md"
                    />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block truncate">
                        {tut.tutorName}
                      </strong>
                      <span className="text-[11px] text-slate-500 line-clamp-1 block">
                        {tut.headline || "Verified Instructor"}
                      </span>
                    </div>
                  </div>

                  <Badge variant="subtle" size="xs" className="font-bold shrink-0">
                    {tut.totalLessonsTogether} Lessons
                  </Badge>
                </div>

                {/* Tutor's Guidance Note */}
                {tut.privateTutorNotes && (
                  <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#14209C] block">
                      Instructor Guidance:
                    </span>
                    <p className="text-slate-700 italic text-[11px] leading-relaxed">
                      “{tut.privateTutorNotes}”
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {tut.totalHoursTogether} hrs studied together
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href="/student/messages">
                      <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-600 hover:text-slate-900 p-1.5 h-auto">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Button>
                    </Link>

                    <Link href="/find-tutors">
                      <Button variant="outline" size="sm" className="text-xs font-bold py-1 h-7">
                        Schedule Next
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Goals & Milestones Checklist */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              <span>Target Learning Milestones ({goals.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Track mastery progression towards your target exams and personal skills.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Tabs
              tabs={[
                { id: "all", label: "All", count: goals.length },
                { id: "inprogress", label: "In Progress", count: inProgressGoals.length },
                { id: "completed", label: "Completed", count: completedGoals.length },
              ]}
              activeTab={activeGoalTab}
              onChange={setActiveGoalTab}
              variant="pill"
            />
          </div>
        </div>

        {filteredGoals.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <p>No learning milestones in this category.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddGoalOpen(true)}
              className="text-xs font-bold"
            >
              Add a New Milestone
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGoals.map((goal: any) => {
              const isCompleted = goal.status === "COMPLETED" || goal.progressPercent >= 100;

              return (
                <div
                  key={goal.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    isCompleted
                      ? "bg-emerald-50/40 border-emerald-200"
                      : "bg-slate-50/60 border-slate-200/90 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-bold text-slate-900">
                          {goal.title}
                        </strong>
                        <Badge
                          variant={isCompleted ? "success" : "default"}
                          size="xs"
                          className="font-bold"
                        >
                          {isCompleted ? "Completed" : "In Progress"}
                        </Badge>
                        <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                          {goal.subjectName}
                        </span>
                      </div>

                      {goal.description && (
                        <p className="text-xs text-slate-600">
                          {goal.description}
                        </p>
                      )}

                      {goal.targetDate && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3" />
                          <span>Target Deadline: {formatDate(goal.targetDate)}</span>
                        </p>
                      )}
                    </div>

                    {/* Progress Percentage & Quick Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className={`text-base font-black ${isCompleted ? "text-emerald-700" : "text-[#14209C]"}`}>
                        {goal.progressPercent}%
                      </span>

                      {!isCompleted && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold px-2 py-1 h-7 border-slate-200 hover:bg-indigo-50"
                            onClick={() => handleUpdateGoalProgress(goal.id, goal.progressPercent + 10)}
                            title="Add 10% progress"
                          >
                            +10%
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold px-2 py-1 h-7 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleUpdateGoalProgress(goal.id, 100)}
                            title="Mark completed"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            <span>Done</span>
                          </Button>
                        </>
                      )}

                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isCompleted ? "bg-emerald-600" : "bg-[#14209C]"
                      }`}
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL 1: ADD LEARNING GOAL ── */}
      <Modal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        title="Set a New Learning Milestone"
        description="Clear milestones keep you motivated and allow your tutors to calibrate their lesson agenda."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Milestone Title *
            </label>
            <Input
              required
              placeholder="e.g. Master IELTS Writing Task 2 or Build 3 ML projects"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Goal Description & Context
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Target band score for Oxford Master's application..."
              value={newGoalDescription}
              onChange={(e) => setNewGoalDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject Focus
              </label>
              <select
                value={newGoalSubject}
                onChange={(e) => setNewGoalSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              >
                <option value="IELTS & TOEFL Prep">IELTS & TOEFL Prep</option>
                <option value="Python & Data Science">Python & Data Science</option>
                <option value="Calculus & Algebra">Calculus & Algebra</option>
                <option value="Spanish Language">Spanish Language</option>
                <option value="General Tutoring">General Tutoring</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Date
              </label>
              <Input
                type="date"
                value={newGoalDate}
                onChange={(e) => setNewGoalDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddGoalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={savingGoal || !newGoalTitle.trim()}
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white"
            >
              {savingGoal ? "Saving..." : "Save Milestone"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 2: STUDY TARGET SETTINGS ── */}
      <Modal
        isOpen={isTargetSettingsOpen}
        onClose={() => setIsTargetSettingsOpen(false)}
        title="Adjust Study Target & Goals"
        description="Set your weekly study hours and current target exams to personalize recommendations."
        maxWidth="md"
      >
        <form onSubmit={handleSaveTargetSettings} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Weekly Study Goal (Hours / Week)
            </label>
            <Input
              type="number"
              min={1}
              max={40}
              value={targetHours}
              onChange={(e) => setTargetHours(Number(e.target.value))}
            />
            <p className="text-[11px] text-slate-400 mt-1">Recommended: 4–8 hours for consistent mastery.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Exam / Focus
            </label>
            <Input
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              placeholder="e.g. IELTS 7.5+, SAT Math 800, Full-Stack Mastery"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Current Proficiency Level
            </label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            >
              <option value="Beginner">Beginner (Foundations)</option>
              <option value="Intermediate">Intermediate (Skill Building)</option>
              <option value="Advanced">Advanced (Exam & Masterclass)</option>
              <option value="Fluent / Expert">Fluent / Expert (Professional)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsTargetSettingsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={savingTarget}
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white"
            >
              {savingTarget ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
