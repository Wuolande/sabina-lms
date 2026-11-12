"use client";

import * as React from "react";
import { BarChart3, TrendingUp, Users, BookOpen, DollarSign, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { adminService } from "@/services/adminService";
import { formatCurrency } from "@/lib/utils";

export default function AdminReportsPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const loadReports = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getReports();
      setData(res);
    } catch (err) {
      console.error('[AdminReportsPage] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summary = data?.summary || {
    activeStudents: 0,
    completionRate: 0,
    avgHourlyRate: 0,
    retentionRate: 0,
  };

  const topSubjects: any[] = data?.topSubjects || [];
  const maxRevenue = topSubjects.length > 0 ? Math.max(...topSubjects.map((s) => s.revenue || 1), 1) : 1;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Marketplace Analytics & Demand
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live subject volume, student acquisition channels, and lesson completion metrics.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadReports}
          disabled={loading}
          className="text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Analytics</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Active Students"
          value={summary.activeStudents}
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 18, isPositive: true, label: "Live Active" }}
        />
        <StatCard
          title="Avg Lesson Completion"
          value={`${summary.completionRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="brand"
        />
        <StatCard
          title="Avg Hourly Rate"
          value={formatCurrency(summary.avgHourlyRate)}
          icon={<DollarSign className="h-5 w-5" />}
          description="Across all approved tutors"
        />
        <StatCard
          title="Student Retention"
          value={`${summary.retentionRate}%`}
          icon={<BookOpen className="h-5 w-5" />}
          variant="accent"
          description="Repeat learners"
        />
      </div>

      {/* Top Subjects Distribution Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Top Subject Disciplines by Booking Revenue
          </h3>
          <span className="text-xs text-slate-400 font-mono">Live Volume</span>
        </div>

        {topSubjects.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No subject revenue recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {topSubjects.map((sub, idx) => {
              const widthPct = Math.max(Math.round((sub.revenue / maxRevenue) * 100), 5);
              return (
                <div key={sub.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-900">
                    <span>
                      {idx + 1}. {sub.name} <span className="text-slate-400 font-normal">({sub.category})</span>
                    </span>
                    <span className="text-brand-700">
                      {formatCurrency(sub.revenue)} ({sub.bookings} sessions)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-brand-700 rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
