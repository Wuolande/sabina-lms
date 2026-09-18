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
  GraduationCap,
} from "lucide-react";
import { studentService } from "@/services/studentService";
import { BookingModal } from "@/components/booking/BookingModal";

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
  const [internalBookingOpen, setInternalBookingOpen] = React.useState(false);

  React.useEffect(() => {
    studentService.isTutorFavorite(tutor.id).then(setIsFavorite);
  }, [tutor.id]);

  const handleBookClick = () => {
    if (onBook) {
      onBook(tutor);
    } else {
      setInternalBookingOpen(true);
    }
  };

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
    <div className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-white p-4 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200">
      
      {/* ─── Top Section: Avatar, Info & Price ─── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          
          {/* Avatar + Main Info */}
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <Link href={`/tutors/${tutorSlugOrId}`} className="relative shrink-0">
              <Avatar
                src={tutorAvatarUrl}
                alt={tutorDisplayName}
                fallbackName={tutorDisplayName}
                size="md"
                className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-slate-100 group-hover:ring-slate-200 transition-all"
                statusIndicator="online"
                superTutor={tutor.isSuperTutor}
              />
            </Link>

            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              {/* Name, Badges & Mobile Favorite */}
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <Link
                    href={`/tutors/${tutorSlugOrId}`}
                    className="font-bold text-slate-900 text-sm sm:text-lg hover:text-brand transition-colors leading-tight truncate"
                  >
                    {tutorDisplayName}
                  </Link>
                  {tutor.verificationStatus === "APPROVED" && (
                    <span title="Identity & Credentials Verified">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    </span>
                  )}
                  <span title="Sabina Academy Certified Educator">
                    <GraduationCap className="h-4 w-4 text-brand shrink-0" />
                  </span>
                  {tutor.isFeatured && (
                    <span className="text-[10px] font-semibold bg-brand-50 text-brand border border-brand-100/80 px-1.5 py-0.5 rounded-full shrink-0">
                      Featured
                    </span>
                  )}
                </div>

                {/* Mobile Favorite Button */}
                {showFavoriteButton && (
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className="sm:hidden rounded-full p-1 text-slate-300 hover:text-red-500 hover:bg-red-50/80 transition-colors shrink-0"
                    aria-label={isFavorite ? "Remove from favorites" : "Save tutor"}
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        isFavorite ? "fill-red-500 text-red-500" : "hover:text-red-500"
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Subject & Origin */}
              <p className="text-xs text-slate-500 font-medium truncate">
                {primarySubjectName} · From {tutorCountry}
              </p>

              {/* Clean Rating & Lessons */}
              <div className="flex items-center gap-1.5 pt-0.5 text-xs text-slate-500 flex-wrap">
                <span className="text-amber-400 text-sm leading-none">★</span>
                <span className="font-bold text-slate-900">
                  {tutor.averageRating > 0 ? tutor.averageRating.toFixed(1) : "5.0"}
                </span>
                <span className="text-slate-400">
                  ({tutor.reviewCount || 0})
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-medium text-slate-600">
                  {(tutor.totalLessons || 0).toLocaleString()} lessons
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Pricing & Favorite */}
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
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
        <p className="mt-3 sm:mt-4 text-[13px] sm:text-[14px] font-bold text-slate-900 line-clamp-2 leading-snug">
          {tutor.headline || "Certified Educator & Academic Coach"}
        </p>

        {/* Short Bio */}
        <p className="mt-1 sm:mt-1.5 text-xs sm:text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
          {tutor.bio || "Dedicated to helping students master concepts through engaging, personalized 1-on-1 lessons."}
        </p>

        {/* Subject & Language Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {subjectsList.slice(0, 3).map((sub: any) => {
            const name = sub.subject?.name || sub.name || "Subject";
            return (
              <span
                key={sub.id || name}
                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-50 border border-slate-200/80 text-slate-700 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg"
              >
                <BookOpen className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate max-w-[120px]">{name}</span>
              </span>
            );
          })}
          {nativeLanguageName && (
            <span className="inline-flex items-center text-[11px] font-semibold bg-brand-50 border border-brand-100 text-brand px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg">
              {nativeLanguageName}
            </span>
          )}
        </div>

        {/* Quick Highlights / Trust Line */}
        <div className="mt-3 sm:mt-4 flex items-center justify-between sm:justify-start gap-3 sm:gap-4 text-xs text-slate-500 pt-2.5 sm:pt-3 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>Responds in ~{tutor.responseTimeMinutes || 15}m</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{tutor.attendanceRate || 99}% attendance</span>
          </div>
        </div>
      </div>

      {/* ─── Footer Action Buttons ─── */}
      <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100">
        {/* Mobile Price Row */}
        <div className="sm:hidden flex items-center justify-between mb-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
          <span className="text-xs font-bold text-slate-500">Hourly Rate</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-slate-950 font-heading">
              {formatCurrency(tutor.hourlyRate || 35, tutor.currency || "USD")}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">/ 50-min</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Link href={`/tutors/${tutorSlugOrId}`} className="flex-1">
            <button
              type="button"
              className="w-full h-11 min-h-[44px] px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
            >
              View Profile
            </button>
          </Link>

          <button
            type="button"
            onClick={handleBookClick}
            className="flex-1 h-11 min-h-[44px] px-3 rounded-xl bg-brand hover:brightness-90 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-subtle transition-all active:scale-[0.98]"
          >
            <Calendar className="h-3.5 w-3.5 text-white/90 shrink-0" />
            <span>Book Lesson</span>
          </button>
        </div>
      </div>

      {!onBook && (
        <BookingModal
          tutor={tutor}
          isOpen={internalBookingOpen}
          onClose={() => setInternalBookingOpen(false)}
        />
      )}
    </div>
  );
}
