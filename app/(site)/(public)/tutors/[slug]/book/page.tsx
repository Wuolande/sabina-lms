import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { getTutorBySlug } from "@/cms/marketplace/public";
import { BookingWidget } from "@/components/scheduling/BookingWidget";
import { safeTz } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Book a lesson", robots: { index: false } };

export default async function BookPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ type?: string }> }) {
  const { slug } = await params;
  const { type } = await searchParams;
  const user = await requireUser(["student"], `/tutors/${slug}/book${type ? `?type=${encodeURIComponent(type)}` : ""}`);
  const data = await getTutorBySlug(await getPayloadClient(), slug);
  if (!data) notFound();
  const t = data.tutor;
  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pt-12">
        <Link href={`/tutors/${t.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
          <ArrowLeft size={16} /> Back to {t.name}
        </Link>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-900">Book a lesson with {t.name.split(" ")[0]}</h1>
        <p className="mt-1 text-slate-500">Times are shown in your time zone. You can change it below.</p>
        <div className="mt-8">
          <BookingWidget
            tutor={{ id: t.id, slug: t.slug, name: t.name, photo: t.photo, subjects: t.subjects.map((s) => ({ id: s.id, name: s.name })), primarySubjectId: t.primarySubject?.id ?? null }}
            initialTz={safeTz(user.timezone)}
            initialKind={type === "trial" ? "trial" : "regular"}
            cancellationHours={data.policies.cancellationRefundHours}
          />
        </div>
      </div>
    </div>
  );
}
