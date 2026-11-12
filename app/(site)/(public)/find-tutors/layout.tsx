import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Find Certified 1-on-1 Online Tutors',
  description:
    'Browse elite verified tutors across languages, mathematics, computer science, and exam preparation. Compare hourly rates, verified reviews, and book instant trial lessons.',
  alternates: {
    canonical: '/find-tutors',
  },
  openGraph: {
    title: 'Find Certified 1-on-1 Online Tutors | Sabina Education',
    description:
      'Connect with top-rated private tutors worldwide. Book interactive 1-on-1 video lessons with real-time whiteboards and personalized study plans.',
    url: '/find-tutors',
  },
};

export default function FindTutorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/+$/, '');

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Find Certified Online Tutors',
    description: 'Directory of verified private tutors available for 1-on-1 online video lessons.',
    url: `${baseUrl}/find-tutors`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}
