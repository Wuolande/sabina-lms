"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutTemplate,
  Save,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Layers,
  BarChart3,
  Video,
  ListOrdered,
  HelpCircle,
  Briefcase,
  Type,
  Image as ImageIcon,
  Check,
  RefreshCw,
  FileText,
  ShieldCheck,
  Building,
  Globe,
  Edit3,
  Eye,
  ArrowLeft,
  Clock,
  Calendar,
  Lock,
  Search,
  MessageSquare,
  DollarSign,
  ChevronDown,
  Monitor,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { FileUploadWithLink } from "@/components/ui/FileUploadWithLink";
import { useModal } from "@/components/ui/modal-context";
import { adminService } from "@/services/adminService";
import { RichTextEditor } from "@/components/cms/RichTextEditor";
import { formatDate } from "@/lib/utils";

function AdminCMSDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "homepage";
  const { toast } = useModal();

  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [selectedHomeSection, setSelectedHomeSection] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // ── Pages State ──
  const [pages, setPages] = React.useState<any[]>([]);
  const [editingPage, setEditingPage] = React.useState<any | null>(null);

  // ── Notification Modals State ──
  const [isHomepageSaveModalOpen, setIsHomepageSaveModalOpen] = React.useState(false);
  const [isPageSaveModalOpen, setIsPageSaveModalOpen] = React.useState(false);
  const [deleteConfirmPage, setDeleteConfirmPage] = React.useState<any | null>(null);

  // ── New Page Modal State ──
  const [isNewPageModalOpen, setIsNewPageModalOpen] = React.useState(false);
  const [newPageSlug, setNewPageSlug] = React.useState("");
  const [newPageTitle, setNewPageTitle] = React.useState("");
  const [newPageCategory, setNewPageCategory] = React.useState("custom");

  // ── 1. Hero Section State ──
  const [heroPretitle, setHeroPretitle] = React.useState("YOUR JOURNEY BEGINS HERE");
  const [typewriterHeadlines, setTypewriterHeadlines] = React.useState<string[]>([]);
  const [newHeadline, setNewHeadline] = React.useState("");
  const [heroSubheading, setHeroSubheading] = React.useState("");
  const [searchPlaceholder, setSearchPlaceholder] = React.useState("");
  const [popularTags, setPopularTags] = React.useState<{ label: string; slug: string }[]>([]);
  const [newTagLabel, setNewTagLabel] = React.useState("");
  const [newTagSlug, setNewTagSlug] = React.useState("");
  const [socialProofCount, setSocialProofCount] = React.useState("+2,000 students worldwide");
  const [socialProofRating, setSocialProofRating] = React.useState("5.0");
  const [heroStudentImage, setHeroStudentImage] = React.useState("");
  const [card1Value, setCard1Value] = React.useState(20);
  const [card1Label, setCard1Label] = React.useState("Creative Subjects");
  const [card2Value, setCard2Value] = React.useState(10);
  const [card2Label, setCard2Label] = React.useState("Students");
  const [card3Value, setCard3Value] = React.useState(480);
  const [card3Label, setCard3Label] = React.useState("Hours Course Time");

  // ── 2. Stats Section State ──
  const [stat1Value, setStat1Value] = React.useState(250);
  const [stat1Suffix, setStat1Suffix] = React.useState("+");
  const [stat1Label, setStat1Label] = React.useState("Verified Instructors");

  const [stat2Value, setStat2Value] = React.useState(15000);
  const [stat2Suffix, setStat2Suffix] = React.useState("+");
  const [stat2Label, setStat2Label] = React.useState("Enrolled Students");

  const [stat3Value, setStat3Value] = React.useState(98.9);
  const [stat3Suffix, setStat3Suffix] = React.useState("%");
  const [stat3Label, setStat3Label] = React.useState("Lesson Success Rate");

  const [stat4Value, setStat4Value] = React.useState(4.98);
  const [stat4Suffix, setStat4Suffix] = React.useState(" ★");
  const [stat4Label, setStat4Label] = React.useState("Average Student Rating");

  // ── 3. Categories Section State ──
  const [catPretitle, setCatPretitle] = React.useState("POPULAR CATEGORIES");
  const [catTitle, setCatTitle] = React.useState("Find the perfect tutor for your subject");
  const [catCtaText, setCatCtaText] = React.useState("View All 16+ Disciplines");

  // ── 4. Featured Tutors Section State ──
  const [tutPretitle, setTutPretitle] = React.useState("VERIFIED EDUCATORS");
  const [tutTitle, setTutTitle] = React.useState("Learn 1-on-1 with accredited tutors");
  const [tutCtaText, setTutCtaText] = React.useState("View All Tutors");

  // ── 5. Classroom Tour Section State ──
  const [tourBadge, setTourBadge] = React.useState("In-Browser Live LMS • Zero Downloads");
  const [tourTitle, setTourTitle] = React.useState("A live video classroom built for mastery.");
  const [tourSubtitle, setTourSubtitle] = React.useState("");

  // ── 6. How It Works Section State ──
  const [howPretitle, setHowPretitle] = React.useState("HOW IT WORKS");
  const [howTitle, setHowTitle] = React.useState("Simple 3-step learning journey");
  const [step1Title, setStep1Title] = React.useState("Discover Your Tutor");
  const [step1Desc, setStep1Desc] = React.useState("");
  const [step2Title, setStep2Title] = React.useState("Book in Your Timezone");
  const [step2Desc, setStep2Desc] = React.useState("");
  const [step3Title, setStep3Title] = React.useState("Learn Live & Level Up");
  const [step3Desc, setStep3Desc] = React.useState("");

  // ── 7. Become a Tutor Section State ──
  const [tutorBadge, setTutorBadge] = React.useState("Join Our Global Teaching Faculty");
  const [tutorHeadline, setTutorHeadline] = React.useState("Teach what you love. Earn $40 – $120 / hr.");
  const [tutorSubtitle, setTutorSubtitle] = React.useState("");
  const [tutorRateRange, setTutorRateRange] = React.useState("$40 – $120 / hr");
  const [bullet1, setBullet1] = React.useState("Keep 85% of your earnings");
  const [bullet2, setBullet2] = React.useState("100% flexible schedule");
  const [bullet3, setBullet3] = React.useState("Browser video classroom included");
  const [tutorCta, setTutorCta] = React.useState("Apply as a Tutor");
  const [tutorSecondary, setTutorSecondary] = React.useState("How It Works for Tutors");

  // ── 8. FAQs Section State ──
  const [faqPretitle, setFaqPretitle] = React.useState("COMMON QUESTIONS");
  const [faqTitle, setFaqTitle] = React.useState("Frequently Asked Questions");
  const [faqs, setFaqs] = React.useState<{ q: string; a: string }[]>([]);

  // ── Load All CMS Data ──
  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [cmsData, pagesList] = await Promise.all([
        adminService.getHomepageCMS(),
        adminService.getCMSPages(),
      ]);

      setPages(pagesList || []);

      if (cmsData) {
        // Hero
        const h = cmsData.heroSection || {};
        setHeroPretitle(h.pretitle || "YOUR JOURNEY BEGINS HERE");
        setTypewriterHeadlines(h.typewriterHeadlines || [
          "Grow Your Knowledge with Leading Online Courses",
          "Master Any Language with Native 1-on-1 Tutors",
          "Ace Your STEM Exams with Certified Professors",
        ]);
        setHeroSubheading(h.subheading || "");
        setSearchPlaceholder(h.searchPlaceholder || "Search subject, language or goal...");
        setPopularTags(h.popularTags || [
          { label: "English", slug: "english" },
          { label: "Calculus", slug: "mathematics" },
          { label: "Python", slug: "python-data-science" },
          { label: "IELTS Prep", slug: "ielts-toefl-prep" },
        ]);
        setSocialProofCount(h.socialProofCount || "+2,000 students worldwide");
        setSocialProofRating(h.socialProofRating || "5.0");
        setHeroStudentImage(h.heroStudentImage || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=700");
        setCard1Value(h.floatingCard1?.value ?? 20);
        setCard1Label(h.floatingCard1?.label || "Creative Subjects");
        setCard2Value(h.floatingCard2?.value ?? 10);
        setCard2Label(h.floatingCard2?.label || "Students");
        setCard3Value(h.floatingCard3?.value ?? 480);
        setCard3Label(h.floatingCard3?.label || "Hours Course Time");

        // Stats
        const s = cmsData.statsSection || {};
        setStat1Value(s.stat1?.value ?? 250);
        setStat1Suffix(s.stat1?.suffix || "+");
        setStat1Label(s.stat1?.label || "Verified Instructors");

        setStat2Value(s.stat2?.value ?? 15000);
        setStat2Suffix(s.stat2?.suffix || "+");
        setStat2Label(s.stat2?.label || "Enrolled Students");

        setStat3Value(s.stat3?.value ?? 98.9);
        setStat3Suffix(s.stat3?.suffix || "%");
        setStat3Label(s.stat3?.label || "Lesson Success Rate");

        setStat4Value(s.stat4?.value ?? 4.98);
        setStat4Suffix(s.stat4?.suffix || " ★");
        setStat4Label(s.stat4?.label || "Average Student Rating");

        // Categories & Tutors
        const c = cmsData.categoriesSection || {};
        setCatPretitle(c.pretitle || "POPULAR CATEGORIES");
        setCatTitle(c.title || "Find the perfect tutor for your subject");
        setCatCtaText(c.ctaText || "View All 16+ Disciplines");

        const t = cmsData.featuredTutorsSection || {};
        setTutPretitle(t.pretitle || "VERIFIED EDUCATORS");
        setTutTitle(t.title || "Learn 1-on-1 with accredited tutors");
        setTutCtaText(t.ctaText || "View All Tutors");

        // Classroom
        const cl = cmsData.classroomTourSection || {};
        setTourBadge(cl.badge || "In-Browser Live LMS • Zero Downloads");
        setTourTitle(cl.title || "A live video classroom built for mastery.");
        setTourSubtitle(cl.subtitle || "Experience sub-50ms HD video, collaborative whiteboard with LaTeX formulas, and synchronized PDF lesson notes — directly in your browser.");

        // How it works
        const hw = cmsData.howItWorksSection || {};
        setHowPretitle(hw.pretitle || "HOW IT WORKS");
        setHowTitle(hw.title || "Simple 3-step learning journey");
        const steps = hw.steps || [];
        setStep1Title(steps[0]?.title || "Discover Your Tutor");
        setStep1Desc(steps[0]?.desc || "Filter by subject specialty, rate, and languages. Watch video introductions to find the right teaching style.");
        setStep2Title(steps[1]?.title || "Book in Your Timezone");
        setStep2Desc(steps[1]?.desc || "Choose a 25-min trial or 50-min standard class. All schedules automatically convert to your local clock.");
        setStep3Title(steps[2]?.title || "Learn Live & Level Up");
        setStep3Desc(steps[2]?.desc || "Enter our browser classroom with HD video, whiteboard, and downloadable notes. Zero software to download.");

        // Become tutor
        const bt = cmsData.becomeTutorSection || {};
        setTutorBadge(bt.badge || "Join Our Global Teaching Faculty");
        setTutorHeadline(bt.title || "Teach what you love. Earn $40 – $120 / hr.");
        setTutorSubtitle(bt.subtitle || "Set your own hourly rate, teach motivated 1-on-1 students globally from home, and receive reliable automated weekly payouts. Zero upfront costs.");
        setTutorRateRange(bt.rateRange || "$40 – $120 / hr");
        const bullets = bt.bulletPoints || [];
        setBullet1(bullets[0] || "Keep 85% of your earnings");
        setBullet2(bullets[1] || "100% flexible schedule");
        setBullet3(bullets[2] || "Browser video classroom included");
        setTutorCta(bt.ctaButtonText || "Apply as a Tutor");
        setTutorSecondary(bt.secondaryButtonText || "How It Works for Tutors");

        // FAQs
        const f = cmsData.faqSection || {};
        setFaqPretitle(f.pretitle || "COMMON QUESTIONS");
        setFaqTitle(f.title || "Frequently Asked Questions");
        setFaqs(f.faqs || [
          { q: "How does 1-on-1 online tutoring work on Sabina Edge?", a: "You browse verified tutors by subject, specialty, price, and language..." },
          { q: "What is the 100% Satisfaction Guarantee?", a: "If you are not completely satisfied with your first trial lesson..." },
        ]);
      }
    } catch {
      toast({ title: "Error", message: "Failed to load CMS data.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Open Page Editor ──
  const handleOpenEditor = async (pageSlug: string) => {
    setLoading(true);
    try {
      const fullPage = await adminService.getCMSPage(pageSlug);
      if (fullPage) {
        setEditingPage(fullPage);
        setActiveTab("editor");
      }
    } catch {
      toast({ title: "Error", message: "Failed to load page content.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  // ── Save Single Page in Editor ──
  const handleSavePage = async () => {
    if (!editingPage) return;
    setSaving(true);
    try {
      const res = await adminService.saveCMSPage(editingPage);
      setIsPageSaveModalOpen(true);
      toast({
        title: "Page Published Live",
        message: `Page "${editingPage.title}" has been saved and published.`,
        variant: "success",
      });
      loadData();
    } catch {
      toast({ title: "Error", message: "Failed to save page.", variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  // ── Create New Page ──
  const handleCreateNewPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageSlug.trim() || !newPageTitle.trim()) return;

    setSaving(true);
    try {
      const payload = {
        slug: newPageSlug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "-"),
        title: newPageTitle.trim(),
        category: newPageCategory,
        metaTitle: `${newPageTitle.trim()} | Sabina Edge`,
        metaDescription: `Read about ${newPageTitle.trim()} on Sabina Edge.`,
        contentHtml: `<h2>${newPageTitle.trim()}</h2><p>Start editing content here...</p>`,
        isPublished: true,
        readingTimeMinutes: 4,
      };

      const created = await adminService.saveCMSPage(payload);
      setIsNewPageModalOpen(false);
      setNewPageSlug("");
      setNewPageTitle("");
      toast({ title: "Page Created", message: "New custom page created successfully.", variant: "success" });
      await loadData();
      if (created?.slug) {
        handleOpenEditor(created.slug);
      }
    } catch {
      toast({ title: "Error", message: "Failed to create new page.", variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Custom Page ──
  const handleDeletePage = (pageOrId: any, maybeTitle?: string) => {
    if (typeof pageOrId === "string") {
      setDeleteConfirmPage({ id: pageOrId, title: maybeTitle || "this page" });
    } else {
      setDeleteConfirmPage(pageOrId);
    }
  };

  const confirmDeletePage = async () => {
    if (!deleteConfirmPage) return;
    try {
      const ok = await adminService.deleteCMSPage(deleteConfirmPage.id);
      toast({ title: "Page Deleted", message: `Page "${deleteConfirmPage.title}" has been removed.`, variant: "success" });
      setDeleteConfirmPage(null);
      loadData();
      if (editingPage?.id === deleteConfirmPage.id) {
        setEditingPage(null);
        setActiveTab("custom");
      }
    } catch {
      toast({ title: "Error", message: "Failed to delete page.", variant: "danger" });
    }
  };

  // ── Save All 8 Homepage Sections ──
  const handleSaveHomepage = async () => {
    setSaving(true);
    try {
      const payload = {
        heroSection: {
          pretitle: heroPretitle,
          typewriterHeadlines,
          subheading: heroSubheading,
          searchPlaceholder,
          popularTags,
          socialProofCount,
          socialProofRating,
          heroStudentImage,
          floatingCard1: { value: Number(card1Value), suffix: "+", label: card1Label },
          floatingCard2: { value: Number(card2Value), suffix: "k+", label: card2Label },
          floatingCard3: { value: Number(card3Value), suffix: "+", label: card3Label },
        },
        statsSection: {
          stat1: { value: Number(stat1Value), suffix: stat1Suffix, decimals: 0, label: stat1Label },
          stat2: { value: Number(stat2Value), suffix: stat2Suffix, decimals: 0, label: stat2Label },
          stat3: { value: Number(stat3Value), suffix: stat3Suffix, decimals: 1, label: stat3Label },
          stat4: { value: Number(stat4Value), suffix: stat4Suffix, decimals: 2, label: stat4Label },
        },
        categoriesSection: { pretitle: catPretitle, title: catTitle, ctaText: catCtaText },
        featuredTutorsSection: { pretitle: tutPretitle, title: tutTitle, ctaText: tutCtaText },
        classroomTourSection: { badge: tourBadge, title: tourTitle, subtitle: tourSubtitle },
        howItWorksSection: {
          pretitle: howPretitle,
          title: howTitle,
          steps: [
            { num: "01", title: step1Title, desc: step1Desc },
            { num: "02", title: step2Title, desc: step2Desc },
            { num: "03", title: step3Title, desc: step3Desc },
          ],
        },
        becomeTutorSection: {
          badge: tutorBadge,
          title: tutorHeadline,
          subtitle: tutorSubtitle,
          rateRange: tutorRateRange,
          bulletPoints: [bullet1, bullet2, bullet3],
          ctaButtonText: tutorCta,
          secondaryButtonText: tutorSecondary,
        },
        faqSection: { pretitle: faqPretitle, title: faqTitle, faqs },
      };

      await adminService.updateHomepageCMS(payload);
      setIsHomepageSaveModalOpen(true);
      toast({ title: "Homepage CMS Published", message: "All 8 sections published live to the homepage.", variant: "success" });
    } catch {
      toast({ title: "Error", message: "Failed to save homepage CMS.", variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const legalPages = pages.filter((p) => p.category === "legal");
  const companyPages = pages.filter((p) => p.category === "company");
  const customPages = pages.filter((p) => p.category === "custom" || p.category === "system");

  const homeSectionsList = [
    { id: "all", label: "All 8 Sections", icon: LayoutTemplate },
    { id: "s1", label: "1. Hero Banner", icon: Type },
    { id: "s2", label: "2. Stats Bar", icon: BarChart3 },
    { id: "s3", label: "3. Categories", icon: Layers },
    { id: "s4", label: "4. Featured Tutors", icon: Briefcase },
    { id: "s5", label: "5. Classroom Tour", icon: Video },
    { id: "s6", label: "6. How It Works", icon: ListOrdered },
    { id: "s7", label: "7. Become a Tutor", icon: Sparkles },
    { id: "s8", label: "8. FAQs Accordion", icon: HelpCircle },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* ── 1. Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
              Enterprise CMS Platform & Content Studio
            </h1>
            <Badge variant="neutral" size="sm" className="bg-amber-50 text-amber-900 border-amber-200 font-bold">
              8-Section Live Engine
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage all 8 sections of the homepage, legal suite (Terms, Privacy, Cookies, Refunds), company pages, and custom URLs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/blogs">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold bg-indigo-50 text-[#14209C] border-indigo-200 hover:bg-indigo-100 shadow-xs"
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              Blog & Articles
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewPageModalOpen(true)}
            className="text-xs font-bold bg-white text-slate-800 border-slate-200 shadow-xs"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create New Page
          </Button>

          {activeTab === "homepage" && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveHomepage}
              disabled={saving}
              className="font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs shadow-sm"
              leftIcon={<Save className="h-4 w-4" />}
            >
              {saving ? "Publishing..." : "Publish All 8 Sections"}
            </Button>
          )}

          {activeTab === "editor" && editingPage && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSavePage}
              disabled={saving}
              className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-sm"
              leftIcon={<Save className="h-4 w-4" />}
            >
              {saving ? "Saving Page..." : "Save & Publish Page"}
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. Top-Level CMS Navigation Tabs ── */}
      <Tabs
        tabs={[
          { id: "homepage", label: "Homepage (8 Sections)", icon: <LayoutTemplate className="w-4 h-4" /> },
          { id: "legal", label: `Legal Pages (${legalPages.length})`, icon: <ShieldCheck className="w-4 h-4" /> },
          { id: "company", label: `Company & Support (${companyPages.length})`, icon: <Building className="w-4 h-4" /> },
          { id: "custom", label: `Custom Pages (${customPages.length})`, icon: <FileText className="w-4 h-4" /> },
          ...(editingPage ? [{ id: "editor", label: `Editing: ${editingPage.title}`, icon: <Edit3 className="w-4 h-4" /> }] : []),
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="line"
      />

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: HOMEPAGE CMS STUDIO (ALL 8 SECTIONS FULLY PRESENTED)
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "homepage" && (
        <div className="space-y-8">
          {/* Section Filter Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
            {homeSectionsList.map((sec) => {
              const Icon = sec.icon;
              const isSelected = selectedHomeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedHomeSection(sec.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 1: HERO BANNER & HEADLINES
          ───────────────────────────────────────────────────────────── */}
          {(selectedHomeSection === "all" || selectedHomeSection === "s1") && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 font-bold">
                    <Type className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Section 1: Hero Banner, Typewriter Rotator & Floating Widgets
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Top visual hero display on the landing page.</p>
                  </div>
                </div>
                <Link href="/" target="_blank">
                  <Button variant="outline" size="sm" className="text-xs font-bold" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Preview Live Hero
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pre-Title Tag
                  </label>
                  <Input value={heroPretitle} onChange={(e) => setHeroPretitle(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Typewriter Rotating Headlines ({typewriterHeadlines.length})
                  </label>
                  <div className="space-y-2">
                    {typewriterHeadlines.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 w-6">#{idx + 1}</span>
                        <Input
                          value={h}
                          onChange={(e) => {
                            const updated = [...typewriterHeadlines];
                            updated[idx] = e.target.value;
                            setTypewriterHeadlines(updated);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setTypewriterHeadlines(typewriterHeadlines.filter((_, i) => i !== idx))}
                          className="p-2 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        placeholder="Add new typewriter headline phrase..."
                        value={newHeadline}
                        onChange={(e) => setNewHeadline(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (newHeadline.trim()) {
                            setTypewriterHeadlines([...typewriterHeadlines, newHeadline.trim()]);
                            setNewHeadline("");
                          }
                        }}
                        className="text-xs font-bold shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Phrase
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hero Subheading
                  </label>
                  <textarea
                    rows={2}
                    value={heroSubheading}
                    onChange={(e) => setHeroSubheading(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Search Bar Placeholder
                  </label>
                  <Input value={searchPlaceholder} onChange={(e) => setSearchPlaceholder(e.target.value)} />
                </div>

                <div>
                  <FileUploadWithLink
                    label="Hero Banner Student Image"
                    description="Upload visual photo to Cloudinary or paste direct image URL. Scanned for malware."
                    type="image"
                    value={heroStudentImage}
                    onChange={(url) => setHeroStudentImage(url)}
                    placeholder="https://images.unsplash.com/... or Cloudinary URL"
                  />
                </div>

                {/* Popular Tags */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Popular Quick-Search Tags
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {popularTags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-xs font-bold text-slate-800">
                        <span>{tag.label}</span>
                        <button
                          type="button"
                          onClick={() => setPopularTags(popularTags.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 transition ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Input placeholder="Tag Label (e.g. TOEFL)" value={newTagLabel} onChange={(e) => setNewTagLabel(e.target.value)} />
                    <Input placeholder="Subject Slug (e.g. toefl-prep)" value={newTagSlug} onChange={(e) => setNewTagSlug(e.target.value)} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newTagLabel.trim()) {
                          setPopularTags([...popularTags, { label: newTagLabel.trim(), slug: newTagSlug.trim() || newTagLabel.trim().toLowerCase().replace(/\s+/g, "-") }]);
                          setNewTagLabel("");
                          setNewTagSlug("");
                        }
                      }}
                      className="text-xs font-bold shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Tag
                    </Button>
                  </div>
                </div>

                {/* Floating 3 Widgets */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    3 Floating Geometric Widgets
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Card 1 (Top-Left)</span>
                      <Input type="number" value={card1Value} onChange={(e) => setCard1Value(Number(e.target.value))} />
                      <Input value={card1Label} onChange={(e) => setCard1Label(e.target.value)} />
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Card 2 (Top-Right Gauge)</span>
                      <Input type="number" value={card2Value} onChange={(e) => setCard2Value(Number(e.target.value))} />
                      <Input value={card2Label} onChange={(e) => setCard2Label(e.target.value)} />
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Card 3 (Bottom-Right)</span>
                      <Input type="number" value={card3Value} onChange={(e) => setCard3Value(Number(e.target.value))} />
                      <Input value={card3Label} onChange={(e) => setCard3Label(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SECTION 2: STATS & CREDIBILITY BAR
          ───────────────────────────────────────────────────────────── */}
          {(selectedHomeSection === "all" || selectedHomeSection === "s2") && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 font-bold">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Section 2: Stats & Credibility Bar (Animated CountUp Metrics)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">High-trust counters rendered directly below the hero section.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900">Stat 1</span>
                  <Input type="number" value={stat1Value} onChange={(e) => setStat1Value(Number(e.target.value))} />
                  <Input value={stat1Suffix} onChange={(e) => setStat1Suffix(e.target.value)} placeholder="Suffix" />
                  <Input value={stat1Label} onChange={(e) => setStat1Label(e.target.value)} placeholder="Label" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900">Stat 2</span>
                  <Input type="number" value={stat2Value} onChange={(e) => setStat2Value(Number(e.target.value))} />
                  <Input value={stat2Suffix} onChange={(e) => setStat2Suffix(e.target.value)} placeholder="Suffix" />
                  <Input value={stat2Label} onChange={(e) => setStat2Label(e.target.value)} placeholder="Label" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900">Stat 3 (Decimals)</span>
                  <Input type="number" step="0.1" value={stat3Value} onChange={(e) => setStat3Value(Number(e.target.value))} />
                  <Input value={stat3Suffix} onChange={(e) => setStat3Suffix(e.target.value)} placeholder="Suffix" />
                  <Input value={stat3Label} onChange={(e) => setStat3Label(e.target.value)} placeholder="Label" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900">Stat 4 (Rating)</span>
                  <Input type="number" step="0.01" value={stat4Value} onChange={(e) => setStat4Value(Number(e.target.value))} />
                  <Input value={stat4Suffix} onChange={(e) => setStat4Suffix(e.target.value)} placeholder="Suffix" />
                  <Input value={stat4Label} onChange={(e) => setStat4Label(e.target.value)} placeholder="Label" />
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SECTION 3: POPULAR CATEGORIES & DISCIPLINES
          ───────────────────────────────────────────────────────────── */}
          {(selectedHomeSection === "all" || selectedHomeSection === "s3") && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Section 3: Popular Categories & Disciplines Header
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Title, tag, and explore CTA for subject category grid.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pre-Title Tag
                  </label>
                  <Input value={catPretitle} onChange={(e) => setCatPretitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Main Headline
                  </label>
                  <Input value={catTitle} onChange={(e) => setCatTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    CTA Button Label
                  </label>
                  <Input value={catCtaText} onChange={(e) => setCatCtaText(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SECTION 4: FEATURED ACCREDITED INSTRUCTORS
          ───────────────────────────────────────────────────────────── */}
          {(selectedHomeSection === "all" || selectedHomeSection === "s4") && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Section 4: Verified Educators / Featured Tutors Header
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Title and action button for featured accredited tutor cards.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pre-Title Tag
                  </label>
                  <Input value={tutPretitle} onChange={(e) => setTutPretitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Main Headline
                  </label>
                  <Input value={tutTitle} onChange={(e) => setTutTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    CTA Button Label
                  </label>
                  <Input value={tutCtaText} onChange={(e) => setTutCtaText(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SECTION 5: LIVE VIDEO CLASSROOM PRODUCT TOUR
          ───────────────────────────────────────────────────────────── */}
          {(selectedHomeSection === "all" || selectedHomeSection === "s5") && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 font-bold">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Section 5: Live Video Classroom Product Tour (Dark LMS Showcase)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Highlight the WebRTC in-browser video classroom, drawing canvas, and worksheets.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Classroom Badge
                    </label>
                    <Input value={tourBadge} onChange={(e) => setTourBadge(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Main Headline
                    </label>
                    <Input value={tourTitle} onChange={(e) => setTourTitle(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Classroom Feature Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={tourSubtitle}
                    onChange={(e) => setTourSubtitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SECTION 6: HOW IT WORKS (3-STEP ROADMAP)
          ───────────────────────────────────────────────────────────── */}
          {(selectedHomeSection === "all" || selectedHomeSection === "s6") && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 font-bold">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Section 6: How It Works (3-Step Roadmap)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">3-step illustrated cards for student onboarding journey.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Pre-Title Tag
                    </label>
                    <Input value={howPretitle} onChange={(e) => setHowPretitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Main Title
                    </label>
                    <Input value={howTitle} onChange={(e) => setHowTitle(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-black text-amber-600 block">Step 01</span>
                    <Input value={step1Title} onChange={(e) => setStep1Title(e.target.value)} placeholder="Step 1 Title" />
                    <textarea rows={3} value={step1Desc} onChange={(e) => setStep1Desc(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:outline-none" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-black text-amber-600 block">Step 02</span>
                    <Input value={step2Title} onChange={(e) => setStep2Title(e.target.value)} placeholder="Step 2 Title" />
                    <textarea rows={3} value={step2Desc} onChange={(e) => setStep2Desc(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:outline-none" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-black text-amber-600 block">Step 03</span>
                    <Input value={step3Title} onChange={(e) => setStep3Title(e.target.value)} placeholder="Step 3 Title" />
                    <textarea rows={3} value={step3Desc} onChange={(e) => setStep3Desc(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SECTION 7: BECOME A TUTOR CALLOUT
          ───────────────────────────────────────────────────────────── */}
          {(selectedHomeSection === "all" || selectedHomeSection === "s7") && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Section 7: Become a Tutor Callout Banner
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">High-conversion educator acquisition banner.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Badge Text
                    </label>
                    <Input value={tutorBadge} onChange={(e) => setTutorBadge(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Rate Highlight Range
                    </label>
                    <Input value={tutorRateRange} onChange={(e) => setTutorRateRange(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Headline
                  </label>
                  <Input value={tutorHeadline} onChange={(e) => setTutorHeadline(e.target.value)} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subtitle Description
                  </label>
                  <textarea rows={2} value={tutorSubtitle} onChange={(e) => setTutorSubtitle(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Checkmark #1
                    </label>
                    <Input value={bullet1} onChange={(e) => setBullet1(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Checkmark #2
                    </label>
                    <Input value={bullet2} onChange={(e) => setBullet2(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Checkmark #3
                    </label>
                    <Input value={bullet3} onChange={(e) => setBullet3(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Primary CTA Button
                    </label>
                    <Input value={tutorCta} onChange={(e) => setTutorCta(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Secondary Button
                    </label>
                    <Input value={tutorSecondary} onChange={(e) => setTutorSecondary(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SECTION 8: FREQUENTLY ASKED QUESTIONS ACCORDION
          ───────────────────────────────────────────────────────────── */}
          {(selectedHomeSection === "all" || selectedHomeSection === "s8") && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 font-bold">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Section 8: Frequently Asked Questions Accordion ({faqs.length})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manage live expandable questions and answers on the landing page.</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFaqs([...faqs, { q: "New Question Title", a: "Answer text explaining policy details..." }])}
                  className="text-xs font-bold"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Question
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Pre-Title Tag
                    </label>
                    <Input value={faqPretitle} onChange={(e) => setFaqPretitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Main Title
                    </label>
                    <Input value={faqTitle} onChange={(e) => setFaqTitle(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-500">Question #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="Remove Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <Input
                        value={faq.q}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[idx].q = e.target.value;
                          setFaqs(updated);
                        }}
                        placeholder="Question..."
                      />
                      <textarea
                        rows={2}
                        value={faq.a}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[idx].a = e.target.value;
                          setFaqs(updated);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:outline-none"
                        placeholder="Answer..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: LEGAL PAGES SUITE
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "legal" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {legalPages.map((page) => (
              <div
                key={page.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="subtle" size="sm" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold uppercase text-[10px]">
                      Legal Document
                    </Badge>
                    <span className="text-xs font-medium text-slate-400">/{page.slug}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 font-heading">
                    {page.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {page.metaDescription || "Official platform agreement and legal documentation."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {page.readingTimeMinutes || 5} min read
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href={`/${page.slug}`} target="_blank">
                      <Button variant="outline" size="sm" className="text-xs font-bold" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        View Live
                      </Button>
                    </Link>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenEditor(page.slug)}
                      className="text-xs font-bold bg-[#14209C] hover:bg-[#0e176b] text-white"
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      Edit Content
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: COMPANY & SUPPORT PAGES
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "company" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {companyPages.map((page) => (
              <div
                key={page.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="subtle" size="sm" className="bg-blue-50 text-blue-800 border-blue-200 font-bold uppercase text-[10px]">
                      Company Policy
                    </Badge>
                    <span className="text-xs font-medium text-slate-400">/{page.slug}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 font-heading">
                    {page.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {page.metaDescription || "Company overview, mission, and support channels."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {page.readingTimeMinutes || 5} min read
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href={`/${page.slug}`} target="_blank">
                      <Button variant="outline" size="sm" className="text-xs font-bold" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        View Live
                      </Button>
                    </Link>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenEditor(page.slug)}
                      className="text-xs font-bold bg-[#14209C] hover:bg-[#0e176b] text-white"
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      Edit Content
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 4: CUSTOM PAGES & CREATOR
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "custom" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Custom Content Pages
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Create and manage custom landing pages, announcements, partnerships, or faculty guides.
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsNewPageModalOpen(true)}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add New Page
            </Button>
          </div>

          {customPages.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">No Custom Pages Created Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create new pages like &quot;/careers&quot;, &quot;/press&quot;, or &quot;/affiliates&quot; to expand your site.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customPages.map((page) => (
                <div
                  key={page.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="subtle" size="sm" className="bg-slate-100 text-slate-800 border-slate-200 font-bold uppercase text-[10px]">
                        Custom Page
                      </Badge>
                      <span className="text-xs font-mono font-bold text-slate-400">/pages/{page.slug}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 font-heading">
                      {page.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {page.metaDescription || "Custom page content."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleDeletePage(page.id, page.title)}
                      className="text-slate-400 hover:text-rose-600 transition flex items-center gap-1 font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>

                    <div className="flex items-center gap-2">
                      <Link href={`/pages/${page.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-xs font-bold" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                          Preview
                        </Button>
                      </Link>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenEditor(page.slug)}
                        className="text-xs font-bold bg-[#14209C] hover:bg-[#0e176b] text-white"
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 5: PAGE EDITOR STUDIO WITH ADVANCED RICH TEXT
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "editor" && editingPage && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-3xl shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab(editingPage.category === "legal" ? "legal" : editingPage.category === "company" ? "company" : "custom")}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-base font-black text-slate-900 font-heading">
                  Editing: {editingPage.title}
                </h3>
                <span className="text-xs font-mono text-slate-400">/{editingPage.slug}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={editingPage.category === "custom" ? `/pages/${editingPage.slug}` : `/${editingPage.slug}`}
                target="_blank"
              >
                <Button variant="outline" size="sm" className="text-xs font-bold" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  View Live
                </Button>
              </Link>
              <Button
                variant="default"
                size="sm"
                onClick={handleSavePage}
                disabled={saving}
                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                {saving ? "Saving..." : "Save Page"}
              </Button>
            </div>
          </div>

          {/* Metadata Controls */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Page Metadata & SEO
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Page Title
                </label>
                <Input
                  value={editingPage.title || ""}
                  onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  URL Slug
                </label>
                <Input
                  disabled={editingPage.category === "legal" || editingPage.category === "company"}
                  value={editingPage.slug || ""}
                  onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Estimated Reading Time (Mins)
                </label>
                <Input
                  type="number"
                  value={editingPage.readingTimeMinutes || 5}
                  onChange={(e) => setEditingPage({ ...editingPage, readingTimeMinutes: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Meta Description (Search Engines & Social Cards)
              </label>
              <textarea
                rows={2}
                value={editingPage.metaDescription || ""}
                onChange={(e) => setEditingPage({ ...editingPage, metaDescription: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Advanced Rich Text Editor */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Rich Text Page Content
            </h4>
            <RichTextEditor
              value={editingPage.contentHtml || ""}
              onChange={(contentHtml) => setEditingPage({ ...editingPage, contentHtml })}
              minHeight="550px"
            />
          </div>
        </div>
      )}

      {/* ── 3. Create New Page Modal ── */}
      {isNewPageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 font-heading">
                Create New Platform Page
              </h3>
              <p className="text-xs text-slate-500">
                Enter the title, category, and URL path for your new page.
              </p>
            </div>

            <form onSubmit={handleCreateNewPage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Page Title
                </label>
                <Input
                  required
                  placeholder="e.g. Careers at Sabina Edge"
                  value={newPageTitle}
                  onChange={(e) => {
                    setNewPageTitle(e.target.value);
                    if (!newPageSlug) {
                      setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  URL Slug
                </label>
                <Input
                  required
                  placeholder="e.g. careers"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  URL will be: <strong className="text-slate-800">/pages/{newPageSlug || "example"}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newPageCategory}
                  onChange={(e) => setNewPageCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="custom">Custom Document</option>
                  <option value="company">Company Policy</option>
                  <option value="legal">Legal Agreement</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewPageModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={saving}
                  className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {saving ? "Creating..." : "Create Page & Open Editor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 1: HOMEPAGE CMS PUBLISHED NOTIFICATION MODAL ── */}
      {isHomepageSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                  Live on Production
                </div>
                <h3 className="text-lg font-black text-slate-900 font-heading">
                  Homepage CMS Published!
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  All 8 homepage sections were updated in Supabase and pushed live immediately.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <Check className="h-4 w-4" /> Hero Banner, Subtitle & Typewriter
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <Check className="h-4 w-4" /> Real-time Metric & Stat Counters
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <Check className="h-4 w-4" /> Classroom Tour, FAQs & Tutor Section
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="font-bold text-xs rounded-xl"
                onClick={() => setIsHomepageSaveModalOpen(false)}
              >
                Done
              </Button>
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <Button
                  variant="default"
                  size="sm"
                  className="font-bold text-xs bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs"
                  rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                  onClick={() => setIsHomepageSaveModalOpen(false)}
                >
                  Preview Live Homepage
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: PAGE PUBLISHED NOTIFICATION MODAL ── */}
      {isPageSaveModalOpen && editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                  Live on Production
                </div>
                <h3 className="text-lg font-black text-slate-900 font-heading truncate max-w-xs">
                  {editingPage.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Page content was saved and published live to the public URL.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-[11px] text-slate-400 block font-semibold mb-1">Public URL:</span>
              <strong className="text-slate-800 font-mono">/pages/{editingPage.slug}</strong>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="font-bold text-xs rounded-xl"
                onClick={() => setIsPageSaveModalOpen(false)}
              >
                Continue Editing
              </Button>
              <Link href={`/pages/${editingPage.slug}`} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="default"
                  size="sm"
                  className="font-bold text-xs bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs"
                  rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                  onClick={() => setIsPageSaveModalOpen(false)}
                >
                  View Live Page
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: DELETE CONFIRMATION MODAL ── */}
      {deleteConfirmPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 font-heading">
                  Delete Page?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete <strong className="text-slate-900 font-bold">"{deleteConfirmPage.title}"</strong>? This will permanently remove the page from the platform.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="font-bold text-xs rounded-xl"
                onClick={() => setDeleteConfirmPage(null)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                onClick={confirmDeletePage}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCMSDashboardPage() {
  return (
    <React.Suspense fallback={<div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <AdminCMSDashboardContent />
    </React.Suspense>
  );
}
