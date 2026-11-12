import Link from "next/link";
import type { PostCard } from "@/cms/content/types";

const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function Cover({ src, title, className }: { src: string | null; title: string; className: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`${className} object-cover`} loading="lazy" />
  ) : (
    <div className={`${className} grid place-items-center bg-gradient-to-br from-brand-50 to-brand-100`} aria-hidden="true">
      <span className="font-heading text-4xl font-bold text-brand-300">{title.charAt(0)}</span>
    </div>
  );
}

export const Meta = ({ p }: { p: PostCard }) => (
  <p className="text-[13px] text-slate-500">
    {p.category ? <span className="font-semibold text-brand-700">{p.category.name}</span> : null}
    {p.category ? " · " : ""}
    {date(p.publishedAt)} · {p.minutes} min read
  </p>
);

export function PostCardView({ p }: { p: PostCard }) {
  return (
    <Link href={`/blog/${p.slug}`} className="group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]">
      <Cover src={p.cover} title={p.title} className="aspect-[16/9] w-full" />
      <div className="flex flex-1 flex-col p-5">
        <Meta p={p} />
        <h3 className="mt-2 font-heading text-lg font-bold leading-snug text-slate-900 group-hover:text-brand-700">{p.title}</h3>
        <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-slate-600">{p.excerpt}</p>
      </div>
    </Link>
  );
}

export function FeaturedPost({ p }: { p: PostCard }) {
  return (
    <Link href={`/blog/${p.slug}`} className="group grid overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70 transition hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] md:grid-cols-2">
      <Cover src={p.cover} title={p.title} className="aspect-[16/10] w-full md:aspect-auto md:h-full" />
      <div className="flex flex-col justify-center p-6 sm:p-10">
        <Meta p={p} />
        <h2 className="mt-3 font-heading text-2xl font-bold leading-tight tracking-tight text-slate-900 group-hover:text-brand-700 sm:text-3xl">{p.title}</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-slate-600">{p.excerpt}</p>
        {p.author && (
          <p className="mt-5 text-sm text-slate-500">
            By <span className="font-semibold text-slate-800">{p.author}</span>
            {p.authorTitle ? `, ${p.authorTitle}` : ""}
          </p>
        )}
      </div>
    </Link>
  );
}
