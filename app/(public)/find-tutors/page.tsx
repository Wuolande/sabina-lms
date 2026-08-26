"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  X,
  RotateCcw,
} from "lucide-react";
import { TutorCard } from "@/components/marketplace/TutorCard";
import { TutorCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { BookingModal } from "@/components/booking/BookingModal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { tutorService } from "@/services/tutorService";
import { TutorProfile, Subject, Language, TutorSearchParams } from "@/types";

const subjectGroups = [
  { value: "all", label: "All Subject Groups" },
  { value: "languages", label: "Languages & Linguistics" },
  { value: "mathematics", label: "Mathematics & Statistics" },
  { value: "sciences", label: "Natural Sciences (Physics, Chemistry)" },
  { value: "technology", label: "Computer Science & Coding" },
  { value: "humanities", label: "Humanities & Social Sciences" },
  { value: "test-prep", label: "Exam & Standardized Test Prep" },
];

const countries = [
  { value: "all", label: "All Countries / Global" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" },
  { value: "France", label: "France" },
  { value: "Spain", label: "Spain" },
  { value: "Germany", label: "Germany" },
  { value: "Singapore", label: "Singapore" },
  { value: "Japan", label: "Japan" },
];

const priceRanges = [
  { value: "all", label: "Any Price ($0.00+)", min: 0, max: 200 },
  { value: "under-30", label: "Under $30 / session", min: 0, max: 30 },
  { value: "30-50", label: "$30 – $50 / session", min: 30, max: 50 },
  { value: "50-80", label: "$50 – $80 / session", min: 50, max: 80 },
  { value: "80-plus", label: "$80+ / session", min: 80, max: 200 },
];

function FindTutorsContent() {
  const searchParams = useSearchParams();

  const [tutors, setTutors] = React.useState<TutorProfile[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Session Type Tab: "all" | "private" | "group"
  const [sessionType, setSessionType] = React.useState<"all" | "private" | "group">("all");

  // Primary 4 Filter Card States (Matches User's Reference)
  const [selectedSubjectGroup, setSelectedSubjectGroup] = React.useState<string>(
    searchParams.get("group") || "all"
  );
  const [selectedSubject, setSelectedSubject] = React.useState<string>(
    searchParams.get("subject") || "all"
  );
  const [selectedPriceRange, setSelectedPriceRange] = React.useState<string>("all");
  const [selectedCountry, setSelectedCountry] = React.useState<string>(
    searchParams.get("country") || "all"
  );

  // Secondary Filter Row States
  const [keyword, setKeyword] = React.useState<string>(searchParams.get("q") || "");
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>(
    searchParams.get("language") || "all"
  );
  const [sortBy, setSortBy] = React.useState<TutorSearchParams["sortBy"]>(
    (searchParams.get("sort") as TutorSearchParams["sortBy"]) || "popularity"
  );

  // Pagination & Booking Modal
  const [page, setPage] = React.useState(1);
  const [bookingTutor, setBookingTutor] = React.useState<TutorProfile | null>(null);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);

  const [countriesList, setCountriesList] = React.useState<any[]>([]);

  // Load Reference Subjects, Languages & Countries from Live DB
  React.useEffect(() => {
    tutorService.getAllSubjects().then(setSubjects);
    tutorService.getAllLanguages().then(setLanguages);
    tutorService.getAllCountries().then(setCountriesList);
  }, []);

  // Filter subjects dropdown based on selected subject group
  const filteredSubjects = React.useMemo(() => {
    if (selectedSubjectGroup === "all") return subjects;
    return subjects.filter(
      (s) => s.category.toLowerCase() === selectedSubjectGroup.toLowerCase()
    );
  }, [subjects, selectedSubjectGroup]);

  // Fetch Tutors based on all combined filter controls
  const fetchTutors = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const activeRange = priceRanges.find((p) => p.value === selectedPriceRange);

      const res = await tutorService.getTutors({
        query: keyword || undefined,
        subjectGroup: selectedSubjectGroup !== "all" ? selectedSubjectGroup : undefined,
        subject: selectedSubject !== "all" ? selectedSubject : undefined,
        country: selectedCountry !== "all" ? selectedCountry : undefined,
        language: selectedLanguage !== "all" ? selectedLanguage : undefined,
        minPrice: activeRange && activeRange.value !== "all" ? activeRange.min : undefined,
        maxPrice: activeRange && activeRange.value !== "all" ? activeRange.max : undefined,
        sessionType: sessionType,
        sortBy,
        page,
        limit: 6,
      });

      setTutors(res.tutors);
      setTotalCount(res.total);
    } finally {
      setIsLoading(false);
    }
  }, [
    keyword,
    selectedSubjectGroup,
    selectedSubject,
    selectedPriceRange,
    selectedCountry,
    selectedLanguage,
    sessionType,
    sortBy,
    page,
  ]);

  React.useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  const handleResetFilters = () => {
    setSessionType("all");
    setSelectedSubjectGroup("all");
    setSelectedSubject("all");
    setSelectedPriceRange("all");
    setSelectedCountry("all");
    setKeyword("");
    setSelectedLanguage("all");
    setSortBy("popularity");
    setPage(1);
  };

  const handleBook = (tutor: TutorProfile) => {
    setBookingTutor(tutor);
    setIsBookingOpen(true);
  };

  const hasActiveFilters =
    sessionType !== "all" ||
    selectedSubjectGroup !== "all" ||
    selectedSubject !== "all" ||
    selectedPriceRange !== "all" ||
    selectedCountry !== "all" ||
    keyword !== "" ||
    selectedLanguage !== "all";

  const totalPages = Math.ceil(totalCount / 6);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── 1. Clean Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-bold">Find tutor</span>
      </nav>

      {/* ── 2. Headline & Subtitle ── */}
      <div className="max-w-4xl space-y-2.5">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight font-heading">
          Discover a skilled online tutor for your studies
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
          Master your studies with personalized online tutoring from expert educators. Our skilled tutors are here to help you build strong foundations and achieve your academic goals.
        </p>
      </div>

      {/* ── 3. Reference Filter Suite (Attached Session Tabs + Cream Filter Container) ── */}
      <div className="space-y-4">
        {/* Session Type Pill Tab Strip */}
        <div className="flex items-center">
          <div className="inline-flex items-center gap-1.5 bg-[#F6F0E5] p-1 rounded-t-2xl sm:rounded-t-3xl border-t border-x border-[#EDE3D3]">
            <button
              type="button"
              onClick={() => {
                setSessionType("all");
                setPage(1);
              }}
              className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                sessionType === "all"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-700 hover:text-slate-950"
              }`}
            >
              All Sessions
            </button>
            <button
              type="button"
              onClick={() => {
                setSessionType("private");
                setPage(1);
              }}
              className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                sessionType === "private"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-700 hover:text-slate-950"
              }`}
            >
              Private Sessions
            </button>
            <button
              type="button"
              onClick={() => {
                setSessionType("group");
                setPage(1);
              }}
              className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                sessionType === "group"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-700 hover:text-slate-950"
              }`}
            >
              Group Sessions
            </button>
          </div>
        </div>

        {/* Primary Filter Box (Soft Cream/Sand Background with 4 Column Selectors) */}
        <div className="rounded-2xl sm:rounded-3xl sm:rounded-tl-none bg-[#FBF7F0] p-4 sm:p-6 border border-[#EFE8DC] shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Column 1: Subject group */}
            <div>
              <SearchableSelect
                label="Subject Group"
                placeholder="All Subject Groups"
                searchPlaceholder="Search categories..."
                value={selectedSubjectGroup}
                onChange={(val) => {
                  setSelectedSubjectGroup(val || "all");
                  setSelectedSubject("all");
                  setPage(1);
                }}
                options={[
                  { value: "all", label: "All Subject Groups" },
                  ...subjectGroups.filter((g) => g.value !== "all").map((g) => ({
                    value: g.value,
                    label: g.label,
                  })),
                ]}
              />
            </div>

            {/* Column 2: Choose subject */}
            <div>
              <SearchableSelect
                label="Choose Subject"
                placeholder="All Subjects"
                searchPlaceholder="Search 30+ subjects..."
                value={selectedSubject}
                onChange={(val) => {
                  setSelectedSubject(val || "all");
                  setPage(1);
                }}
                options={[
                  { value: "all", label: "All Subjects" },
                  ...filteredSubjects.map((sub) => ({
                    value: sub.slug,
                    label: sub.name,
                    sublabel: sub.category,
                  })),
                ]}
              />
            </div>

            {/* Column 3: Fee per session */}
            <div>
              <SearchableSelect
                label="Fee Per Session"
                placeholder="Any Price"
                searchPlaceholder="Filter price range..."
                value={selectedPriceRange}
                onChange={(val) => {
                  setSelectedPriceRange(val || "all");
                  setPage(1);
                }}
                options={priceRanges.map((p) => ({
                  value: p.value,
                  label: p.label,
                }))}
              />
            </div>

            {/* Column 4: Tutor location */}
            <div>
              <SearchableSelect
                label="Tutor Location"
                placeholder="All Countries / Global"
                searchPlaceholder="Search 170+ countries..."
                value={selectedCountry}
                onChange={(val) => {
                  setSelectedCountry(val || "all");
                  setPage(1);
                }}
                options={[
                  { value: "all", label: "All Countries / Global" },
                  ...countriesList.map((c) => ({
                    value: c.name,
                    label: c.name,
                    sublabel: `${c.continent} • ${c.code}`,
                  })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* ── 4. Secondary Filter Row (Search by Keyword + Sort By + Select Language) ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Left: Search by Keyword */}
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Search by tutor name or keyword..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 pr-8 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-colors"
            />
            {keyword ? (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            )}
          </div>

          {/* Middle & Right Selectors */}
          <div className="flex items-center gap-3">
            {/* Sort by */}
            <div className="min-w-[160px]">
              <SearchableSelect
                placeholder="Sort by..."
                value={sortBy}
                onChange={(val) => setSortBy((val as any) || "popularity")}
                options={[
                  { value: "popularity", label: "Sort: Popularity" },
                  { value: "rating", label: "Sort: Top Rated (5★)" },
                  { value: "price_asc", label: "Price: Low to High" },
                  { value: "price_desc", label: "Price: High to Low" },
                  { value: "reviews", label: "Most Reviews" },
                ]}
              />
            </div>

            {/* Select language */}
            <div className="min-w-[180px]">
              <SearchableSelect
                placeholder="All Languages"
                searchPlaceholder="Search 70+ languages..."
                value={selectedLanguage}
                onChange={(val) => {
                  setSelectedLanguage(val || "all");
                  setPage(1);
                }}
                options={[
                  { value: "all", label: "All Languages" },
                  ...languages.map((l) => ({
                    value: l.code,
                    label: l.name,
                    sublabel: `${l.nativeName} (${l.code})`,
                  })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* ── Active Filter Pills & Reset ── */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Filters:
            </span>

            {sessionType !== "all" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700">
                {sessionType === "private" ? "Private Sessions" : "Group Sessions"}
                <button
                  type="button"
                  onClick={() => setSessionType("all")}
                  className="hover:text-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedSubjectGroup !== "all" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700">
                Group: {subjectGroups.find((g) => g.value === selectedSubjectGroup)?.label}
                <button
                  type="button"
                  onClick={() => setSelectedSubjectGroup("all")}
                  className="hover:text-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedSubject !== "all" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700">
                Subject: {subjects.find((s) => s.slug === selectedSubject)?.name}
                <button
                  type="button"
                  onClick={() => setSelectedSubject("all")}
                  className="hover:text-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedPriceRange !== "all" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700">
                Fee: {priceRanges.find((p) => p.value === selectedPriceRange)?.label}
                <button
                  type="button"
                  onClick={() => setSelectedPriceRange("all")}
                  className="hover:text-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedCountry !== "all" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700">
                Location: {selectedCountry}
                <button
                  type="button"
                  onClick={() => setSelectedCountry("all")}
                  className="hover:text-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {keyword && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700">
                Keyword: &quot;{keyword}&quot;
                <button
                  type="button"
                  onClick={() => setKeyword("")}
                  className="hover:text-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedLanguage !== "all" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700">
                Language: {languages.find((l) => l.code === selectedLanguage)?.name}
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("all")}
                  className="hover:text-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-brand-700 hover:text-brand-900 underline ml-2 flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset all
            </button>
          </div>
        )}
      </div>

      {/* ── 5. Results Counter & Grid ── */}
      <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">
            {isLoading
              ? "Searching available tutors..."
              : `Showing ${totalCount} verified tutor${totalCount === 1 ? "" : "s"}`}
          </p>
          <span className="text-xs font-semibold text-slate-400">
            Page {page} of {totalPages || 1}
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <TutorCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tutors.length === 0 && (
          <div className="py-12">
            <EmptyState
              title="No tutors found matching your criteria"
              description="Try adjusting your subject group, price range, country location, or search keywords."
              actionLabel="Clear All Filters"
              onAction={handleResetFilters}
            />
          </div>
        )}

        {/* Tutors Grid */}
        {!isLoading && tutors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((tutor) => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                onBook={handleBook}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="pt-8 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 300, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        tutor={bookingTutor}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}

export default function FindTutorsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <TutorCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <FindTutorsContent />
    </React.Suspense>
  );
}
