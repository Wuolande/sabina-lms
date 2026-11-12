import * as React from "react";
import type { Metadata } from "next";
import { tutorService } from "@/src/modules/tutors/services/tutorService";
import { TutorProfileClient } from "@/components/tutor/TutorProfileClient";

interface TutorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TutorPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const tutor = await tutorService.getPublicProfile(slug);
    if (!tutor) return { title: "Tutor Profile | Sabina" };

    const name =
      `${tutor.firstName || ""} ${tutor.lastName || ""}`.trim() ||
      tutor.displayName ||
      tutor.name ||
      "Educator";
    const headline = tutor.headline || "Certified Educator & Academic Coach";
    const bio = tutor.bio
      ? tutor.bio.slice(0, 160)
      : `Learn with ${name} on Sabina. Book 1-on-1 personalized lessons.`;

    return {
      title: `${name} — ${headline} | Sabina`,
      description: bio,
      openGraph: {
        title: `${name} — ${headline} | Sabina`,
        description: bio,
        images: tutor.avatarUrl ? [{ url: tutor.avatarUrl }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} — ${headline} | Sabina`,
        description: bio,
        images: tutor.avatarUrl ? [tutor.avatarUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Tutor Profile | Sabina",
    };
  }
}

export default async function TutorProfilePage({ params }: TutorPageProps) {
  const { slug } = await params;

  let tutor: any | null = null;
  try {
    tutor = await tutorService.getPublicProfile(slug);
  } catch {
    // Falls back gracefully if tutor does not exist or DB connection times out
    tutor = null;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");
  const tutorName = tutor
    ? `${tutor.firstName || ""} ${tutor.lastName || ""}`.trim() || tutor.displayName || tutor.name || "Educator"
    : "Educator";

  const jsonLd = tutor
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        name: tutorName,
        jobTitle: tutor.headline || "Certified Educator",
        description: tutor.bio || undefined,
        image: tutor.avatarUrl || undefined,
        url: `${baseUrl}/tutors/${slug}`,
        offers: {
          "@type": "Offer",
          price: tutor.hourlyRate || 35,
          priceCurrency: tutor.currency || "USD",
          availability: "https://schema.org/InStock",
        },
        aggregateRating:
          tutor.reviewCount > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: tutor.averageRating || 5.0,
                reviewCount: tutor.reviewCount,
              }
            : undefined,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <TutorProfileClient initialTutor={tutor} slug={slug} />
    </>
  );
}
