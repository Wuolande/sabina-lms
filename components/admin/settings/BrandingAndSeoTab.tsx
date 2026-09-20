"use client";

import * as React from "react";
import Image from "next/image";
import {
  Palette,
  Sparkles,
  Trash2,
  Globe,
  Share2,
  Search,
  Smartphone,
  Laptop,
  ExternalLink,
  Tag,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";
import { FileUploadWithLink } from "@/components/ui/FileUploadWithLink";

export interface BrandingSeoState {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  appleTouchIconUrl: string;
  ogImageUrl: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  googleSiteVerification: string;
  bingSiteVerification: string;
  twitterHandle: string;
  allowIndexing: boolean;
}

interface BrandingAndSeoTabProps {
  state: BrandingSeoState;
  onChange: (updates: Partial<BrandingSeoState>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  onResetLogo: () => Promise<void>;
}

export function BrandingAndSeoTab({
  state,
  onChange,
  onSave,
  saving,
  onResetLogo,
}: BrandingAndSeoTabProps) {
  const [ogPreviewTab, setOgPreviewTab] = React.useState<"google" | "social" | "twitter">("google");
  const [googleDevice, setGoogleDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [keywordInput, setKeywordInput] = React.useState("");

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (!trimmed) return;
    if (state.keywords.includes(trimmed)) {
      setKeywordInput("");
      return;
    }
    onChange({ keywords: [...state.keywords, trimmed] });
    setKeywordInput("");
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    onChange({
      keywords: state.keywords.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const handleKeyDownKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  // Character counters
  const titleLen = state.metaTitle.length;
  const descLen = state.metaDescription.length;

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-brand-50 text-brand">
                <Palette className="h-5 w-5" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wider font-heading">
                Platform Branding, SEO &amp; Asset Management Studio
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Control your brand identity, favicon, social share previews, and technical SEO metadata. All changes update across search engines, browser tabs, and public pages.
            </p>
          </div>

          <Button
            type="button"
            variant="default"
            size="default"
            onClick={onSave}
            disabled={saving}
            className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs shadow-sm shrink-0 cursor-pointer"
            leftIcon={<Sparkles className="h-4 w-4 text-amber-400" />}
          >
            {saving ? "Saving Changes..." : "Save Branding & SEO"}
          </Button>
        </div>

        {/* ─── SECTION 1: Brand Logo & Theme Colors ─── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">1</span>
              Platform Logo &amp; Brand Colors
            </h4>
            {state.logoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onResetLogo}
                disabled={saving}
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Reset to Default Wordmark
              </Button>
            )}
          </div>

          {/* Logo Specs & Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-4">
              <FileUploadWithLink
                label="Upload or Link Brand Logo"
                description="Upload a transparent PNG/SVG or paste a CDN URL. Scaled dynamically across public & portal headers."
                value={state.logoUrl}
                endpoint="/api/upload/logo"
                onChange={(newUrl) => onChange({ logoUrl: newUrl })}
                type="image"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                maxSizeBytes={5 * 1024 * 1024}
                placeholder="https://res.cloudinary.com/.../logo.png"
              />

              {/* Color Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Primary Color</span>
                    <div className="h-6 w-6 rounded-md border border-slate-200 shadow-2xs" style={{ backgroundColor: state.primaryColor }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={state.primaryColor}
                      onChange={(e) => onChange({ primaryColor: e.target.value })}
                      className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <Input
                      value={state.primaryColor}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange({ primaryColor: v });
                      }}
                      placeholder="#14209C"
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Accent / Secondary</span>
                    <div className="h-6 w-6 rounded-md border border-slate-200 shadow-2xs" style={{ backgroundColor: state.secondaryColor }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={state.secondaryColor}
                      onChange={(e) => onChange({ secondaryColor: e.target.value })}
                      className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <Input
                      value={state.secondaryColor}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange({ secondaryColor: v });
                      }}
                      placeholder="#F9C31C"
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs space-y-3">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Logo Best Practices:
              </span>
              <ul className="space-y-2 text-[11px] text-indigo-900/80 list-disc list-inside">
                <li><strong className="text-indigo-950">Dimensions:</strong> 400 × 120 px landscape or 512 × 512 px square.</li>
                <li><strong className="text-indigo-950">Background:</strong> Transparent PNG or vector SVG works best on both light &amp; dark surfaces.</li>
                <li><strong className="text-indigo-950">Emails:</strong> Automatically centered and rendered in transactional headers.</li>
              </ul>
            </div>
          </div>

          {/* Multi-surface preview */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Live Multi-Surface Logo Render
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Public Header</span>
                <div className="h-14 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100">
                  <Logo size="default" href={undefined} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2 text-white">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Dark Sidebar</span>
                <div className="h-14 flex items-center px-3 rounded-lg bg-slate-900 border border-slate-800">
                  <Logo size="sm" variant="dark" href={undefined} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Auth Screen</span>
                <div className="h-14 flex items-center justify-center px-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <Logo size="default" href={undefined} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 overflow-hidden" style={{ backgroundColor: state.primaryColor }}>
                <span className="text-[10px] font-bold uppercase text-white/90 block">Email Header</span>
                <div className="h-14 flex items-center justify-center px-3">
                  <div className="bg-white px-3 py-1 rounded-lg shadow-xs border border-white/40 flex items-center justify-center">
                    <Logo size="sm" href={undefined} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: Browser Favicon & Apple Touch Icon ─── */}
        <div className="space-y-6 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">2</span>
            Browser Favicon &amp; Apple Touch / PWA Icon
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Favicon Card & Browser Tab Simulator */}
            <div className="p-5 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Browser Tab Favicon</h5>
                  <p className="text-[11px] text-slate-500">Displayed in Chrome, Safari, Firefox &amp; Edge tabs</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">32×32 / 48×48 px</Badge>
              </div>

              <FileUploadWithLink
                label="Favicon Asset (PNG, ICO, or SVG)"
                description="Square icon recommended. Auto-crops to 32×32."
                value={state.faviconUrl}
                endpoint="/api/upload/logo"
                onChange={(newUrl) => onChange({ faviconUrl: newUrl })}
                type="image"
                accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/webp"
                maxSizeBytes={2 * 1024 * 1024}
                placeholder="https://.../favicon.png"
              />

              {/* Live Chrome Tab Simulator */}
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">Live Browser Tab Mock</span>
                <div className="rounded-xl border border-slate-300/80 bg-slate-200/60 p-2 pb-0">
                  {/* Browser Chrome Header */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 pl-2">Browser Window</div>
                  </div>

                  {/* Tab */}
                  <div className="bg-white rounded-t-xl px-3.5 py-2 flex items-center gap-2 max-w-[240px] shadow-xs border-t border-x border-slate-200">
                    <div className="w-4 h-4 rounded shrink-0 overflow-hidden flex items-center justify-center bg-slate-100">
                      {state.faviconUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={state.faviconUrl} alt="Favicon" className="w-4 h-4 object-contain" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded bg-brand flex items-center justify-center text-[8px] text-amber-300 font-black">
                          S
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {state.metaTitle.split("|")[0].trim() || "Sabina Edge"}
                    </span>
                    <X className="h-3 w-3 text-slate-400 ml-auto shrink-0 hover:text-slate-600 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* Apple Touch Icon & iOS Simulator */}
            <div className="p-5 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Apple Touch &amp; PWA Icon</h5>
                  <p className="text-[11px] text-slate-500">Saved to iPhone, iPad &amp; Android home screens</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">180×180 px</Badge>
              </div>

              <FileUploadWithLink
                label="Apple Touch Icon (180×180 PNG)"
                description="High-resolution square graphic with no rounded corners (iOS applies curvature)."
                value={state.appleTouchIconUrl}
                endpoint="/api/upload/logo"
                onChange={(newUrl) => onChange({ appleTouchIconUrl: newUrl })}
                type="image"
                accept="image/png,image/webp,image/jpeg"
                maxSizeBytes={2 * 1024 * 1024}
                placeholder="https://.../apple-touch-icon.png"
              />

              {/* Live iOS Home Screen Simulator */}
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">Live iOS Home Screen Mock</span>
                <div className="rounded-xl border border-slate-300/80 bg-gradient-to-b from-slate-800 to-slate-950 p-4 text-center flex flex-col items-center justify-center">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-[18px] overflow-hidden shadow-xl border border-white/20 flex items-center justify-center bg-brand">
                      {state.appleTouchIconUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={state.appleTouchIconUrl} alt="Apple Icon" className="w-full h-full object-cover" />
                      ) : state.faviconUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={state.faviconUrl} alt="Apple Icon" className="w-10 h-10 object-contain" />
                      ) : (
                        <div className="text-xl font-black text-amber-400 font-heading">S</div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-white/95 mt-2 tracking-tight drop-shadow-xs">
                    Sabina
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 3: Open Graph (OG) & Social Card Studio ─── */}
        <div className="space-y-6 pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">3</span>
                Open Graph (OG) &amp; Social Share Card Studio
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Visual card displayed when links are shared on Google Search, LinkedIn, Facebook, Twitter/X, and WhatsApp.
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono shrink-0">
              1200 × 630 px (1.91:1)
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Upload Zone */}
            <div className="lg:col-span-5 space-y-4">
              <FileUploadWithLink
                label="Default Social Share Image (OG Image)"
                description="High-resolution banner (1200×630 PNG, JPG, WebP up to 5MB)."
                value={state.ogImageUrl}
                endpoint="/api/upload/logo"
                onChange={(newUrl) => onChange({ ogImageUrl: newUrl })}
                type="image"
                accept="image/png,image/jpeg,image/webp"
                maxSizeBytes={5 * 1024 * 1024}
                placeholder="https://.../og-banner.png"
              />

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1 text-amber-950">
                  <Share2 className="h-3.5 w-3.5 text-amber-600" />
                  Social Scraper Tip:
                </p>
                <p>
                  Place key text and logos within the central 1000×500 px area so critical messaging is never cropped on mobile messaging apps.
                </p>
              </div>
            </div>

            {/* Live Interactive Previewer */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Live Social &amp; Search Engine Card Simulator
                </span>

                {/* Preview selector tabs */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setOgPreviewTab("google")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      ogPreviewTab === "google" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => setOgPreviewTab("social")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      ogPreviewTab === "social" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Facebook/LinkedIn
                  </button>
                  <button
                    type="button"
                    onClick={() => setOgPreviewTab("twitter")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      ogPreviewTab === "twitter" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Twitter / X
                  </button>
                </div>
              </div>

              {/* Preview 1: Google Search Result */}
              {ogPreviewTab === "google" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Google SERP Preview</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setGoogleDevice("desktop")}
                        className={`text-[10px] font-bold flex items-center gap-1 ${
                          googleDevice === "desktop" ? "text-blue-600" : "text-slate-400"
                        }`}
                      >
                        <Laptop className="h-3 w-3" /> Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoogleDevice("mobile")}
                        className={`text-[10px] font-bold flex items-center gap-1 ${
                          googleDevice === "mobile" ? "text-blue-600" : "text-slate-400"
                        }`}
                      >
                        <Smartphone className="h-3 w-3" /> Mobile
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {/* Site Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {state.faviconUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={state.faviconUrl} alt="Favicon" className="w-3.5 h-3.5 object-contain" />
                        ) : (
                          <Globe className="h-3 w-3 text-slate-400" />
                        )}
                      </div>
                      <div className="flex flex-col leading-none">
                        <span className="text-[12px] font-semibold text-slate-900">Sabina Education</span>
                        <span className="text-[10px] text-slate-500">https://sabina.education</span>
                      </div>
                    </div>

                    {/* Blue Title */}
                    <h5 className="text-[#1a0dab] hover:underline text-base sm:text-lg font-medium cursor-pointer pt-1 leading-snug line-clamp-1">
                      {state.metaTitle || "Sabina Edge | Premium 1-on-1 Online Tutoring"}
                    </h5>

                    {/* Meta Description */}
                    <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                      {state.metaDescription || "Connect with certified, elite private tutors for 1-on-1 live video lessons in languages, STEM, coding, and exam prep."}
                    </p>
                  </div>
                </div>
              )}

              {/* Preview 2: Facebook / LinkedIn Card */}
              {ogPreviewTab === "social" && (
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs animate-fade-in">
                  <div className="h-44 sm:h-52 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {state.ogImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={state.ogImageUrl} alt="OG Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-brand text-white p-6 text-center">
                        <Logo size="lg" variant="dark" href={undefined} />
                        <p className="text-xs text-white/80 mt-2 font-medium">1200 × 630 Social Banner</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      SABINA.EDUCATION
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 line-clamp-1 leading-snug">
                      {state.metaTitle || "Sabina Edge | Premium 1-on-1 Online Tutoring"}
                    </h5>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {state.metaDescription}
                    </p>
                  </div>
                </div>
              )}

              {/* Preview 3: Twitter / X Card */}
              {ogPreviewTab === "twitter" && (
                <div className="rounded-2xl border border-slate-300/80 bg-white overflow-hidden shadow-2xs animate-fade-in">
                  <div className="h-44 sm:h-52 w-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    {state.ogImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={state.ogImageUrl} alt="Twitter Card" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-brand text-white p-6 text-center">
                        <Logo size="lg" variant="dark" href={undefined} />
                        <p className="text-xs text-white/80 mt-2 font-medium">Summary Large Image Card</p>
                      </div>
                    )}
                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-bold text-white tracking-wide">
                      sabina.education
                    </div>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h5 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {state.metaTitle || "Sabina Edge | Premium 1-on-1 Online Tutoring"}
                    </h5>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {state.metaDescription}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 block pt-1">
                      By {state.twitterHandle || "@SabinaLMS"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── SECTION 4: Search Engine Metadata & Crawler Directives ─── */}
        <div className="space-y-6 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">4</span>
            Search Engine Metadata &amp; Crawler Indexing
          </h4>

          {/* Meta Title with Gauge */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Default Meta Title
              </label>
              <span className={`text-[11px] font-bold font-mono ${
                titleLen >= 50 && titleLen <= 60 ? "text-emerald-600" : titleLen > 60 ? "text-rose-500" : "text-amber-600"
              }`}>
                {titleLen} / 60 chars (Recommended: 50–60)
              </span>
            </div>
            <Input
              value={state.metaTitle}
              onChange={(e) => onChange({ metaTitle: e.target.value })}
              placeholder="Sabina Edge | Premium 1-on-1 Online Tutoring & Live Classroom"
              className="text-sm"
            />
            <p className="text-[11px] text-slate-500">
              The primary title tag rendered in browser tabs, bookmarks, and search results.
            </p>
          </div>

          {/* Meta Description with Gauge */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Default Meta Description
              </label>
              <span className={`text-[11px] font-bold font-mono ${
                descLen >= 140 && descLen <= 160 ? "text-emerald-600" : descLen > 160 ? "text-rose-500" : "text-amber-600"
              }`}>
                {descLen} / 160 chars (Recommended: 140–160)
              </span>
            </div>
            <textarea
              rows={3}
              value={state.metaDescription}
              onChange={(e) => onChange({ metaDescription: e.target.value })}
              placeholder="Connect with certified, elite private tutors for 1-on-1 live video lessons in languages, STEM, coding, and exam prep."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-900 focus:border-brand focus:outline-hidden focus:ring-1 focus:ring-brand leading-relaxed"
            />
            <p className="text-[11px] text-slate-500">
              Summary snippet displayed beneath your page title in Google and Bing search results.
            </p>
          </div>

          {/* Keywords Tag Manager */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Search Keywords &amp; Meta Tags ({state.keywords.length})
            </label>
            <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 min-h-[52px]">
              {state.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs"
                >
                  <Tag className="h-3 w-3 text-brand" />
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(idx)}
                    className="h-3.5 w-3.5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1 ml-auto w-full sm:w-auto mt-1 sm:mt-0">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeyDownKeyword}
                  placeholder="Add keyword + Enter..."
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-brand w-full sm:w-44"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddKeyword}
                  className="h-7 px-2 border-slate-200 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Verification Tokens & Social Handles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Google Search Console Token
              </label>
              <Input
                value={state.googleSiteVerification}
                onChange={(e) => onChange({ googleSiteVerification: e.target.value })}
                placeholder="google-site-verification token..."
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400">Injected as &lt;meta name=&quot;google-site-verification&quot;&gt;</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Bing Webmaster Token
              </label>
              <Input
                value={state.bingSiteVerification}
                onChange={(e) => onChange({ bingSiteVerification: e.target.value })}
                placeholder="msvalidate.01 token..."
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400">Injected as &lt;meta name=&quot;msvalidate.01&quot;&gt;</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Twitter / X Brand Handle
              </label>
              <Input
                value={state.twitterHandle}
                onChange={(e) => onChange({ twitterHandle: e.target.value })}
                placeholder="@SabinaLMS"
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400">Creator &amp; Site attribute in Twitter cards</p>
            </div>
          </div>

          {/* Crawler Indexing Toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Search Engine Indexing Control
                </span>
                {state.allowIndexing ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    Production (Indexed)
                  </Badge>
                ) : (
                  <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                    Private / Staging (Noindex)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {state.allowIndexing
                  ? "Crawlers are permitted to index public routes, tutor profiles, and blogs."
                  : "Robots are strictly disallowed via robots.txt and noindex meta tags."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-slate-700">
                {state.allowIndexing ? "Indexing Enabled" : "Indexing Blocked"}
              </span>
              <button
                type="button"
                onClick={() => onChange({ allowIndexing: !state.allowIndexing })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  state.allowIndexing ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    state.allowIndexing ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Quick Technical SEO Links */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <FileCode className="h-4 w-4 text-brand" />
              Live Technical SEO Endpoints:
            </span>
            <div className="flex items-center gap-3">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
              >
                <span>/sitemap.xml</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-slate-300">•</span>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
              >
                <span>/robots.txt</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-slate-300">•</span>
              <a
                href="/manifest.webmanifest"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
              >
                <span>/manifest.webmanifest</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-medium">
            Next.js ISR cache automatically purges on save so meta updates propagate instantly.
          </p>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={onSave}
            disabled={saving}
            className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs shadow-sm cursor-pointer"
            leftIcon={<Sparkles className="h-4 w-4 text-amber-400" />}
          >
            {saving ? "Saving Changes..." : "Save Branding & SEO"}
          </Button>
        </div>
      </div>
    </div>
  );
}
