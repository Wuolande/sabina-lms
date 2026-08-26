"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle2, BookOpen, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { mockSubjects } from "@/lib/mock-data/subjects";

import { studentService } from "@/services/studentService";

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [selectedSubjects, setSelectedSubjects] = React.useState<string[]>(["sub-1", "sub-15"]);
  const [goalTitle, setGoalTitle] = React.useState("Score 7.5+ in IELTS Speaking & Writing");
  const [frequency, setFrequency] = React.useState("2-3 times a week");
  const [level, setLevel] = React.useState("Intermediate");
  const [loading, setLoading] = React.useState(false);

  const toggleSubject = (id: string) => {
    if (selectedSubjects.includes(id)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== id));
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await studentService.submitOnboarding({
        targetExam: goalTitle,
        currentLevel: level,
        weeklyStudyHoursTarget: frequency.includes("4+") ? 8 : frequency.includes("2-3") ? 5 : 2,
        initialGoalTitle: goalTitle,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      router.push("/student");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Step Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Student Onboarding</span>
            <span>Step {step} of 3</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-brand-700 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-card space-y-6">
          {/* Step 1: Subjects */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">
                  What do you want to learn?
                </h2>
                <p className="text-xs text-slate-500">
                  Select one or more subjects you want 1-on-1 tutoring in.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {mockSubjects.map((sub) => {
                  const isSelected = selectedSubjects.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleSubject(sub.id)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                        isSelected
                          ? "border-brand-700 bg-brand-50 text-brand-900 ring-2 ring-brand-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{sub.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  variant="default"
                  size="lg"
                  className="font-bold bg-brand-700 hover:bg-brand-800"
                  onClick={() => setStep(2)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Goals & Level */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">
                  Define your learning target
                </h2>
                <p className="text-xs text-slate-500">
                  Setting clear goals helps your tutor prepare the right materials.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Primary Learning Objective
                </label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Master IELTS Speaking or Pass AP Physics"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Current Knowledge Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Beginner (A1-A2)", "Intermediate (B1-B2)", "Advanced (C1-C2)"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        level === lvl
                          ? "border-brand-700 bg-brand-50 text-brand-900 ring-1 ring-brand-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  className="font-bold bg-brand-700 hover:bg-brand-800"
                  onClick={() => setStep(3)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Frequency & Timezone */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">
                  Preferred Lesson Frequency
                </h2>
                <p className="text-xs text-slate-500">
                  How often would you like to have 1-on-1 sessions?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { title: "Casual", desc: "1 lesson per week", val: "1 lesson/wk" },
                  { title: "Steady", desc: "2-3 lessons per week", val: "2-3 times a week" },
                  { title: "Intensive", desc: "4+ lessons per week", val: "4+ lessons/wk" },
                ].map((f) => (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setFrequency(f.val)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      frequency === f.val
                        ? "border-brand-700 bg-brand-50 text-brand-900 ring-2 ring-brand-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-sm font-bold">{f.title}</span>
                    <span className="block text-xs text-slate-500 mt-1">{f.desc}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span className="font-semibold">Detected Local Timezone:</span>
                <strong className="font-mono text-brand-700">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </strong>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  className="font-bold bg-brand-700 hover:bg-brand-800 shadow-card"
                  onClick={handleFinish}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Complete Setup & Open Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
