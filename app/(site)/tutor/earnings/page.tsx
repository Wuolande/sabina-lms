"use client";

import * as React from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { tutorService } from "@/services/tutorService";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TutorEarningsPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isWithdrawOpen, setIsWithdrawOpen] = React.useState(false);
  const [withdrawSubmitting, setWithdrawSubmitting] = React.useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = React.useState(false);

  const loadEarnings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await tutorService.getEarnings();
      setData(res);
    } catch (err) {
      console.error('[TutorEarningsPage] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const summary = data?.summary || {
    lifetimeEarnings: 0,
    currentBalance: 0,
    pendingClearance: 0,
    lifetimeDisbursed: 0,
    hourlyRate: 45,
    currency: "USD",
    platformFeeRate: 18,
  };

  const recentTransactions: any[] = data?.recentTransactions || [];
  const platformCommissionTotal = Math.round(summary.lifetimeEarnings * 0.18 * 100) / 100;
  const netPayoutTotal = Math.round((summary.lifetimeEarnings - platformCommissionTotal) * 100) / 100;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawSubmitting(true);
    try {
      await tutorService.requestPayout(summary.currentBalance, summary.currency);
      setWithdrawSuccess(true);
      setTimeout(() => {
        setIsWithdrawOpen(false);
        setWithdrawSuccess(false);
        loadEarnings();
      }, 1500);
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Earnings & Payouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your net earnings, platform commission breakdowns, and automated Stripe Connect payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadEarnings}
            disabled={loading}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            className="font-bold bg-brand-700 hover:bg-brand-800 shadow-card"
            onClick={() => setIsWithdrawOpen(true)}
            leftIcon={<ArrowUpRight className="h-4 w-4" />}
          >
            Request Early Payout
          </Button>
        </div>
      </div>

      {/* 4 Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Gross Revenue"
          value={formatCurrency(summary.lifetimeEarnings)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Platform Fee (18%)"
          value={formatCurrency(platformCommissionTotal)}
          icon={<Clock className="h-5 w-5" />}
          description="Covers video, payment processing"
        />
        <StatCard
          title="Net Earnings"
          value={formatCurrency(netPayoutTotal)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="accent"
        />
        <StatCard
          title="Available to Withdraw"
          value={formatCurrency(summary.currentBalance)}
          icon={<CreditCard className="h-5 w-5" />}
          description="Ready for bank transfer"
        />
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Lesson Earnings Breakdown ({recentTransactions.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">Net 82% Payout</span>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No lesson earnings recorded yet. Your confirmed sessions will appear here.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Fee (18%)</TableHead>
                <TableHead>Net Tutor Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs font-bold text-brand-700">
                    {tx.bookingRef || tx.id}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-900">
                    {tx.studentName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {tx.subjectName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell className="text-xs text-red-600 font-medium">
                    -{formatCurrency(tx.platformFee)}
                  </TableCell>
                  <TableCell className="text-xs font-extrabold text-emerald-700">
                    {formatCurrency(tx.netAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.status === "SETTLED" ? "success" : "default"} size="sm">
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Early Payout Modal */}
      <Modal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        title="Request Early Balance Payout"
        description="Transfer your eligible available earnings directly to your connected bank account."
      >
        {withdrawSuccess ? (
          <div className="text-center py-6 space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Payout Initiated!</h4>
            <p className="text-xs text-slate-500">
              Funds will arrive in your bank account via Stripe Connect in 1-2 business days.
            </p>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-600 font-bold uppercase">Available Amount:</span>
              <strong className="text-2xl font-black text-slate-900">
                {formatCurrency(summary.currentBalance)}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Direct deposit to your verified bank account via Stripe Connect.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsWithdrawOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                type="submit"
                disabled={withdrawSubmitting || summary.currentBalance <= 0}
                className="font-bold bg-brand-700 hover:bg-brand-800"
              >
                {withdrawSubmitting ? "Processing..." : `Confirm & Transfer ${formatCurrency(summary.currentBalance)}`}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
