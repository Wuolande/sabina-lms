import Link from "next/link";
import { Newspaper } from "lucide-react";
import { blogCategories, listPosts, maybePayload } from "@/cms/content/server";
import { FeaturedPost, PostCardView } from "@/components/content/PostCards";

export const revalidate = 60;

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const q = await searchParams;
  const payload = await maybePayload();
  const page = Math.max(1, Number(q.page) || 1);
  const [{ posts, pages }, categories] = payload
    ? await Promise.all([listPosts(payload, { category: q.category, page, limit: 13 }), blogCategories(payload)])
    : [{ posts: [], pages: 1 }, [] as { name: string; slug: string }[]];
  const showFeatured = page === 1 && !q.category && posts.length > 0;
  const featured = showFeatured ? (posts.find((p) => p.featured) ?? posts[0]!) : null;
  const rest = featured ? posts.filter((p) => p.id !== featured.id) : posts;
  const href = (o: { category?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (o.category) sp.set("category", o.category);
    if (o.page && o.page > 1) sp.set("page", String(o.page));
    return `/blog${sp.size ? `?${sp}` : ""}`;
  };
  const chip = (active: boolean) => `inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition ${active ? "bg-slate-900 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`;

  return (
    <div className="bg-[#F6F7FB]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Blog</h1>
        <p className="mt-3 max-w-xl text-lg text-slate-600">Study tips, exam advice and teaching ideas from Sabina tutors and our team.</p>

        {categories.length > 0 && (
          <nav aria-label="Categories" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href={href({})} className={chip(!q.category)} aria-current={!q.category ? "page" : undefined}>
              All
            </Link>
            {categories.map((c) => (
              <Link key={c.slug} href={href({ category: c.slug })} className={chip(q.category === c.slug)} aria-current={q.category === c.slug ? "page" : undefined}>
                {c.name}
              </Link>
            ))}
          </nav>
        )}

        {posts.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-slate-200/70">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Newspaper size={26} />
            </span>
            <p className="mt-4 font-semibold text-slate-900">{q.category ? "No posts in this category yet" : "No posts yet"}</p>
            <p className="mt-1 text-sm text-slate-500">{q.category ? "Try another category, or see all posts." : "We're writing our first articles. Check back soon."}</p>
            {q.category && (
              <Link href="/blog" className="mt-5 inline-flex h-10 items-center rounded-full bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800">
                See all posts
              </Link>
            )}
          </div>
        ) : (
          <>
            {featured && (
              <div className="mt-10">
                <FeaturedPost p={featured} />
              </div>
            )}
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <PostCardView key={p.id} p={p} />
              ))}
            </div>
          </>
        )}

        {pages > 1 && (
          <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-3 text-sm">
            {page > 1 && (
              <Link href={href({ category: q.category, page: page - 1 })} className="inline-flex h-10 items-center rounded-full bg-white px-5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                Newer posts
              </Link>
            )}
            <span className="text-slate-500">
              Page {page} of {pages}
            </span>
            {page < pages && (
              <Link href={href({ category: q.category, page: page + 1 })} className="inline-flex h-10 items-center rounded-full bg-white px-5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                Older posts
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
