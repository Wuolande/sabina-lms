"use client";

import * as React from "react";
import Link from "next/link";
import { TutorProfile } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { formatCurrency } from "@/lib/utils";
import {
  Heart,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  Calendar,
  BookOpen,
} from "lucide-react";
import { studentService } from "@/services/studentService";

interface TutorCardProps {
  tutor: TutorProfile;
  onBook?: (tutor: TutorProfile) => void;
  showFavoriteButton?: boolean;
}

export function TutorCard({
  tutor,
  onBook,
  showFavoriteButton = true,
}: TutorCardProps) {
  const [isFavorite, setIsFavorite] = React.useState(false);

  React.useEffect(() => {
    studentService.isTutorFavorite(tutor.id).then(setIsFavorite);
  }, [tutor.id]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = await studentService.toggleFavoriteTutor(tutor.id);
    setIsFavorite(updated);
  };

  const subjectsList: any[] = tutor.subjects || [];
  const languagesList: any[] = tutor.languages || [];
  const primarySubObj: any = subjectsList.find((s: any) => s.isPrimary) || subjectsList[0];
  const primarySubjectName = primarySubObj?.subject?.name || primarySubObj?.name || "Academic Subject";

  const nativeLangObj: any = languagesList.find((l: any) => l.proficiency === "Native" || l.proficiency === "NATIVE" || l.proficiency === "FLUENT") || languagesList[0];
  const nativeLanguageName = nativeLangObj?.language?.name || nativeLangObj?.name || nativeLangObj?.code;

  const tutorDisplayName = tutor.user?.displayName || (tutor as any).tutorName || (tutor as any).displayName || "Verified Tutor";
  const tutorAvatarUrl = tutor.user?.avatarUrl || (tutor as any).tutorAvatar || (tutor as any).avatarUrl;
  const tutorCountry = tutor.user?.country || (tutor as any).country || "Global";
  const tutorSlugOrId = tutor.slug || tutor.id;

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/70 bg-white p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200">
      
      {/* ─── Top Section: Avatar, Info & Price ─── */}
      <div>
        <div className="flex items-start justify-between gap-4">
          
          {/* Avatar + Main Info */}
          <div className="flex items-start gap-4 min-w-0">
            <Link href={`/tutors/${tutorSlugOrId}`} className="relative shrink-0">
              <Avatar
                src={tutorAvatarUrl}
                alt={tutorDisplayName}
                fallbackName={tutorDisplayName}
                size="lg"
                statusIndicator="online"
                superTutor={tutor.isSuperTutor}
                className="ring-2 ring-slate-100 group-hover:ring-slate-200 transition-all"
              />
            </Link>

            <div className="space-y-1 min-w-0">
              {/* Name & Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/tutors/${tutorSlugOrId}`}
                  className="font-bold text-slate-900 text-base sm:text-lg hover:text-emerald-700 transition-colors leading-tight"
                >
                  {tutorDisplayName}
                </Link>
                {tutor.verificationStatus === "APPROVED" && (
                  <span title="Identity & Credentials Verified">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  </span>
                )}
                {tutor.isFeatured && (
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100/80 px-2 py-0.5 rounded-full">
                    Featured
                  </span>
                )}
              </div>

              {/* Subject & Origin */}
              <p className="text-xs text-slate-500 font-medium">
                {primarySubjectName} · From {tutorCountry}
              </p>

              {/* Clean Rating & Lessons */}
              <div className="flex items-center gap-1.5 pt-0.5 text-xs text-slate-500">
                <span className="text-amber-400 text-sm leading-none">★</span>
                <span className="font-bold text-slate-900">
                  {tutor.averageRating > 0 ? tutor.averageRating.toFixed(1) : "5.0"}
                </span>
                <span className="text-slate-400">
                  ({tutor.reviewCount || 0} {(tutor.reviewCount || 0) === 1 ? "review" : "reviews"})
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-medium text-slate-600">
                  {(tutor.totalLessons || 0).toLocaleString()} lessons
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Favorite */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {showFavoriteButton && (
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="rounded-full p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50/80 transition-colors focus:outline-none"
                aria-label={isFavorite ? "Remove from favorites" : "Save tutor"}
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    isFavorite
                      ? "fill-red-500 text-red-500"
                      : "hover:text-red-500"
                  }`}
                />
              </button>
            )}

            <div className="text-right mt-1">
              <span className="text-2xl font-black text-slate-950 tracking-tight font-heading leading-none">
                {formatCurrency(tutor.hourlyRate || 35, tutor.currency || "USD")}
              </span>
              <span className="text-[11px] text-slate-400 block font-medium mt-0.5">
                / 50-min
              </span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <p className="mt-4 text-[14px] font-bold text-slate-900 line-clamp-2 leading-snug">
          {tutor.headline || "Certified Educator & Academic Coach"}
        </p>

        {/* Short Bio */}
        <p className="mt-1.5 text-xs sm:text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
          {tutor.bio || "Dedicated to helping students master concepts through engaging, personalized 1-on-1 lessons."}
        </p>

        {/* Subject & Language Badges */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {subjectsList.slice(0, 3).map((sub: any) => {
            const name = sub.subject?.name || sub.name || "Subject";
            return (
              <span
                key={sub.id || name}
                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-50 border border-slate-200/80 text-slate-700 px-2.5 py-1 rounded-lg"
              >
                <BookOpen className="h-3 w-3 text-slate-400" />
                {name}
              </span>
            );
          })}
          {nativeLanguageName && (
            <span className="inline-flex items-center text-[11px] font-semibold bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg">
              {nativeLanguageName}
            </span>
          )}
        </div>

        {/* Quick Highlights / Trust Line */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Responds in ~{tutor.responseTimeMinutes || 15}m</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>{tutor.attendanceRate || 99}% attendance</span>
          </div>
        </div>
      </div>

      {/* ─── Footer Action Buttons ─── */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <Link href={`/tutors/${tutorSlugOrId}`} className="flex-1">
          <button
            type="button"
            className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
          >
            View Profile
          </button>
        </Link>

        <button
          type="button"
          onClick={() => onBook?.(tutor)}
          className="flex-1 h-10 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-subtle transition-all active:scale-[0.98]"
        >
          <Calendar className="h-3.5 w-3.5 text-slate-300" />
          <span>Book Lesson</span>
        </button>
      </div>
    </div>
  );
}
