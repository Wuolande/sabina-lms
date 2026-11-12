import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Educational Insights, Study Guides & Tutoring Advice',
  description:
    'Read evidence-based study strategies, language learning blueprints, coding tutorials, and academic insights from the Sabina educator community.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Sabina Education Blog | Expert Study Tips & Learning Guides',
    description:
      'Empowering students and tutors with actionable study techniques, pedagogy research, and career advice.',
    url: '/blog',
  },
};

export default function BlogRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://sabina.education').replace(/\/+$/, '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Sabina Education Blog',
    description: 'Insights on 1-on-1 tutoring, language mastery, STEM education, and learning science.',
    url: `${baseUrl}/blog`,
    publisher: {
      '@type': 'EducationalOrganization',
      name: 'Sabina Education',
      url: baseUrl,
    },
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
