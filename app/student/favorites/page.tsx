"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { TutorCard } from "@/components/marketplace/TutorCard";
import { BookingModal } from "@/components/booking/BookingModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { studentService } from "@/services/studentService";
import { TutorProfile } from "@/types";

export default function StudentFavoritesPage() {
  const [favorites, setFavorites] = React.useState<TutorProfile[]>([]);
  const [bookingTutor, setBookingTutor] = React.useState<TutorProfile | null>(null);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);

  React.useEffect(() => {
    studentService.getFavoriteTutors().then(setFavorites);
  }, []);

  const handleBook = (tutor: TutorProfile) => {
    setBookingTutor(tutor);
    setIsBookingOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Favorite & Saved Tutors
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Instructors you&apos;ve bookmarked for fast, direct lesson scheduling.
        </p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-6 w-6 text-red-500" />}
          title="No favorite tutors saved yet"
          description="Click the heart icon on any tutor profile or search card to quickly access them here."
          actionLabel="Explore Tutors"
          actionHref="/find-tutors"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {favorites.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} onBook={handleBook} />
          ))}
        </div>
      )}

      <BookingModal
        tutor={bookingTutor}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
