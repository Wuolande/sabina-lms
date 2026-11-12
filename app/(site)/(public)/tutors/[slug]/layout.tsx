import type { Metadata } from 'next';
import React from 'react';
import { adminSupabase } from '@/src/shared/database/supabase';

interface TutorLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

async function getTutor(slug: string) {
  try {
    const { data } = await adminSupabase
      .from('tutor_profiles')
      .select(`
        id,
        slug,
        headline,
        bio,
        hourly_rate,
        currency,
        average_rating,
        review_count,
        total_lessons,
        users (
          full_name,
          avatar_url
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    return data;
  } catch (err) {
    console.error('[TutorLayout] Error fetching tutor:', err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tutor = await getTutor(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/+$/, '');

  if (!tutor) {
    return {
      title: 'Tutor Profile | Sabina Education',
      description: 'Book private 1-on-1 online lessons with certified expert tutors.',
    };
  }

  const rawUser = tutor.users;
  const user = Array.isArray(rawUser) ? rawUser[0] : rawUser;
  const fullName = user?.full_name || 'Certified Tutor';
  const headline = tutor.headline || 'Online Educator';
  const bioExcerpt = (tutor.bio || 'Book 1-on-1 online lessons with a verified subject tutor on Sabina.')
    .replace(/\s+/g, ' ')
    .slice(0, 150);
  const avatar = user?.avatar_url || `${baseUrl}/images/og-default.png`;

  const title = `${fullName} — ${headline} | Sabina Tutors`;
  const description = `${headline}. ${bioExcerpt}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/tutors/${slug}`,
    },
    openGraph: {
      type: 'profile',
      title,
      description,
      url: `${baseUrl}/tutors/${slug}`,
      images: [
        {
          url: avatar,
          width: 800,
          height: 800,
          alt: fullName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [avatar],
    },
  };
}

export default async function TutorProfileLayout({
  children,
  params,
}: TutorLayoutProps) {
  const { slug } = await params;
  const tutor = await getTutor(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/+$/, '');

  let jsonLd = null;
  if (tutor) {
    const rawUser = tutor.users;
    const user = Array.isArray(rawUser) ? rawUser[0] : rawUser;
    const fullName = user?.full_name || 'Certified Tutor';
    const avatar = user?.avatar_url || `${baseUrl}/images/og-default.png`;

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: fullName,
      jobTitle: tutor.headline || 'Private Tutor',
      description: tutor.bio || `${fullName} is a verified private tutor on Sabina Education.`,
      image: avatar,
      url: `${baseUrl}/tutors/${slug}`,
      ...(tutor.review_count && tutor.review_count > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: Number(tutor.average_rating) || 5,
              reviewCount: tutor.review_count,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
      offers: {
        '@type': 'Offer',
        price: Number(tutor.hourly_rate) || 25,
        priceCurrency: tutor.currency || 'USD',
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/tutors/${slug}`,
      },
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
