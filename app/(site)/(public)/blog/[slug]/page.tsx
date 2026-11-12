import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { mediaUrl, postBySlug, siteSeo } from "@/cms/content/server";
import { RichText } from "@/components/content/RichText";
import { Meta, PostCardView } from "@/components/content/PostCards";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const found = await postBySlug((await params).slug);
  if (!found) return { title: "Post not found" };
  const { post, card } = found;
  const image = mediaUrl(post.seo?.image) ?? card.cover ?? (await siteSeo()).image;
  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    alternates: { canonical: `/blog/${card.slug}` },
    robots: post.seo?.noIndex ? { index: false } : undefined,
    openGraph: { type: "article", title: post.seo?.title || post.title, description: post.seo?.description || post.excerpt, publishedTime: card.publishedAt, images: image ? [image] : undefined },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const found = await postBySlug((await params).slug);
  if (!found) notFound();
  const { post, card, related } = found;
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: card.title,
    description: card.excerpt,
    datePublished: card.publishedAt,
    dateModified: post.updatedAt,
    image: card.cover ?? undefined,
    author: card.author ? { "@type": "Person", name: card.author } : { "@type": "Organization", name: "Sabina Education" },
    mainEntityOfPage: `${base}/blog/${card.slug}`,
  };
  return (
    <article className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
          <ArrowLeft size={16} /> Blog
        </Link>
        <header className="mt-6">
          <Meta p={card} />
          <h1 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">{card.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600 sm:text-xl">{card.excerpt}</p>
          {card.author && (
            <p className="mt-5 text-sm text-slate-500">
              By <span className="font-semibold text-slate-800">{card.author}</span>
              {card.authorTitle ? `, ${card.authorTitle}` : ""}
            </p>
          )}
        </header>
      </div>
      {card.cover && (
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(post.cover) ?? card.cover} alt="" className="aspect-[16/8] w-full rounded-3xl object-cover" />
        </div>
      )}
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <RichText data={post.body} />
      </div>
      {related.length > 0 && (
        <aside className="bg-[#F6F7FB] py-14">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Keep reading</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCardView key={p.id} p={p} />
              ))}
            </div>
          </div>
        </aside>
      )}
    </article>
  );
}
