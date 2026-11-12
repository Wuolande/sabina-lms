import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Cookie Policy & Tracking Technologies',
  description: 'Information regarding the cookies and local storage technologies used to provide secure authentication and optimal learning experiences.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
