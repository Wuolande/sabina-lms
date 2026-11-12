import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Become an Online Tutor — Teach Students Worldwide',
  description:
    'Join Sabina’s elite network of global educators. Set your own hourly rates, teach flexible hours from anywhere, and get paid securely with zero hassle.',
  alternates: {
    canonical: '/become-a-tutor',
  },
  openGraph: {
    title: 'Teach on Sabina — Elite 1-on-1 Online Tutoring Community',
    description:
      'Earn competitive income teaching students globally. Free modern live classroom with interactive whiteboard and automated scheduling.',
    url: '/become-a-tutor',
  },
};

export default function BecomeTutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
