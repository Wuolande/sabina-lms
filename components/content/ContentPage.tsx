import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mediaUrl, pageBySlug } from "@/cms/content/server";
import { RichText } from "./RichText";

export async function pageMetadata(slug: string, path: string): Promise<Metadata> {
  const page = await pageBySlug(slug);
  if (!page) return { title: "Page not found" };
  const image = mediaUrl(page.seo?.image);
  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.intro || undefined,
    alternates: { canonical: path },
    robots: page.seo?.noIndex ? { index: false } : undefined,
    openGraph: { title: page.seo?.title || page.title, description: page.seo?.description || page.intro || undefined, images: image ? [image] : undefined },
  };
}

/** An editable page from Payload (admin → Website → Pages). */
export async function ContentPage({ slug }: { slug: string }) {
  const page = await pageBySlug(slug);
  if (!page) notFound();
  const legal = page.kind === "legal";
  return (
    <div className="bg-white">
      <header className="border-b border-slate-100 bg-[#F6F7FB]">
        <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-14 sm:px-6 sm:pt-20">
          {legal && <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Legal</p>}
          <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{page.title}</h1>
          {page.intro && <p className="mt-4 text-lg leading-relaxed text-slate-600 sm:text-xl">{page.intro}</p>}
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <RichText data={page.body} />
        <p className="mt-14 border-t border-slate-100 pt-6 text-sm text-slate-500">
          Last changed {new Date(page.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
      </div>
    </div>
  );
}
