import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'About Sabina — Empowering Human Potential Through 1-on-1 Mentorship',
  description:
    'Learn about Sabina’s mission to democratize elite 1-on-1 education globally. Discover our story, our educators, and our dedication to transformative teaching.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Sabina — Empowering Human Potential Through 1-on-1 Mentorship',
    description:
      'We connect learners with world-class mentors across languages, STEM, and exam prep in an immersive digital classroom.',
    url: '/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
