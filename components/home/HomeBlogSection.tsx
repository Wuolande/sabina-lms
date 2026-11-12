import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PostCard } from "@/cms/content/types";
import { PostCardView } from "@/components/content/PostCards";

/** Latest posts on the homepage. Hidden until something is published. */
export function HomeBlogSection({ posts }: { posts: PostCard[] }) {
  if (!posts.length) return null;
  return (
    <section className="w-full bg-[#F6F7FB] py-14 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">From the blog</p>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">Tips for learning and teaching</h2>
          </div>
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
            Read the blog <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCardView key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
