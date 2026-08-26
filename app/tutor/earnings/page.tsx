"use client";

import * as React from "react";
import {
  DollarSign,
  TrendingUp,
  Download,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { mockTutorEarnings } from "@/lib/mock-data/earnings";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TutorEarningsPage() {
  const [isWithdrawOpen, setIsWithdrawOpen] = React.useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = React.useState(false);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawSuccess(true);
    setTimeout(() => {
      setIsWithdrawOpen(false);
      setWithdrawSuccess(false);
    }, 1500);
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

      {/* 4 Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Gross Revenue"
          value={formatCurrency(mockTutorEarnings.totalGrossEarned)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Platform Fee (18%)"
          value={formatCurrency(mockTutorEarnings.platformCommissionTotal)}
          icon={<Clock className="h-5 w-5" />}
          description="Covers video, payment processing"
        />
        <StatCard
          title="Net Earnings"
          value={formatCurrency(mockTutorEarnings.netPayoutTotal)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="accent"
        />
        <StatCard
          title="Available to Withdraw"
          value={formatCurrency(mockTutorEarnings.availableBalance)}
          icon={<CreditCard className="h-5 w-5" />}
          description="Auto-transferred on Sept 1"
        />
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Recent Lesson Earnings Breakdown
          </h3>
        </div>

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
            {mockTutorEarnings.recentTransactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-mono text-xs font-bold text-brand-700">
                  {tx.id}
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
                  <Badge variant="success" size="sm">
                    {tx.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                {formatCurrency(mockTutorEarnings.availableBalance)}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Direct deposit to Bank Account ending in •••• 1092 via Stripe Connect.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsWithdrawOpen(false)}>
                Cancel
              </Button>
              <Button variant="default" type="submit" className="font-bold bg-brand-700">
                Confirm & Transfer {formatCurrency(mockTutorEarnings.availableBalance)}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
