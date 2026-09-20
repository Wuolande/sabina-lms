"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogPost } from "@/src/modules/blog/types/blogTypes";
import { blogClientService } from "@/services/blogClientService";

export function HomeBlogSection() {
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [isPaused, setIsPaused] = React.useState(false);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    blogClientService
      .getFeaturedPosts(10)
      .then((data) => {
        if (data && data.length > 0) {
          setPosts(data);
        }
      })
      .catch((err) => console.error("[HomeBlogSection]", err))
      .finally(() => setLoading(false));
  }, []);

  // Update scroll navigation states and active index on scroll
  const handleScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Compute approximate active item index based on scroll offset
    if (el.children.length > 0) {
      const firstChild = el.children[0] as HTMLElement;
      const itemWidth = firstChild.offsetWidth + 24; // width + gap
      if (itemWidth > 0) {
        const index = Math.round(scrollLeft / itemWidth);
        setActiveIndex(Math.min(posts.length - 1, Math.max(0, index)));
      }
    }
  }, [posts.length]);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll, posts]);

  const scrollPrev = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.85;
    el.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollNext = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.85;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const scrollToIndex = (index: number) => {
    const el = scrollContainerRef.current;
    if (!el || !el.children[index]) return;
    const targetChild = el.children[index] as HTMLElement;
    targetChild.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
    setActiveIndex(index);
  };

  // Auto-advance carousel every 6 seconds when not hovered or touched
  React.useEffect(() => {
    if (isPaused || loading || posts.length <= 1) return;

    const timer = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el) return;

      const { scrollLeft, scrollWidth, clientWidth } = el;
      if (scrollLeft >= scrollWidth - clientWidth - 20) {
        // Wrap around smoothly to the start
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const scrollAmount = el.clientWidth * 0.85;
        el.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, loading, posts.length]);

  if (!loading && posts.length === 0) {
    return null;
  }

  return (
    <section
      className="w-full max-w-full min-w-0 py-16 sm:py-28 bg-slate-50/70 border-t border-slate-200/60 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-100/40 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12 w-full max-w-full min-w-0">
          <div className="max-w-2xl min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand text-xs font-bold mb-4 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>FEATURED ARTICLES & GUIDES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-heading leading-tight">
              Featured Insights, Guides & <span className="text-brand">Language Tips</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 font-normal">
              Handpicked strategies on exam preparation, polyglot habits, and modern learning science curated by top educators.
            </p>
          </div>

          {/* Navigation Controls & Explore All Link */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollPrev}
                disabled={!canScrollLeft}
                aria-label="Previous featured articles"
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-slate-200 bg-white hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all shadow-xs cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={!canScrollRight}
                aria-label="Next featured articles"
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-slate-200 bg-white hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all shadow-xs cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <Link href="/blog" className="shrink-0">
              <Button
                variant="outline"
                className="border-slate-300 hover:border-slate-900 bg-white text-slate-900 font-bold gap-2 rounded-2xl shadow-xs min-h-[44px]"
              >
                <span>Explore All</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Carousel Container */}
        {loading ? (
          <div className="w-full flex gap-6 overflow-hidden py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-[85vw] sm:w-[360px] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse"
              >
                <div className="aspect-16/10 bg-slate-200 rounded-2xl w-full" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-4/5" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div
              ref={scrollContainerRef}
              tabIndex={0}
              role="region"
              aria-label="Featured Articles Carousel"
              className="w-full flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth py-2 px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded-3xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {posts.map((post, idx) => (
                <div
                  key={post.id}
                  className="w-[86vw] sm:w-[360px] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start flex flex-col"
                >
                  <BlogCard post={post} featured={true} />
                </div>
              ))}
            </div>

            {/* Indicator Dots & Count info */}
            <div className="flex items-center justify-between pt-6 px-1">
              <div className="flex items-center gap-2">
                {posts.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToIndex(idx)}
                    aria-label={`Go to featured article ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeIndex
                        ? "w-8 bg-brand-600"
                        : "w-2.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>

              <div className="text-xs text-slate-500 font-medium hidden sm:block">
                Swipe or use arrows to explore • {posts.length} Featured Articles
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
