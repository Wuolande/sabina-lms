import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Protection (GDPR / CCPA)',
  description: 'Learn how Sabina Education collects, stores, and protects personal data in strict compliance with GDPR and global privacy standards.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
