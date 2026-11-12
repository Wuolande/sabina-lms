import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Terms of Service & Platform Agreement',
  description: 'Terms and conditions governing the use of Sabina Education tutoring services, student and tutor agreements.',
  alternates: { canonical: '/terms' },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
