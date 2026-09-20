import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Browse Subjects & Academic Disciplines',
  description:
    'Find certified specialist tutors across mathematics, coding, foreign languages, sciences, humanities, and exam prep. Start learning 1-on-1 today.',
  alternates: {
    canonical: '/subjects',
  },
  openGraph: {
    title: 'Browse Subjects & Academic Disciplines | Sabina Education',
    description:
      'Explore comprehensive tutoring curriculum across STEM, languages, business, and standardized test prep.',
    url: '/subjects',
  },
};

export default function SubjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/+$/, '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Academic Subjects & Tutoring Disciplines',
    description: 'Directory of academic and professional subjects offered on Sabina Education.',
    url: `${baseUrl}/subjects`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
