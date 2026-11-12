import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Study tips, exam advice and teaching ideas from Sabina tutors and our team.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'The Sabina blog',
    description:
      'Study tips, exam advice and teaching ideas from Sabina tutors and our team.',
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
    description: 'Study tips, exam advice and teaching ideas from Sabina tutors and our team.',
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
