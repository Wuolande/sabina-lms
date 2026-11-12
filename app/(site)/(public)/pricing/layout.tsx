import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Transparent Pricing & 100% Satisfaction Guarantee',
  description:
    'No subscriptions or hidden fees. Pay per lesson directly to certified tutors with rates starting from $15/hour, backed by our 100% satisfaction guarantee.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Transparent Pricing & 100% Satisfaction Guarantee | Sabina Education',
    description:
      'Affordable, flexible 1-on-1 private tutoring. Compare hourly rates, book discounted trial lessons, and learn risk-free.',
    url: '/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
