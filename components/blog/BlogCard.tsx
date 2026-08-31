"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar, ArrowRight, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { BlogPost } from "@/src/modules/blog/types/blogTypes";
import { formatDate } from "@/lib/utils";

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const formattedDate = post.publishedAt ? formatDate(post.publishedAt) : "Recently";

  return (
    <article className="group flex flex-col bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Image Container */}
      <Link href={`/blog/${post.slug}`} className="relative aspect-16/10 w-full overflow-hidden bg-slate-100 block">
        <Image
          src={post.featuredImage || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80"}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 z-10">
          <Badge
            variant="neutral"
            size="sm"
            className="bg-white/90 backdrop-blur-md text-slate-900 font-bold shadow-xs border-0"
          >
            {post.category}
          </Badge>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        {/* Meta details */}
        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{post.readTime || "5 min read"}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#14209C] transition-colors line-clamp-2 leading-snug mb-2 font-heading">
          <Link href={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-6 flex-1">
          {post.excerpt}
        </p>

        {/* Author & CTA Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-2.5">
            {post.authorAvatar ? (
              <div className="relative h-8 w-8 rounded-full overflow-hidden bg-slate-100 shrink-0">
                <Image
                  src={post.authorAvatar}
                  alt={post.author}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#14209C] font-bold text-xs shrink-0">
                {post.author.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">{post.author}</p>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{post.authorTitle || "Author"}</p>
            </div>
          </div>

          <Link
            href={`/blog/${post.slug}`}
            className="text-xs font-bold text-[#14209C] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
          >
            <span>Read</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
