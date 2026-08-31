"use client";

import * as React from "react";
import { DollarSign, TrendingUp, CreditCard, ShieldCheck, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { adminService } from "@/services/adminService";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const loadPayments = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getPayments();
      setData(res);
    } catch (err) {
      console.error('[AdminPaymentsPage] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const summary = data?.summary || {
    grossInflows: 0,
    platformTake: 0,
    tutorDisbursements: 0,
    refundRate: 0,
    totalTransactions: 0,
  };

  const transactions: any[] = data?.transactions || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Payments & Revenue Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gross student volume, platform commission splits (18%), and merchant settlements.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadPayments}
          disabled={loading}
          className="text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Inflows"
          value={formatCurrency(summary.grossInflows)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Platform Take (18%)"
          value={formatCurrency(summary.platformTake)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="brand"
        />
        <StatCard
          title="Tutor Disbursements"
          value={formatCurrency(summary.tutorDisbursements)}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          title="Refund Rate"
          value={`${summary.refundRate}%`}
          icon={<ShieldCheck className="h-5 w-5" />}
          variant="accent"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Live Payment Events ({transactions.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">18% Platform Take Active</span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No payment transactions recorded yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Ref</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Gross Amount</TableHead>
                <TableHead>Platform Fee (18%)</TableHead>
                <TableHead>Net to Tutor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs font-bold text-brand-700">
                    {tx.bookingRef}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-900">
                    {tx.studentName}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-700">
                    {tx.tutorName}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900">
                    {formatCurrency(tx.grossAmount)}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-emerald-700">
                    +{formatCurrency(tx.platformFee)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatCurrency(tx.tutorPayout)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.status === "PAID" || tx.status === "SETTLED"
                          ? "success"
                          : tx.status === "REFUNDED"
                          ? "destructive"
                          : "default"
                      }
                      size="sm"
                    >
                      {tx.status}
                    </Badge>
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
