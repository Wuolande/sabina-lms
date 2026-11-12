"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Download,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { trainingService } from "@/services/trainingService";
import { TrainingCourse, QuizSubmissionResult } from "@/src/modules/training/types/trainingTypes";

export default function CourseQuizPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [course, setCourse] = React.useState<TrainingCourse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<QuizSubmissionResult | null>(null);

  React.useEffect(() => {
    if (slug) {
      trainingService.getCourseBySlug(slug)
        .then((data) => setCourse(data))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-xl mx-auto" />
        <div className="h-64 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (!course || !course.quiz) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Quiz Not Found</h2>
        <p className="text-xs text-slate-500">No assessment found for this training course.</p>
        <Link href="/tutor/training">
          <Button variant="default" size="default">Back to Academy</Button>
        </Link>
      </div>
    );
  }

  const quiz = course.quiz;
  const questions = quiz.questions || [];
  const allAnswered = questions.length > 0 && questions.every((q) => selectedAnswers[q.id] !== undefined);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (result) return; // locked if result is showing
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!allAnswered) return;
    setIsSubmitting(true);
    try {
      const res = await trainingService.submitQuiz(quiz.id, course.id, selectedAnswers);
      setResult(res);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/tutor/training/${course.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Course Lessons
        </Link>

        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
          Pass Threshold: {quiz.passingScore}%
        </span>
      </div>

      {/* ── Quiz Result Banner (If Submitted) ── */}
      {result && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border text-center space-y-4 shadow-sm ${
            result.passed
              ? "bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border-emerald-200"
              : "bg-gradient-to-br from-rose-50 via-white to-rose-50/30 border-rose-200"
          }`}
        >
          <div className="h-16 w-16 mx-auto rounded-3xl flex items-center justify-center border shadow-xs">
            {result.passed ? (
              <div className="h-16 w-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-300">
                <Sparkles className="h-8 w-8" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-300">
                <XCircle className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
              {result.passed ? "Congratulations! You Passed!" : "Assessment Not Passed"}
            </h2>
            <p className="text-sm font-semibold text-slate-600">
              You scored <strong>{result.scorePercentage}%</strong> ({result.correctCount} of {result.totalQuestions} questions correct).
            </p>
          </div>

          {result.passed ? (
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 max-w-md mx-auto space-y-3 shadow-xs">
              <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Credential Unlocked: {result.badgeTitle || course.badgeTitle}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Your official certification badge is now active on your public profile and search listings.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                {result.certificateCode && (
                  <Link href={`/tutor/training/certificates/${result.certificateCode}`}>
                    <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                      View Official Certificate
                    </Button>
                  </Link>
                )}
                <Link href="/tutor/training">
                  <Button variant="outline" size="sm" className="font-bold">
                    Academy Hub
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="default"
                size="default"
                className="bg-slate-950 hover:bg-slate-800 text-white font-bold"
                onClick={handleRetake}
                leftIcon={<RotateCcw className="h-4 w-4" />}
              >
                Retake Assessment
              </Button>
              <Link href={`/tutor/training/${course.slug}`}>
                <Button variant="outline" size="default" className="font-bold">
                  Review Lessons
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Quiz Questions Form ── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            {quiz.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Answer all {questions.length} questions. You must score {quiz.passingScore}% or higher to earn the official badge.
          </p>
        </div>

        <div className="space-y-8 divide-y divide-slate-100">
          {questions.map((q, qIndex) => {
            const selectedIdx = selectedAnswers[q.id];
            const explanationItem = result?.explanationList.find((e) => e.questionId === q.id);

            return (
              <div key={q.id} className="pt-6 first:pt-0 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white text-xs font-bold shrink-0 mt-0.5">
                    {qIndex + 1}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-relaxed">
                    {q.question}
                  </h3>
                </div>

                {/* Options List */}
                <div className="space-y-2.5 pl-9">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = selectedIdx === optIndex;
                    let optionStyle = isSelected
                      ? "border-slate-950 bg-slate-50 ring-1 ring-slate-950 font-semibold"
                      : "border-slate-200 hover:border-slate-300 bg-white";

                    if (result && explanationItem) {
                      if (optIndex === explanationItem.correctOptionIndex) {
                        optionStyle = "border-emerald-400 bg-emerald-50 text-emerald-900 font-bold";
                      } else if (isSelected && !explanationItem.isCorrect) {
                        optionStyle = "border-rose-400 bg-rose-50 text-rose-900";
                      }
                    }

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        onClick={() => handleSelectOption(q.id, optIndex)}
                        className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold text-slate-500 shrink-0">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span className="text-slate-800">{opt}</span>
                        </div>

                        {result && explanationItem && (
                          <>
                            {optIndex === explanationItem.correctOptionIndex && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            )}
                            {isSelected && !explanationItem.isCorrect && (
                              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Question Explanation Review */}
                {result && explanationItem && (
                  <div className="ml-9 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <strong className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                      Pedagogical Explanation:
                    </strong>
                    <p className="text-slate-600 leading-relaxed">
                      {explanationItem.explanation || q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Actions */}
        {!result && (
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              {Object.keys(selectedAnswers).length} of {questions.length} questions answered
            </span>

            <Button
              variant="default"
              size="lg"
              className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs cursor-pointer"
              disabled={!allAnswered || isSubmitting}
              isLoading={isSubmitting}
              onClick={handleSubmitQuiz}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Submit Assessment & Grade
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
