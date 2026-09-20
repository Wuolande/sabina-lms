import { notFound } from "next/navigation";
import { adminSupabase } from "@/src/shared/database/supabase";
import { SubjectDetailClient } from "@/components/subjects/SubjectDetailClient";
import { Subject, TutorProfile } from "@/types";

export const dynamic = "force-dynamic";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) notFound();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  let query = adminSupabase.from("subjects").select("*");

  if (isUuid) {
    query = query.or(`slug.eq.${slug},id.eq.${slug}`);
  } else {
    query = query.eq("slug", slug);
  }

  const { data: rawSubject } = await query.maybeSingle();
  if (!rawSubject) notFound();

  const subject: Subject = {
    id: rawSubject.id,
    name: rawSubject.name,
    slug: rawSubject.slug,
    category: rawSubject.category || "General",
    description: rawSubject.description || "",
    popular: Boolean(rawSubject.popular),
    tutorCount: rawSubject.tutor_count || 0,
  };

  // Fetch verified tutors teaching this subject
  let tutors: TutorProfile[] = [];
  try {
    const { data: rawTutors } = await adminSupabase
      .from("tutor_profiles")
      .select(`
        id,
        user_id,
        slug,
        headline,
        bio,
        hourly_rate,
        currency,
        average_rating,
        review_count,
        total_lessons,
        total_students,
        is_featured,
        is_super_tutor,
        verification_status,
        account_status,
        users (
          full_name,
          avatar_url,
          country
        )
      `)
      .is("deleted_at", null)
      .eq("verification_status", "verified")
      .eq("account_status", "active")
      .limit(6);

    if (rawTutors) {
      tutors = (rawTutors.map((t: any) => {
        const u = Array.isArray(t.users) ? t.users[0] : t.users;
        const displayName = u?.full_name || "Verified Tutor";
        return {
          id: t.id,
          userId: t.user_id,
          slug: t.slug || t.id,
          user: {
            id: t.user_id,
            email: "",
            role: "TUTOR" as const,
            firstName: displayName.split(" ")[0] || "Tutor",
            lastName: displayName.split(" ").slice(1).join(" ") || "",
            displayName,
            avatarUrl: u?.avatar_url || "",
            country: u?.country || "United Kingdom",
            timezone: "UTC",
            preferredLanguage: "en",
            status: "ACTIVE" as const,
            createdAt: "",
            updatedAt: "",
          },
          name: displayName,
          avatar: u?.avatar_url || "",
          country: u?.country || "United Kingdom",
          headline: t.headline || "",
          bio: t.bio || "",
          hourlyRate: Number(t.hourly_rate) || 25,
          currency: t.currency || "USD",
          rating: Number(t.average_rating) || 5.0,
          reviewCount: t.review_count || 0,
          totalLessons: t.total_lessons || 0,
          totalStudents: t.total_students || 0,
          isSuperTutor: Boolean(t.is_super_tutor),
          isFeatured: Boolean(t.is_featured),
          languages: [{ language: "English", proficiency: "Native" }],
          subjects: [{ subject: subject.name, level: "All Levels" }],
          badges: [],
          videoUrl: "",
          responseTime: "< 1 hr",
          attendanceRate: 100,
          repeatStudentRate: 95,
        };
      }) as unknown) as TutorProfile[];
    }
  } catch (err) {
    console.error("[SubjectDetailPage] SSR load tutors error:", err);
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${subject.name} 1-on-1 Online Tutoring`,
    description: subject.description || `Master ${subject.name} with certified 1-on-1 private tutors on Sabina Education.`,
    provider: {
      "@type": "Organization",
      name: "Sabina Education",
      sameAs: baseUrl,
    },
    educationalCredentialAwarded: "Certificate of Completion",
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT50M",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <SubjectDetailClient initialSubject={subject} initialTutors={tutors} />
    </>
  );
}
