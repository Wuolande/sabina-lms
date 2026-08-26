"use client";

import * as React from "react";
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  Percent,
  Clock,
  DollarSign,
  Globe,
  BookOpen,
  Languages,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { adminService } from "@/services/adminService";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = React.useState<
    "policies" | "subjects" | "languages" | "countries" | "timezones" | "currencies"
  >("policies");

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);

  // Taxonomy data from DB
  const [taxonomy, setTaxonomy] = React.useState<{
    subjects: any[];
    categories: string[];
    languages: any[];
    countries: any[];
    timezones: any[];
    currencies: any[];
    policies: any;
  }>({
    subjects: [],
    categories: [],
    languages: [],
    countries: [],
    timezones: [],
    currencies: [],
    policies: {
      platformFeePercent: 18,
      cancellationRefundHours: 24,
      classroomEarlyJoinMinutes: 15,
      tutorMinHourlyRate: 15,
      tutorMaxHourlyRate: 250,
      instantBookingEnabled: true,
      autoApproveVerifiedTutors: false,
      trialLessonDiscountPercent: 30,
    },
  });

  // Search & Filter states
  const [subjectSearch, setSubjectSearch] = React.useState("");
  const [subjectCatFilter, setSubjectCatFilter] = React.useState("ALL");
  const [langSearch, setLangSearch] = React.useState("");
  const [countrySearch, setCountrySearch] = React.useState("");
  const [countryContinentFilter, setCountryContinentFilter] = React.useState("ALL");
  const [tzSearch, setTzSearch] = React.useState("");
  const [tzRegionFilter, setTzRegionFilter] = React.useState("ALL");
  const [curSearch, setCurSearch] = React.useState("");

  // Pagination states for each tab
  const [subjectPage, setSubjectPage] = React.useState(1);
  const [subjectPageSize, setSubjectPageSize] = React.useState(10);

  const [langPage, setLangPage] = React.useState(1);
  const [langPageSize, setLangPageSize] = React.useState(15);

  const [countryPage, setCountryPage] = React.useState(1);
  const [countryPageSize, setCountryPageSize] = React.useState(20);

  const [tzPage, setTzPage] = React.useState(1);
  const [tzPageSize, setTzPageSize] = React.useState(15);

  const [curPage, setCurPage] = React.useState(1);
  const [curPageSize, setCurPageSize] = React.useState(15);

  // Modal / Form state
  const [modalMode, setModalMode] = React.useState<"subject" | "language" | "country" | "timezone" | null>(null);
  const [editingItem, setEditingItem] = React.useState<any | null>(null);

  // Load live taxonomy
  const loadTaxonomy = React.useCallback(async () => {
    setLoading(true);
    const data = await adminService.getTaxonomy360();
    if (data) {
      setTaxonomy(data);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadTaxonomy();
  }, [loadTaxonomy]);

  const triggerToast = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  // Reset page when filters change
  React.useEffect(() => {
    setSubjectPage(1);
  }, [subjectSearch, subjectCatFilter]);

  React.useEffect(() => {
    setLangPage(1);
  }, [langSearch]);

  React.useEffect(() => {
    setCountryPage(1);
  }, [countrySearch, countryContinentFilter]);

  React.useEffect(() => {
    setTzPage(1);
  }, [tzSearch, tzRegionFilter]);

  React.useEffect(() => {
    setCurPage(1);
  }, [curSearch]);

  // Policy Save
  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await adminService.updatePolicySettings(taxonomy.policies);
    setSaving(false);
    if (ok) {
      triggerToast("Platform economic policies saved successfully");
    }
  };

  // Subject Save
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingItem;
    if (!payload.name) return;
    setSaving(true);
    await adminService.upsertSubject(payload);
    setSaving(false);
    setModalMode(null);
    setEditingItem(null);
    loadTaxonomy();
    triggerToast("Subject saved successfully");
  };

  // Subject Delete
  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Are you sure you want to delete or deactivate this subject?")) return;
    await adminService.deleteSubject(id);
    loadTaxonomy();
    triggerToast("Subject removed from platform");
  };

  // Language Save
  const handleSaveLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingItem;
    if (!payload.name || !payload.code) return;
    setSaving(true);
    await adminService.upsertLanguage(payload);
    setSaving(false);
    setModalMode(null);
    setEditingItem(null);
    loadTaxonomy();
    triggerToast("Language saved successfully");
  };

  // Language Delete
  const handleDeleteLanguage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this language?")) return;
    await adminService.deleteLanguage(id);
    loadTaxonomy();
    triggerToast("Language deleted");
  };

  // Country Save
  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingItem;
    if (!payload.name || !payload.code) return;
    setSaving(true);
    await adminService.upsertCountry(payload);
    setSaving(false);
    setModalMode(null);
    setEditingItem(null);
    loadTaxonomy();
    triggerToast("Country saved successfully");
  };

  // Country Delete
  const handleDeleteCountry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this country?")) return;
    await adminService.deleteCountry(id);
    loadTaxonomy();
    triggerToast("Country deleted");
  };

  // Timezone Save
  const handleSaveTimezone = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingItem;
    if (!payload.identifier || !payload.displayName) return;
    setSaving(true);
    await adminService.upsertTimezone(payload);
    setSaving(false);
    setModalMode(null);
    setEditingItem(null);
    loadTaxonomy();
    triggerToast("Timezone saved successfully");
  };

  // Timezone Delete
  const handleDeleteTimezone = async (id: string) => {
    if (!confirm("Are you sure you want to delete this timezone?")) return;
    await adminService.deleteTimezone(id);
    loadTaxonomy();
    triggerToast("Timezone deleted");
  };

  // Subject Toggle Featured on Homepage
  const handleToggleFeaturedSubject = async (subject: any) => {
    const updated = !subject.isFeatured;
    await adminService.upsertSubject({
      ...subject,
      isFeatured: updated,
    });
    loadTaxonomy();
    triggerToast(`Subject ${updated ? "featured on" : "removed from"} Homepage showcase`);
  };

  // Filtered & Paginated Lists
  const filteredSubjects = (taxonomy.subjects || []).filter((s) => {
    const matchQ = s.name.toLowerCase().includes(subjectSearch.toLowerCase()) || s.slug.toLowerCase().includes(subjectSearch.toLowerCase());
    const matchCat = subjectCatFilter === "ALL" || s.category === subjectCatFilter;
    return matchQ && matchCat;
  });
  const totalSubjectPages = Math.max(1, Math.ceil(filteredSubjects.length / subjectPageSize));
  const paginatedSubjects = filteredSubjects.slice((subjectPage - 1) * subjectPageSize, subjectPage * subjectPageSize);

  const filteredLanguages = (taxonomy.languages || []).filter((l) => {
    return l.name.toLowerCase().includes(langSearch.toLowerCase()) || l.code.toLowerCase().includes(langSearch.toLowerCase()) || (l.nativeName && l.nativeName.toLowerCase().includes(langSearch.toLowerCase()));
  });
  const totalLangPages = Math.max(1, Math.ceil(filteredLanguages.length / langPageSize));
  const paginatedLanguages = filteredLanguages.slice((langPage - 1) * langPageSize, langPage * langPageSize);

  const countryContinents = Array.from(new Set((taxonomy.countries || []).map((c) => c.continent).filter(Boolean)));
  const filteredCountries = (taxonomy.countries || []).filter((c) => {
    const matchQ = c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase());
    const matchCont = countryContinentFilter === "ALL" || c.continent === countryContinentFilter;
    return matchQ && matchCont;
  });
  const totalCountryPages = Math.max(1, Math.ceil(filteredCountries.length / countryPageSize));
  const paginatedCountries = filteredCountries.slice((countryPage - 1) * countryPageSize, countryPage * countryPageSize);

  const tzRegions = Array.from(new Set((taxonomy.timezones || []).map((tz) => tz.region).filter(Boolean)));
  const filteredTimezones = (taxonomy.timezones || []).filter((tz) => {
    const matchQ = tz.identifier.toLowerCase().includes(tzSearch.toLowerCase()) || tz.displayName.toLowerCase().includes(tzSearch.toLowerCase()) || tz.utcOffset.toLowerCase().includes(tzSearch.toLowerCase());
    const matchReg = tzRegionFilter === "ALL" || tz.region === tzRegionFilter;
    return matchQ && matchReg;
  });
  const totalTzPages = Math.max(1, Math.ceil(filteredTimezones.length / tzPageSize));
  const paginatedTimezones = filteredTimezones.slice((tzPage - 1) * tzPageSize, tzPage * tzPageSize);

  const filteredCurrencies = (taxonomy.currencies || []).filter((cur) => {
    return cur.name.toLowerCase().includes(curSearch.toLowerCase()) || cur.code.toLowerCase().includes(curSearch.toLowerCase()) || cur.symbol.toLowerCase().includes(curSearch.toLowerCase());
  });
  const totalCurPages = Math.max(1, Math.ceil(filteredCurrencies.length / curPageSize));
  const paginatedCurrencies = filteredCurrencies.slice((curPage - 1) * curPageSize, curPage * curPageSize);

  // Reusable Pagination Toolbar Component
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    pageSize: number,
    onPageChange: (page: number) => void,
    onPageSizeChange: (size: number) => void
  ) => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(totalItems, currentPage * pageSize);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
        {/* Left: Range and Size Picker */}
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-900 font-bold">{startItem}</strong> to{" "}
            <strong className="text-slate-900 font-bold">{endItem}</strong> of{" "}
            <strong className="text-slate-900 font-bold">{totalItems}</strong> entries
          </span>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Right: Page Navigation Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className="h-8 w-8 p-0 border-slate-200"
            title="First Page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-8 w-8 p-0 border-slate-200"
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = currentPage;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              const isCurrent = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition-colors ${
                    isCurrent
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0 border-slate-200"
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0 border-slate-200"
            title="Last Page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* ─── Header & Top KPIs ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Platform Governance & Taxonomy Studio
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Live DB v2.0
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global management for Subjects, Languages, Countries, Timezones, Currencies, and Economic Policies.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadTaxonomy}
          disabled={loading}
          className="gap-2 shrink-0 border-slate-200"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-emerald-600" : "text-slate-500"}`} />
          <span>Refresh Database</span>
        </Button>
      </div>

      {/* Toast alert */}
      {savedMessage && (
        <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 font-semibold text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Subjects</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{taxonomy.subjects?.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Languages</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{taxonomy.languages?.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Countries</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{taxonomy.countries?.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Timezones</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{taxonomy.timezones?.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Currencies</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{taxonomy.currencies?.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Platform Take Rate</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{taxonomy.policies?.platformFeePercent}%</p>
        </div>
      </div>

      {/* ─── Main Tabs Navigation ─── */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        {[
          { id: "policies", label: "Economics & Policies", icon: Settings },
          { id: "subjects", label: `Subjects (${taxonomy.subjects?.length || 0})`, icon: BookOpen },
          { id: "languages", label: `Languages (${taxonomy.languages?.length || 0})`, icon: Languages },
          { id: "countries", label: `Countries (${taxonomy.countries?.length || 0})`, icon: MapPin },
          { id: "timezones", label: `Timezones (${taxonomy.timezones?.length || 0})`, icon: Clock },
          { id: "currencies", label: `Currencies (${taxonomy.currencies?.length || 0})`, icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: Economics & Policies ─── */}
      {activeTab === "policies" && (
        <form onSubmit={handleSavePolicies} className="space-y-6 max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Marketplace Economics & Take Rate
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configure revenue share and platform processing fee deductions.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Platform Take Rate (% Commission)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={taxonomy.policies?.platformFeePercent ?? 18}
                  onChange={(e) =>
                    setTaxonomy({
                      ...taxonomy,
                      policies: { ...taxonomy.policies, platformFeePercent: Number(e.target.value) },
                    })
                  }
                  leftIcon={<Percent className="h-4 w-4" />}
                />
                <p className="text-[11px] text-slate-500 mt-1">Deducted from gross booking value prior to tutor payout.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Trial Lesson Discount (%)
                </label>
                <Input
                  type="number"
                  step="1"
                  value={taxonomy.policies?.trialLessonDiscountPercent ?? 30}
                  onChange={(e) =>
                    setTaxonomy({
                      ...taxonomy,
                      policies: { ...taxonomy.policies, trialLessonDiscountPercent: Number(e.target.value) },
                    })
                  }
                  leftIcon={<Percent className="h-4 w-4" />}
                />
                <p className="text-[11px] text-slate-500 mt-1">Default discount for first trial session with a tutor.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tutor Minimum Hourly Rate ($)
                </label>
                <Input
                  type="number"
                  value={taxonomy.policies?.tutorMinHourlyRate ?? 15}
                  onChange={(e) =>
                    setTaxonomy({
                      ...taxonomy,
                      policies: { ...taxonomy.policies, tutorMinHourlyRate: Number(e.target.value) },
                    })
                  }
                  leftIcon={<DollarSign className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tutor Maximum Hourly Rate ($)
                </label>
                <Input
                  type="number"
                  value={taxonomy.policies?.tutorMaxHourlyRate ?? 250}
                  onChange={(e) =>
                    setTaxonomy({
                      ...taxonomy,
                      policies: { ...taxonomy.policies, tutorMaxHourlyRate: Number(e.target.value) },
                    })
                  }
                  leftIcon={<DollarSign className="h-4 w-4" />}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Classroom & Cancellation Governance
                </h3>
                <p className="text-xs text-slate-500 mt-1">Classroom scheduling, refund buffers, and video timeouts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    100% Refund Cancellation Window (Hours)
                  </label>
                  <Input
                    type="number"
                    value={taxonomy.policies?.cancellationRefundHours ?? 24}
                    onChange={(e) =>
                      setTaxonomy({
                        ...taxonomy,
                        policies: { ...taxonomy.policies, cancellationRefundHours: Number(e.target.value) },
                      })
                    }
                    leftIcon={<Clock className="h-4 w-4" />}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Students can cancel with full refund before this window.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Live Video Room Early Join (Minutes)
                  </label>
                  <Input
                    type="number"
                    value={taxonomy.policies?.classroomEarlyJoinMinutes ?? 15}
                    onChange={(e) =>
                      setTaxonomy({
                        ...taxonomy,
                        policies: { ...taxonomy.policies, classroomEarlyJoinMinutes: Number(e.target.value) },
                      })
                    }
                    leftIcon={<Clock className="h-4 w-4" />}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">LiveKit classroom unlocks {taxonomy.policies?.classroomEarlyJoinMinutes} mins early.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">Changes apply immediately across all booking transactions.</span>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {saving ? "Saving Policies..." : "Save Platform Policies"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ─── TAB 2: Subjects & Categories ─── */}
      {activeTab === "subjects" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search subjects..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <select
                value={subjectCatFilter}
                onChange={(e) => setSubjectCatFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
              >
                <option value="ALL">All Categories ({taxonomy.subjects?.length || 0})</option>
                {taxonomy.categories?.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => {
                setEditingItem({ name: "", slug: "", category: "General", description: "", iconName: "BookOpen", isActive: true });
                setModalMode("subject");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Subject</span>
            </Button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Subject Name</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Tutors</th>
                    <th className="px-6 py-4 text-center">Featured (Homepage)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedSubjects.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{s.name}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{s.description || "No description"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{s.slug}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-slate-50 font-semibold text-slate-700">
                          {s.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{s.tutorCount} Tutors</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeaturedSubject(s)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                            s.isFeatured
                              ? "bg-amber-50 text-amber-800 border-amber-300 shadow-xs hover:bg-amber-100"
                              : "bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700 hover:border-slate-300"
                          }`}
                          title="Click to toggle featured status on Homepage"
                        >
                          <span className={s.isFeatured ? "text-amber-500" : "text-slate-300"}>★</span>
                          <span>{s.isFeatured ? "Featured" : "Standard"}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {s.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <X className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingItem(s);
                            setModalMode("subject");
                          }}
                          className="h-8 px-2 text-slate-600 hover:text-emerald-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubject(s.id)}
                          className="h-8 px-2 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredSubjects.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No subjects match your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {renderPagination(
              subjectPage,
              totalSubjectPages,
              filteredSubjects.length,
              subjectPageSize,
              setSubjectPage,
              setSubjectPageSize
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: Languages ─── */}
      {activeTab === "languages" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search languages by name or code..."
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button
              onClick={() => {
                setEditingItem({ name: "", code: "", nativeName: "" });
                setModalMode("language");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Language</span>
            </Button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Language Name</th>
                    <th className="px-6 py-4">ISO Code (639-1)</th>
                    <th className="px-6 py-4">Native Name</th>
                    <th className="px-6 py-4">Tutors Speaking</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedLanguages.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-emerald-600" />
                        <span>{l.name}</span>
                      </td>
                      <td className="px-6 py-4 font-mono uppercase text-xs font-bold text-slate-600">{l.code}</td>
                      <td className="px-6 py-4 text-slate-700 font-semibold">{l.nativeName}</td>
                      <td className="px-6 py-4 font-bold text-emerald-700">{l.tutorCount} Tutors</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingItem(l);
                            setModalMode("language");
                          }}
                          className="h-8 px-2 text-slate-600 hover:text-emerald-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLanguage(l.id)}
                          className="h-8 px-2 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredLanguages.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No languages match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {renderPagination(
              langPage,
              totalLangPages,
              filteredLanguages.length,
              langPageSize,
              setLangPage,
              setLangPageSize
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: Countries ─── */}
      {activeTab === "countries" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <select
                value={countryContinentFilter}
                onChange={(e) => setCountryContinentFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
              >
                <option value="ALL">All Continents ({taxonomy.countries?.length || 0})</option>
                {countryContinents.map((cont) => (
                  <option key={cont} value={cont}>
                    {cont}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => {
                setEditingItem({ name: "", code: "", dialCode: "+", currencyCode: "USD", continent: "Global", isActive: true });
                setModalMode("country");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Country</span>
            </Button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Country</th>
                    <th className="px-6 py-4">ISO Code</th>
                    <th className="px-6 py-4">Dial Code</th>
                    <th className="px-6 py-4">Currency</th>
                    <th className="px-6 py-4">Continent</th>
                    <th className="px-6 py-4">Active Users</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedCountries.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{c.name}</span>
                      </td>
                      <td className="px-6 py-4 font-mono uppercase text-xs font-bold text-slate-600">{c.code}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{c.dialCode}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{c.currencyCode}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700">
                          {c.continent}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{c.userCount} Users</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingItem(c);
                            setModalMode("country");
                          }}
                          className="h-8 px-2 text-slate-600 hover:text-emerald-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCountry(c.id)}
                          className="h-8 px-2 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredCountries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No countries match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {renderPagination(
              countryPage,
              totalCountryPages,
              filteredCountries.length,
              countryPageSize,
              setCountryPage,
              setCountryPageSize
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: Timezones ─── */}
      {activeTab === "timezones" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search timezones..."
                  value={tzSearch}
                  onChange={(e) => setTzSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <select
                value={tzRegionFilter}
                onChange={(e) => setTzRegionFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
              >
                <option value="ALL">All Regions ({taxonomy.timezones?.length || 0})</option>
                {tzRegions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => {
                setEditingItem({ identifier: "", displayName: "", utcOffset: "UTC+00:00", region: "Global", isActive: true });
                setModalMode("timezone");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Timezone</span>
            </Button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">IANA Identifier</th>
                    <th className="px-6 py-4">Display Label</th>
                    <th className="px-6 py-4">UTC Offset</th>
                    <th className="px-6 py-4">Region</th>
                    <th className="px-6 py-4">Assigned Users</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedTimezones.map((tz) => (
                    <tr key={tz.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{tz.identifier}</td>
                      <td className="px-6 py-4 text-slate-700 font-semibold">{tz.displayName}</td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-700">{tz.utcOffset}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700">
                          {tz.region}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{tz.userCount} Users</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingItem(tz);
                            setModalMode("timezone");
                          }}
                          className="h-8 px-2 text-slate-600 hover:text-emerald-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTimezone(tz.id)}
                          className="h-8 px-2 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredTimezones.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No timezones match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {renderPagination(
              tzPage,
              totalTzPages,
              filteredTimezones.length,
              tzPageSize,
              setTzPage,
              setTzPageSize
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 6: Currencies & Exchange Rates ─── */}
      {activeTab === "currencies" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search currencies by name or symbol..."
                value={curSearch}
                onChange={(e) => setCurSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Currency</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Symbol</th>
                    <th className="px-6 py-4">Rate (to USD)</th>
                    <th className="px-6 py-4">Payouts Supported</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedCurrencies.map((cur) => (
                    <tr key={cur.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{cur.name}</td>
                      <td className="px-6 py-4 font-mono uppercase text-xs font-bold text-slate-600">{cur.code}</td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-700">{cur.symbol}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{cur.exchangeRateToUsd}</td>
                      <td className="px-6 py-4">
                        {cur.isPayoutSupported ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Supported</Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400">Display Only</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredCurrencies.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No currencies match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {renderPagination(
              curPage,
              totalCurPages,
              filteredCurrencies.length,
              curPageSize,
              setCurPage,
              setCurPageSize
            )}
          </div>
        </div>
      )}

      {/* ─── UNIVERSAL TAXONOMY MODALS ─── */}

      {/* Subject Modal */}
      {modalMode === "subject" && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingItem.id ? "Edit Subject" : "Create New Subject"}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Subject Name *</label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g. Quantum Computing"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                  <Input
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    placeholder="e.g. STEM, Coding, Languages"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Slug (URL)</label>
                  <Input
                    value={editingItem.slug}
                    onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 p-3 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Brief curriculum description..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveSub"
                  checked={editingItem.isActive ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveSub" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Active in Marketplace Search
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {saving ? "Saving..." : "Save Subject"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {modalMode === "language" && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingItem.id ? "Edit Language" : "Add Language"}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLanguage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Language Name *</label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g. Swedish"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">ISO Code (2-char) *</label>
                  <Input
                    value={editingItem.code}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                    placeholder="e.g. sv"
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Native Name</label>
                  <Input
                    value={editingItem.nativeName}
                    onChange={(e) => setEditingItem({ ...editingItem, nativeName: e.target.value })}
                    placeholder="e.g. Svenska"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {saving ? "Saving..." : "Save Language"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Country Modal */}
      {modalMode === "country" && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingItem.id ? "Edit Country" : "Add Country"}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCountry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Country Name *</label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g. Sweden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">ISO Code (2-char) *</label>
                  <Input
                    value={editingItem.code}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                    placeholder="e.g. SE"
                    maxLength={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Dial Code</label>
                  <Input
                    value={editingItem.dialCode}
                    onChange={(e) => setEditingItem({ ...editingItem, dialCode: e.target.value })}
                    placeholder="e.g. +46"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Currency Code</label>
                  <Input
                    value={editingItem.currencyCode}
                    onChange={(e) => setEditingItem({ ...editingItem, currencyCode: e.target.value })}
                    placeholder="e.g. SEK, EUR, USD"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Continent</label>
                  <Input
                    value={editingItem.continent}
                    onChange={(e) => setEditingItem({ ...editingItem, continent: e.target.value })}
                    placeholder="e.g. Europe, Asia"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {saving ? "Saving..." : "Save Country"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timezone Modal */}
      {modalMode === "timezone" && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingItem.id ? "Edit Timezone" : "Add Timezone"}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTimezone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">IANA Identifier *</label>
                <Input
                  value={editingItem.identifier}
                  onChange={(e) => setEditingItem({ ...editingItem, identifier: e.target.value })}
                  placeholder="e.g. Europe/Stockholm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Display Label *</label>
                <Input
                  value={editingItem.displayName}
                  onChange={(e) => setEditingItem({ ...editingItem, displayName: e.target.value })}
                  placeholder="e.g. (UTC+01:00) Stockholm, Oslo, Copenhagen"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">UTC Offset</label>
                  <Input
                    value={editingItem.utcOffset}
                    onChange={(e) => setEditingItem({ ...editingItem, utcOffset: e.target.value })}
                    placeholder="e.g. UTC+01:00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Region</label>
                  <Input
                    value={editingItem.region}
                    onChange={(e) => setEditingItem({ ...editingItem, region: e.target.value })}
                    placeholder="e.g. Europe"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {saving ? "Saving..." : "Save Timezone"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
