"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BlogPost } from "@/src/modules/blog/types/blogTypes";
import { formatDate } from "@/lib/utils";

interface FeaturedBlogCardProps {
  post: BlogPost;
}

export function FeaturedBlogCard({ post }: FeaturedBlogCardProps) {
  const formattedDate = post.publishedAt ? formatDate(post.publishedAt) : "Recently";

  return (
    <article className="group relative bg-white rounded-3xl sm:rounded-[36px] border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0">
      {/* Image half */}
      <Link
        href={`/blog/${post.slug}`}
        className="lg:col-span-7 relative min-h-[280px] sm:min-h-[380px] lg:min-h-full overflow-hidden bg-slate-100 block"
      >
        <Image
          src={post.featuredImage || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80"}
          alt={post.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/40 via-transparent to-transparent lg:hidden" />
        
        <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
          <Badge
            variant="emerald-solid"
            size="sm"
            className="font-bold flex items-center gap-1 shadow-md uppercase tracking-wider text-[10px]"
          >
            <Sparkles className="h-3 w-3" />
            <span>Featured Guide</span>
          </Badge>
          <Badge
            variant="neutral"
            size="sm"
            className="bg-white/90 backdrop-blur-md text-slate-900 font-bold shadow-xs border-0"
          >
            {post.category}
          </Badge>
        </div>
      </Link>

      {/* Content half */}
      <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between">
        <div>
          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mb-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{post.readTime || "6 min read"}</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 group-hover:text-[#14209C] transition-colors leading-tight mb-4 font-heading">
            <Link href={`/blog/${post.slug}`}>
              {post.title}
            </Link>
          </h2>

          {/* Excerpt */}
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 mb-6">
            {post.excerpt}
          </p>
        </div>

        {/* Author & Action */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {post.authorAvatar ? (
              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-slate-100 shrink-0 ring-2 ring-indigo-50">
                <Image
                  src={post.authorAvatar}
                  alt={post.author}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#14209C] font-bold text-sm shrink-0">
                {post.author.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">{post.author}</p>
              <p className="text-[11px] text-slate-400">{post.authorTitle || "Lead Educator"}</p>
            </div>
          </div>

          <Link href={`/blog/${post.slug}`}>
            <Button className="bg-[#14209C] hover:bg-[#0e176b] text-white font-bold gap-2 text-xs sm:text-sm rounded-2xl shadow-xs">
              <span>Read Article</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
