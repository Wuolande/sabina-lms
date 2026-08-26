"use client";

import * as React from "react";
import { BarChart3, TrendingUp, Users, BookOpen, DollarSign } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";

export default function AdminReportsPage() {
  const topSubjects = [
    { name: "English & IELTS Prep", bookings: 3420, revenue: 171000, share: "49.9%" },
    { name: "Mathematics & Calculus", bookings: 1850, revenue: 120250, share: "35.1%" },
    { name: "Python & Data Science", bookings: 1420, revenue: 120700, share: "35.2%" },
    { name: "Spanish", bookings: 980, revenue: 37240, share: "10.8%" },
    { name: "French", bookings: 760, revenue: 31920, share: "9.3%" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Marketplace Analytics & Demand
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          High-level subject volume, student acquisition channels, and lesson completion metrics.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Active Students"
          value="1,180"
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 24, isPositive: true, label: "MoM Growth" }}
        />
        <StatCard
          title="Avg Lesson Completion"
          value="98.8%"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="brand"
        />
        <StatCard
          title="Avg Hourly Rate"
          value="$51.40"
          icon={<DollarSign className="h-5 w-5" />}
          description="Across all categories"
        />
        <StatCard
          title="Student Retention"
          value="74.2%"
          icon={<BookOpen className="h-5 w-5" />}
          variant="accent"
          description="Booked 3+ lessons"
        />
      </div>

      {/* Top Subjects Distribution Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Top Subject Categories by Gross Revenue
        </h3>

        <div className="space-y-4">
          {topSubjects.map((sub, idx) => (
            <div key={sub.name} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-900">
                <span>{idx + 1}. {sub.name}</span>
                <span className="text-brand-700">${sub.revenue.toLocaleString()} ({sub.bookings} sessions)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-brand-700 rounded-full"
                  style={{ width: `${60 - idx * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
