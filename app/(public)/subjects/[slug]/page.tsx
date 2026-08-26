"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Search, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { mockSubjects } from "@/lib/mock-data/subjects";
import { mockTutors } from "@/lib/mock-data/tutors";
import { TutorCard } from "@/components/marketplace/TutorCard";
import { BookingModal } from "@/components/booking/BookingModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TutorProfile } from "@/types";

export default function SubjectDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const subject = mockSubjects.find((s) => s.slug === slug);
  const subjectTutors = mockTutors.filter((t) =>
    t.subjects.some((s) => s.subject.slug === slug)
  );

  const [bookingTutor, setBookingTutor] = React.useState<TutorProfile | null>(null);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);

  if (!subject) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <EmptyState
          title="Subject not found"
          description="The requested subject category does not exist."
          actionLabel="Browse All Subjects"
          actionHref="/subjects"
        />
      </div>
    );
  }

  const handleBook = (tutor: TutorProfile) => {
    setBookingTutor(tutor);
    setIsBookingOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <Breadcrumb
        items={[
          { label: "Subjects", href: "/subjects" },
          { label: subject.name },
        ]}
      />

      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 p-8 sm:p-12 text-white shadow-elevation space-y-4">
        <Badge variant="secondary" size="sm" className="bg-accent-400 text-slate-950 font-bold">
          {subject.category}
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
          {subject.name} Tutors & Online Lessons
        </h1>
        <p className="text-base text-brand-100 max-w-2xl leading-relaxed">
          {subject.description} Learn 1-on-1 with accredited tutors, prepare for exams, or gain practical conversational confidence.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-4">
          <Link href={`/find-tutors?subject=${subject.slug}`}>
            <Button variant="secondary" size="lg" className="font-extrabold bg-accent-400 hover:bg-accent-500 text-slate-950">
              Browse All {subject.name} Tutors ({subject.tutorCount || 30}+)
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-xs text-brand-200">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>100% Verified Credentials</span>
          </div>
        </div>
      </div>

      {/* Top Tutors in this subject */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Featured {subject.name} Instructors
          </h2>
          <Link href={`/find-tutors?subject=${subject.slug}`} className="text-xs font-bold text-brand-700 hover:underline">
            View all &rarr;
          </Link>
        </div>

        {subjectTutors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjectTutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} onBook={handleBook} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockTutors.slice(0, 2).map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} onBook={handleBook} />
            ))}
          </div>
        )}
      </div>

      <BookingModal
        tutor={bookingTutor}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
