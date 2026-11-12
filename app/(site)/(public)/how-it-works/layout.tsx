import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'How Sabina Works — 1-on-1 Online Learning Made Simple',
  description:
    'Discover how Sabina connects motivated students with verified specialist tutors. Learn how trial lessons, real-time video classrooms, and personalized roadmaps accelerate success.',
  alternates: {
    canonical: '/how-it-works',
  },
  openGraph: {
    title: 'How Sabina Works — 1-on-1 Online Learning Made Simple',
    description:
      '3 simple steps: choose your certified tutor, book a flexible trial lesson, and learn live in our interactive classroom.',
    url: '/how-it-works',
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
