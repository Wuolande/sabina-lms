"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Bookmark,
  Check,
  Copy,
  BookOpen,
  Sparkles,
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogPost } from "@/src/modules/blog/types/blogTypes";
import { blogClientService } from "@/services/blogClientService";
import { formatDate } from "@/lib/utils";

export default function BlogPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!slug) return;
    setLoading(true);
    blogClientService
      .getPostBySlug(slug)
      .then((data) => {
        if (data && data.post) {
          setPost(data.post);
          setRelatedPosts(data.relatedPosts || []);
        } else {
          setPost(null);
        }
      })
      .catch((err) => {
        console.error("[BlogPostDetailPage]", err);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareOnTwitter = () => {
    if (typeof window !== "undefined" && post) {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Reading "${post.title}" on Sabina LMS:`);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
    }
  };

  const shareOnLinkedIn = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 space-y-8 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-10 bg-slate-200 rounded w-3/4" />
          <div className="h-6 bg-slate-200 rounded w-1/2" />
          <div className="aspect-16/9 bg-slate-200 rounded-3xl w-full" />
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-md space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-[#14209C] flex items-center justify-center mx-auto">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Article Not Found</h2>
          <p className="text-xs text-slate-500">
            The article you are looking for may have been moved, renamed, or unpublished.
          </p>
          <Link href="/blog">
            <Button className="bg-[#14209C] hover:bg-[#0e176b] text-white font-bold text-xs rounded-xl mt-2">
              Back to All Articles
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = post.publishedAt ? formatDate(post.publishedAt) : "Recently";

  return (
    <article className="min-h-screen bg-white">
      {/* ─── Breadcrumbs & Back Bar ─── */}
      <div className="border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-slate-500 font-medium">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#14209C] font-bold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Articles</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-slate-900">Blog</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[200px]">{post.category}</span>
          </div>
        </div>
      </div>

      {/* ─── Article Header ─── */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 space-y-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge
            variant="neutral"
            size="sm"
            className="bg-indigo-50 text-[#14209C] border border-indigo-100 font-bold uppercase tracking-wider text-[11px] px-3 py-1"
          >
            {post.category}
          </Badge>
          <span className="text-xs text-slate-400 font-medium">•</span>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">•</span>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>{post.readTime || "5 min read"}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight font-heading leading-tight">
          {post.title}
        </h1>

        <p className="text-base sm:text-xl text-slate-600 leading-relaxed font-normal">
          {post.excerpt}
        </p>

        {/* Author Bio Bar & Share Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {post.authorAvatar ? (
              <div className="relative h-12 w-12 rounded-full overflow-hidden bg-slate-100 shrink-0 ring-2 ring-indigo-50">
                <Image
                  src={post.authorAvatar}
                  alt={post.author}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#14209C] font-black text-sm shrink-0">
                {post.author.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-900">{post.author}</p>
              <p className="text-xs text-slate-400">{post.authorTitle || "Education Contributor"}</p>
            </div>
          </div>

          {/* Social Share Ribbon */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">Share:</span>
            <button
              onClick={shareOnTwitter}
              title="Share on X (Twitter)"
              className="h-9 w-9 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              onClick={shareOnLinkedIn}
              title="Share on LinkedIn"
              className="h-9 w-9 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.68 1.68 0 1 0 0-3.36 1.68 1.68 0 0 0 0 3.36m1.39 9.74v-8.37H5.07v8.37z" />
              </svg>
            </button>
            <button
              onClick={handleCopyLink}
              title="Copy article link"
              className="h-9 px-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center gap-1.5 text-slate-700 text-xs font-bold transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero Image ─── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-12">
        <div className="relative aspect-16/9 w-full rounded-3xl sm:rounded-[32px] overflow-hidden bg-slate-100 shadow-md">
          <Image
            src={post.featuredImage || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80"}
            alt={post.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>

      {/* ─── Main Article Body ─── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <div className="prose prose-slate prose-headings:font-heading prose-headings:font-black prose-h2:text-2xl sm:prose-h2:text-3xl prose-h3:text-xl prose-p:leading-relaxed prose-p:text-slate-700 prose-li:text-slate-700 max-w-none space-y-6">
          {/* Simple Markdown-to-HTML parser for clean formatted rendering */}
          {post.content.split("\n\n").map((block, idx) => {
            const trimmed = block.trim();
            if (trimmed.startsWith("## ")) {
              return (
                <h2 key={idx} className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-6 pb-2 border-b border-slate-100 font-heading">
                  {trimmed.replace("## ", "")}
                </h2>
              );
            }
            if (trimmed.startsWith("### ")) {
              return (
                <h3 key={idx} className="text-xl font-bold text-slate-900 tracking-tight pt-4 font-heading">
                  {trimmed.replace("### ", "")}
                </h3>
              );
            }
            if (trimmed.startsWith("- ")) {
              const listItems = trimmed.split("\n").map((li) => li.replace(/^-\s*/, ""));
              return (
                <ul key={idx} className="space-y-2 list-disc pl-5 my-4">
                  {listItems.map((li, liIdx) => (
                    <li key={liIdx} className="text-slate-700 text-sm sm:text-base leading-relaxed">
                      {li}
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={idx} className="text-slate-700 text-sm sm:text-base leading-relaxed">
                {trimmed}
              </p>
            );
          })}
        </div>

        {/* Tags List */}
        {post.tags && post.tags.length > 0 && (
          <div className="pt-10 mt-10 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Topics in this article:
            </span>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── 1-on-1 Tutoring Call to Action ─── */}
        <div className="mt-12 rounded-3xl bg-linear-to-br from-indigo-900 to-slate-950 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>PUT THEORY INTO PRACTICE</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-heading leading-tight">
              Ready to accelerate your learning with a verified 1-on-1 tutor?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Book a personalized trial lesson on Sabina. Thousands of native speakers, STEM mentors, and exam coaches available in your timezone.
            </p>
            <div className="pt-2">
              <Link href="/find-tutors">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl px-6 h-12 shadow-lg shadow-emerald-500/20 gap-2">
                  <span>Find Your Tutor Today</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Related Articles Section ─── */}
      {relatedPosts.length > 0 && (
        <section className="bg-slate-50/70 border-t border-slate-100 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                  Related in {post.category}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Continue exploring insightful learning guides</p>
              </div>
              <Link href="/blog">
                <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs gap-1">
                  <span>View All</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rPost) => (
                <BlogCard key={rPost.id} post={rPost} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
