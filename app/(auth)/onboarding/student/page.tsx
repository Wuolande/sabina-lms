"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, BookOpen, Clock, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { tutorService } from "@/services/tutorService";
import { studentService } from "@/services/studentService";
import { Subject } from "@/types";

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [subjectsList, setSubjectsList] = React.useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = React.useState<string[]>([]);
  const [goalTitle, setGoalTitle] = React.useState("Master key concepts & pass exams");
  const [frequency, setFrequency] = React.useState("2-3 times a week");
  const [level, setLevel] = React.useState("Intermediate");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    tutorService.getAllSubjects().then((subs) => {
      if (subs && subs.length > 0) {
        setSubjectsList(subs);
      }
    });
  }, []);

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
                {subjectsList.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-400">
                    Loading available subject disciplines...
                  </div>
                ) : (
                  subjectsList.map((sub) => {
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
                  })
                )}
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

          {/* Step 2: Goal & Level */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">
                  Define your learning target
                </h2>
                <p className="text-xs text-slate-500">
                  What specific exam, target score, or milestone are you working toward?
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Primary Goal or Target Exam</label>
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g. IELTS 7.5+, AP Calculus BC, Conversational German"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:border-brand-700 focus:ring-1 focus:ring-brand-700 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Current Proficiency Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setLevel(lvl)}
                        className={`py-3 rounded-xl border text-center text-xs font-bold transition-all ${
                          level === lvl
                            ? "border-brand-700 bg-brand-50 text-brand-900 ring-2 ring-brand-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <Button variant="outline" size="lg" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
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

          {/* Step 3: Frequency & Finish */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">
                  How often do you want to learn?
                </h2>
                <p className="text-xs text-slate-500">
                  Pick your ideal weekly lesson cadence. You can change this at any time.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: "1 time a week", desc: "Light revision & homework assistance (~2 hrs/week)" },
                  { label: "2-3 times a week", desc: "Standard progress & steady mastery (~5 hrs/week)" },
                  { label: "4+ times a week", desc: "Intensive exam cramming & fluency boot camp (~8+ hrs/week)" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setFrequency(item.label)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      frequency === item.label
                        ? "border-brand-700 bg-brand-50 ring-2 ring-brand-700"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Clock className={`h-5 w-5 shrink-0 mt-0.5 ${frequency === item.label ? "text-brand-700" : "text-slate-400"}`} />
                    <div>
                      <strong className={`block text-xs font-bold ${frequency === item.label ? "text-brand-900" : "text-slate-900"}`}>
                        {item.label}
                      </strong>
                      <span className="text-[11px] text-slate-500">{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <Button variant="outline" size="lg" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  disabled={loading}
                  className="font-bold bg-brand-700 hover:bg-brand-800"
                  onClick={handleFinish}
                  rightIcon={<Sparkles className="h-4 w-4" />}
                >
                  {loading ? "Personalizing..." : "Complete Setup & Launch"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
