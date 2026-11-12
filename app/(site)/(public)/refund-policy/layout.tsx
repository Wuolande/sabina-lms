import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: '100% Satisfaction Guarantee & Refund Policy',
  description: 'Understand Sabina’s 100% satisfaction guarantee, cancellation guidelines, and hassle-free refund process.',
  alternates: { canonical: '/refund-policy' },
};

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
