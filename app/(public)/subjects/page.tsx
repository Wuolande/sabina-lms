"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Search, ArrowRight, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { tutorService } from "@/services/tutorService";
import { Subject } from "@/types";

export default function SubjectsPage() {
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("All");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    tutorService.getAllSubjects().then((data) => {
      setSubjects(data);
      setLoading(false);
    });
  }, []);

  const categories = React.useMemo(() => {
    const set = new Set(subjects.map((s) => s.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [subjects]);

  const filtered = subjects.filter((s) => {
    const matchCat = filter === "All" || s.category.toLowerCase() === filter.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* ── Header ── */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="subtle" size="sm" className="bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
          Complete Subject Directory ({subjects.length} Disciplines)
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Explore all subjects & disciplines
        </h1>
        <p className="text-base text-slate-600">
          Find certified 1-on-1 educators in over {subjects.length}+ academic fields, languages, software engineering, and test prep.
        </p>

        {/* Search Input */}
        <div className="max-w-md mx-auto relative pt-2">
          <input
            type="text"
            placeholder="Search subjects (e.g., Python, IELTS, Calculus)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 mt-1 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === cat
                ? "bg-slate-950 text-white shadow-card font-extrabold"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-100 border border-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((sub) => (
            <div
              key={sub.id}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 font-bold shadow-xs">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.popular && (
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 text-amber-500 fill-amber-500" /> Featured
                      </span>
                    )}
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                      {sub.tutorCount || 10}+ Tutors
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-4">
                  {sub.name}
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mt-0.5">
                  {sub.category}
                </span>
                <p className="text-xs sm:text-[13px] text-slate-500 mt-2 leading-relaxed">
                  {sub.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link href={`/find-tutors?subject=${sub.slug}`}>
                  <Button variant="default" size="sm" className="font-bold text-xs bg-slate-950 hover:bg-slate-800 text-white rounded-xl">
                    Find Tutors
                  </Button>
                </Link>
                <Link href={`/find-tutors?subject=${sub.slug}`} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                  <span>Browse Educators</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400">
              No subjects found matching &ldquo;{search}&rdquo;.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
