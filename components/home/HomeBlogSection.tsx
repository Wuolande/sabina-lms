"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogPost } from "@/src/modules/blog/types/blogTypes";
import { blogClientService } from "@/services/blogClientService";

export function HomeBlogSection() {
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    blogClientService
      .getRecentPosts(3)
      .then((data) => {
        if (data && data.length > 0) {
          setPosts(data);
        }
      })
      .catch((err) => console.error("[HomeBlogSection]", err))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) {
    return null;
  }

  return (
    <section className="py-20 sm:py-28 bg-slate-50/70 border-t border-slate-200/60 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-100/40 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-[#14209C] text-xs font-bold mb-4 shadow-2xs">
              <BookOpen className="h-3.5 w-3.5 text-[#14209C]" />
              <span>SABINA LEARNING HUB</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-heading leading-tight">
              Insights, Study Guides & <span className="text-[#14209C]">Language Tips</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 font-normal">
              Actionable advice on exam preparation, polyglot habits, and modern learning science from our top tutors.
            </p>
          </div>

          <Link href="/blog" className="shrink-0">
            <Button
              variant="outline"
              className="border-slate-300 hover:border-slate-900 bg-white text-slate-900 font-bold gap-2 rounded-2xl shadow-xs"
            >
              <span>Explore All Articles</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Loading skeleton or 3-column Blog Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
                <div className="aspect-16/10 bg-slate-200 rounded-2xl w-full" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-4/5" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
