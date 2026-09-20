"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BlogCard } from "@/components/blog/BlogCard";
import { FeaturedBlogCard } from "@/components/blog/FeaturedBlogCard";
import { BlogPost, BLOG_CATEGORIES } from "@/src/modules/blog/types/blogTypes";
import { blogClientService } from "@/services/blogClientService";

interface BlogListingClientProps {
  initialPosts: BlogPost[];
  initialTotalPages: number;
  initialTotalPosts: number;
}

export function BlogListingClient({
  initialPosts,
  initialTotalPages,
  initialTotalPosts,
}: BlogListingClientProps) {
  const [posts, setPosts] = React.useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(initialTotalPages);
  const [totalPosts, setTotalPosts] = React.useState(initialTotalPosts);
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = React.useState(false);

  const fetchBlogs = React.useCallback(async (targetPage: number, cat: string, query: string) => {
    setLoading(true);
    try {
      const res = await blogClientService.getPosts({
        category: cat === "All" ? undefined : cat,
        search: query.trim() || undefined,
        page: targetPage,
        pageSize: 9,
      });

      if (res && res.posts) {
        setPosts(res.posts);
        setTotalPages(res.totalPages || 1);
        setTotalPosts(res.total || 0);
      }
    } catch (err) {
      console.error("[BlogListingClient.fetchBlogs]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBlogs(1, selectedCategory, searchQuery);
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
    fetchBlogs(1, cat, searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchBlogs(newPage, selectedCategory, searchQuery);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) return;
    setNewsletterSubscribed(true);
  };

  const featuredPost =
    page === 1 && !searchQuery.trim() && selectedCategory === "All" && posts.length > 0
      ? posts[0]
      : null;
  const standardPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 sm:py-16 w-full max-w-full min-w-0">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-16">
        {/* Hero Header & Search */}
        <div className="text-center max-w-3xl mx-auto space-y-4 w-full min-w-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand text-xs font-bold shadow-2xs">
            <BookOpen className="h-4 w-4 text-brand" />
            <span>SABINA LEARNING HUB &amp; EDITORIAL</span>
          </div>

          <h1 className="text-2xl sm:text-5xl font-black text-slate-900 tracking-tight font-heading leading-tight">
            Knowledge, Strategies &amp; <span className="text-brand">Learning Insights</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Expert articles on language acquisition, test preparation, STEM mastery, and personalized tutoring methodologies.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2 max-w-lg mx-auto w-full">
            <div className="relative">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title, topic, or author..."
                leftIcon={<Search className="h-4 w-4" />}
                className="pr-24 bg-white shadow-xs rounded-2xl h-12 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand hover:opacity-90 text-white font-bold rounded-xl text-xs px-4 min-h-[36px]"
              >
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* Category Filter Pills */}
        <div className="w-full max-w-full min-w-0 flex items-center gap-2 overflow-x-auto pb-2 justify-start sm:justify-center scrollbar-hide touch-scroll">
          {BLOG_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-6 h-80 border border-slate-100 space-y-4">
                <div className="aspect-16/9 bg-slate-200 rounded-2xl" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 max-w-md mx-auto space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand flex items-center justify-center mx-auto">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading">No articles found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or selecting a different category.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
                setPage(1);
                fetchBlogs(1, "All", "");
              }}
              className="rounded-xl text-xs font-bold"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Post (Hero Card) */}
            {featuredPost && <FeaturedBlogCard post={featuredPost} />}

            {/* Standard Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {standardPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="rounded-xl h-10 px-3 text-xs font-bold gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      className={`h-10 w-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        page === p
                          ? "bg-brand text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-xl h-10 px-3 text-xs font-bold gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Newsletter Section */}
        <div className="rounded-3xl bg-slate-900 bg-gradient-to-br from-indigo-950 via-slate-900 to-[#14209C] p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold">
              <Mail className="h-3.5 w-3.5" />
              <span>THE SABINA DISPATCH</span>
            </div>

            <h3 className="text-xl sm:text-3xl font-black font-heading leading-tight text-white">
              Stay ahead with proven study frameworks &amp; educator insights
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
              Join thousands of students and educators who receive our bi-weekly digest of learning science, exam breakdowns, and platform guides.
            </p>

            {newsletterSubscribed ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm pt-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Thank you for subscribing! Check your inbox soon.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
                <Button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl px-6 h-12 shrink-0 cursor-pointer shadow-md"
                >
                  Subscribe Free
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
