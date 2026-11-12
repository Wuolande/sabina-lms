import * as React from "react";
import type { Metadata } from "next";
import { adminSupabase } from "@/src/shared/database/supabase";
import { FindTutorsClient } from "@/components/marketplace/FindTutorsClient";
import { TutorCardSkeleton } from "@/components/ui/Skeleton";
import { TutorProfile, Subject, Language } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find Verified Private Tutors Online | 1-on-1 Lessons",
  description:
    "Search and book top 1% verified private tutors for 1-on-1 online lessons across Mathematics, Sciences, Languages, Coding, and Standardized Exam Prep. 100% satisfaction guarantee.",
  alternates: {
    canonical: "/find-tutors",
  },
  openGraph: {
    title: "Find Verified Private Tutors Online | Sabina Education",
    description:
      "Search and book top 1% verified private tutors for 1-on-1 online lessons across Mathematics, Sciences, Languages, and Exam Prep.",
  },
};

interface FindTutorsPageProps {
  searchParams?: Promise<{
    subject?: string;
    group?: string;
    q?: string;
    query?: string;
    country?: string;
    language?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function FindTutorsPage({ searchParams }: FindTutorsPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const subject = resolvedParams.subject || null;
  const category = resolvedParams.group || null;
  const search = resolvedParams.q || resolvedParams.query || null;
  const country = resolvedParams.country || null;
  const language = resolvedParams.language || null;
  const minPrice = resolvedParams.minPrice ? Number(resolvedParams.minPrice) : null;
  const maxPrice = resolvedParams.maxPrice ? Number(resolvedParams.maxPrice) : null;

  let initialTutors: TutorProfile[] = [];
  let initialTotal = 0;
  let initialSubjects: Subject[] = [];
  let initialLanguages: Language[] = [];

  try {
    const [tutorsRes, subjectsRes, languagesRes] = await Promise.all([
      adminSupabase.rpc("get_marketplace_tutors", {
        p_search: search,
        p_category: category,
        p_subject: subject,
        p_country: country,
        p_language: language,
        p_min_price: minPrice,
        p_max_price: maxPrice,
        p_rating: null,
        p_is_featured: null,
        p_is_super_tutor: null,
        p_sort_by: "popularity",
        p_limit: 6,
        p_offset: 0,
      }),
      adminSupabase.from("subjects").select("*").eq("is_active", true).order("name"),
      adminSupabase.from("languages").select("*").eq("is_active", true).order("name"),
    ]);

    if (tutorsRes.data) {
      initialTutors = tutorsRes.data.tutors || [];
      initialTotal = tutorsRes.data.total || 0;
    }
    if (subjectsRes.data) {
      initialSubjects = subjectsRes.data as Subject[];
    }
    if (languagesRes.data) {
      initialLanguages = languagesRes.data as Language[];
    }
  } catch (err) {
    console.error("[FindTutorsPage] Server-side initial data load error:", err);
  }

  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <TutorCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <FindTutorsClient
        initialTutors={initialTutors}
        initialTotal={initialTotal}
        initialSubjects={initialSubjects}
        initialLanguages={initialLanguages}
      />
    </React.Suspense>
  );
}
