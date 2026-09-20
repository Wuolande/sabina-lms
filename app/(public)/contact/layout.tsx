import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Contact Us & 24/7 Global Student Support',
  description:
    'Have questions or need assistance? Reach out to the Sabina Education support team for student inquiries, tutor onboarding, or platform help.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Us & 24/7 Global Student Support | Sabina Education',
    description:
      'We are here to assist with lessons, scheduling, billing, and technical guidance.',
    url: '/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
