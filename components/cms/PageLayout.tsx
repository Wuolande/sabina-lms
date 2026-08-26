"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Printer,
  Share2,
  Check,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  FileText,
  Lock,
  ArrowRight,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface PageLayoutProps {
  page: {
    slug: string;
    title: string;
    category: string;
    metaTitle?: string;
    metaDescription?: string;
    contentHtml: string;
    readingTimeMinutes?: number;
    lastReviewedAt?: string;
    updatedAt?: string;
  };
}

export function PageLayout({ page }: PageLayoutProps) {
  const [copied, setCopied] = React.useState(false);
  const [headings, setHeadings] = React.useState<{ id: string; text: string; level: number }[]>([]);

  // Parse headings from contentHtml for table of contents
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(page.contentHtml, "text/html");
    const hElements = doc.querySelectorAll("h2, h3");
    const extracted: { id: string; text: string; level: number }[] = [];

    hElements.forEach((el, idx) => {
      const text = el.textContent || `Section ${idx + 1}`;
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      extracted.push({
        id: id || `heading-${idx}`,
        text,
        level: el.tagName === "H2" ? 2 : 3,
      });
    });

    setHeadings(extracted);
  }, [page.contentHtml]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const categoryLabels: Record<string, string> = {
    legal: "Legal & Compliance Agreement",
    company: "Company & Operational Policy",
    custom: "Platform Document",
    system: "Core Protocol",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* ── 1. Page Header & Metadata ── */}
      <div className="border-b border-slate-200 pb-8 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-emerald-700 transition">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">{page.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold truncate max-w-xs">{page.title}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="subtle" size="sm" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold uppercase tracking-wider text-[10px]">
                {categoryLabels[page.category] || "Official Policy"}
              </Badge>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {page.readingTimeMinutes || 5} min read
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Last Reviewed: {formatDate(page.lastReviewedAt || page.updatedAt || new Date().toISOString())}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight font-heading leading-tight">
              {page.title}
            </h1>

            {page.metaDescription && (
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-1">
                {page.metaDescription}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
            >
              {copied ? "Link Copied" : "Share"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
              leftIcon={<Printer className="w-3.5 h-3.5 text-slate-500" />}
            >
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Content & Sidebar 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Main Body */}
        <div className="lg:col-span-8 space-y-8">
          <div
            className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-h2:text-2xl prose-h2:font-extrabold prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-slate-900 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2 prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-sm sm:prose-p:text-base prose-li:text-slate-700 prose-li:text-sm sm:prose-li:text-base prose-li:leading-relaxed prose-table:w-full prose-table:border-collapse prose-th:bg-slate-50 prose-th:p-3 prose-th:text-xs prose-th:font-bold prose-th:border prose-th:border-slate-200 prose-td:p-3 prose-td:text-xs prose-td:border prose-td:border-slate-200 prose-blockquote:border-l-4 prose-blockquote:border-emerald-600 prose-blockquote:bg-emerald-50/50 prose-blockquote:p-4 prose-blockquote:rounded-r-2xl prose-blockquote:text-slate-800 prose-blockquote:font-normal prose-blockquote:text-sm prose-strong:text-slate-950 prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />

          {/* Verification Badge Footer */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-slate-900 block font-bold text-sm">
                  Verified Platform Agreement
                </strong>
                <span className="text-slate-500">
                  Maintained by Sabina Edge Legal & Compliance Department
                </span>
              </div>
            </div>

            <Link href="/contact">
              <Button variant="outline" size="sm" className="font-bold text-xs bg-white text-slate-800 border-slate-200">
                Contact Legal Team
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Sidebar (Table of Contents & Quick Links) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Table of Contents */}
          {headings.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Table of Contents
              </h3>

              <nav className="space-y-1.5 text-xs">
                {headings.map((h, idx) => (
                  <a
                    key={idx}
                    href={`#${h.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = Array.from(document.querySelectorAll("h2, h3"))[idx];
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className={`block py-1 text-slate-600 hover:text-emerald-700 hover:font-bold transition-all truncate ${
                      h.level === 3 ? "pl-3 text-[11px] text-slate-500" : "font-medium"
                    }`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Related Legal & Company Policies */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Related Platform Policies
            </h3>

            <div className="space-y-2 text-xs">
              <Link
                href="/terms"
                className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                  page.slug === "terms"
                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>Terms of Service</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/privacy"
                className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                  page.slug === "privacy"
                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>Privacy Policy (GDPR)</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/cookies"
                className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                  page.slug === "cookies"
                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>Cookie Policy</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/refund-policy"
                className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                  page.slug === "refund-policy"
                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>Refund Policy & 100% Guarantee</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/about"
                className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                  page.slug === "about"
                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>About Sabina Edge</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/contact"
                className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                  page.slug === "contact"
                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>Contact Support</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Need Assistance Card */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-card space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
              <HelpCircle className="w-4 h-4" />
              <span>Questions & Assistance</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Need clarification regarding platform policies, refund mediation, or data rights?
            </p>
            <Link href="/contact" className="block pt-1">
              <Button size="sm" variant="default" className="w-full font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs">
                Contact Support Team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
