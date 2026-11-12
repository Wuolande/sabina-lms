"use client";

import * as React from "react";
import { DollarSign, CheckCircle2, Clock, Lock, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { adminService } from "@/services/adminService";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminPayoutsPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const loadPayouts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getPayouts();
      setData(res);
    } catch (err) {
      console.error('[AdminPayoutsPage] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  const handleReleaseFunds = async (tutorId: string) => {
    setProcessingId(tutorId);
    try {
      await adminService.processPayout(tutorId, 'process');
      await loadPayouts();
    } finally {
      setProcessingId(null);
    }
  };

  const summary = data?.summary || {
    totalDisbursed: 0,
    pendingReviewCount: 0,
    totalTutors: 0,
  };

  const payouts: any[] = data?.payouts || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tutor Payout Disbursements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automated batch payouts, tutor net balances, and disbursement releases.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadPayouts}
          disabled={loading}
          className="text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Payouts</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Net Tutor Disbursed"
          value={formatCurrency(summary.totalDisbursed)}
          icon={<DollarSign className="h-5 w-5" />}
          variant="brand"
        />
        <StatCard
          title="Payouts Ready for Review"
          value={summary.pendingReviewCount}
          icon={<Clock className="h-5 w-5" />}
          variant="accent"
        />
        <StatCard
          title="Total Enrolled Educators"
          value={summary.totalTutors}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Tutor Balance & Disbursement Roster ({payouts.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">Net 82% After Fees</span>
        </div>

        {payouts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No tutor payout records available.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payout Ref</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Completed Lessons</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Platform Fee</TableHead>
                <TableHead>Net Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs font-bold text-brand-700">
                    {p.id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">
                        {p.tutor?.name || "Tutor"}
                      </strong>
                      <span className="text-[10px] text-slate-400">
                        {p.tutor?.email || p.tutor?.country}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">
                    {p.completedLessonsCount} sessions
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatCurrency(p.grossEarnings)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-amber-700">
                    {formatCurrency(p.platformFee)}
                  </TableCell>
                  <TableCell className="text-xs font-black text-slate-900">
                    {formatCurrency(p.netPayout)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === "PAID" || p.status === "PROCESSED"
                          ? "success"
                          : p.status === "PROCESSING"
                          ? "warning"
                          : "default"
                      }
                      size="sm"
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.netPayout > 0 && p.status !== "PAID" && (
                      <Button
                        variant="default"
                        size="sm"
                        disabled={processingId === p.tutorId}
                        onClick={() => handleReleaseFunds(p.tutorId)}
                        className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1 ml-auto"
                      >
                        <Send className="w-3 h-3" />
                        <span>{processingId === p.tutorId ? "Processing..." : "Release Funds"}</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
