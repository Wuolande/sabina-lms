import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { certificate } from "@/cms/academy/server";
import { PrintButton } from "@/components/payments/PrintButton";

export const metadata = { title: "Certificate" };
export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(["tutor"], `/tutor/training/${slug}/certificate`);
  const c = await certificate(await getPayloadClient(), user, slug).catch(() => null);
  if (!c) notFound();
  const date = new Date(c.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/tutor/training/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
          <ArrowLeft size={16} /> Course
        </Link>
        <PrintButton label="Print or save as PDF" />
      </div>
      <article className="relative overflow-hidden rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-slate-200/70 sm:px-14 sm:py-20 print:rounded-none print:ring-0">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-brand-600 via-brand-700 to-accent-400" aria-hidden="true" />
        <p className="font-heading text-xl font-bold text-brand-800">
          Sabina<span className="text-accent-500">.</span>
        </p>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Certificate of completion</p>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">{c.name}</h1>
        <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-slate-600">
          has completed <b className="text-slate-900">{c.course}</b> at the Sabina Academy{c.score != null ? `, with a quiz score of ${c.score}%` : ""}.
        </p>
        <dl className="mx-auto mt-12 grid max-w-md grid-cols-2 gap-6 border-t border-slate-100 pt-6 text-left text-sm">
          <div>
            <dt className="text-slate-500">Date</dt>
            <dd className="mt-0.5 font-semibold text-slate-900">{date}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Certificate number</dt>
            <dd className="mt-0.5 font-mono font-semibold text-slate-900">{c.number}</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
