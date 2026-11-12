import type { Metadata } from 'next';
import React from 'react';
import { adminSupabase } from '@/src/shared/database/supabase';

interface SubjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

async function getSubject(slug: string) {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let query = adminSupabase
      .from('subjects')
      .select('id, name, slug, description');

    if (isUuid) {
      query = query.or(`slug.eq.${slug},id.eq.${slug}`);
    } else {
      query = query.eq('slug', slug);
    }

    const { data } = await query.maybeSingle();
    return data;
  } catch (err) {
    console.error('[SubjectLayout] Error fetching subject:', err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const subject = await getSubject(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/+$/, '');

  if (!subject) {
    return {
      title: 'Subject Tutors | Sabina Education',
      description: 'Book private 1-on-1 lessons in your chosen subject with certified expert tutors.',
    };
  }

  const title = `Best 1-on-1 ${subject.name} Tutors Online`;
  const description = subject.description
    ? `${subject.description.slice(0, 140)}... Compare top-rated ${subject.name} tutors on Sabina.`
    : `Master ${subject.name} with certified, top-rated private tutors. 1-on-1 live video lessons, custom homework support, and exam preparation.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/subjects/${subject.slug || slug}`,
    },
    openGraph: {
      title: `${title} | Sabina Education`,
      description,
      url: `${baseUrl}/subjects/${subject.slug || slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Sabina Education`,
      description,
    },
  };
}

export default async function SubjectDetailLayout({
  children,
  params,
}: SubjectLayoutProps) {
  const { slug } = await params;
  const subject = await getSubject(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/+$/, '');

  let jsonLd = null;
  if (subject) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: `${subject.name} 1-on-1 Tutoring Program`,
      description: subject.description || `Comprehensive 1-on-1 tutoring and academic mentoring in ${subject.name}.`,
      provider: {
        '@type': 'EducationalOrganization',
        name: 'Sabina Education',
        sameAs: baseUrl,
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: 'PT1H',
      },
      offers: {
        '@type': 'Offer',
        category: 'Private Tutoring',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/subjects/${subject.slug || slug}`,
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
