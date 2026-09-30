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
    const { data: marketplaceData } = await adminSupabase.rpc("get_marketplace_tutors", {
      p_subject: rawSubject.slug || rawSubject.name,
      p_limit: 6,
      p_offset: 0,
      p_sort_by: "popularity",
    });

    if (marketplaceData?.tutors) {
      tutors = marketplaceData.tutors as TutorProfile[];
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
