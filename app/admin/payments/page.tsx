"use client";

import * as React from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  FlaskConical,
  Search,
  Settings,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { GatewayLogo } from "@/components/payments/PaymentLogos";
import { adminService } from "@/services/adminService";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [gatewayFilter, setGatewayFilter] = React.useState<string>("all");
  const [modeFilter, setModeFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

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

  const rawTransactions: any[] = data?.transactions || [];

  // Filter transactions
  const transactions = React.useMemo(() => {
    return rawTransactions.filter((tx) => {
      // Gateway filter
      if (gatewayFilter !== "all") {
        const gw = (tx.paymentGateway || tx.paymentMethod || "").toLowerCase();
        if (gw !== gatewayFilter.toLowerCase()) return false;
      }

      // Mode filter
      if (modeFilter !== "all") {
        const mode = (tx.paymentMode || "sandbox").toLowerCase();
        if (mode !== modeFilter.toLowerCase()) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const ref = (tx.bookingRef || "").toLowerCase();
        const student = (tx.studentName || "").toLowerCase();
        const tutor = (tx.tutorName || "").toLowerCase();
        const intent = (tx.paymentIntentId || "").toLowerCase();
        if (!ref.includes(query) && !student.includes(query) && !tutor.includes(query) && !intent.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [rawTransactions, gatewayFilter, modeFilter, searchQuery]);

  const liveCount = rawTransactions.filter((t) => (t.paymentMode || "").toLowerCase() === "live").length;
  const sandboxCount = rawTransactions.filter((t) => (t.paymentMode || "sandbox").toLowerCase() === "sandbox").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Payments & Revenue Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gross student volume, platform commission splits (18%), and multi-gateway merchant settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/settings">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Gateway Settings</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayments}
            disabled={loading}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
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

      {/* Main Ledger Table Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-5">
        {/* Table Toolbar / Filters */}
        <div className="space-y-3 pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Transaction Events ({transactions.length})
              </h3>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">18% Platform Take</span>
            </div>

            {/* Mode Indicator Pills */}
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live: {liveCount}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                <FlaskConical className="h-3 w-3 text-amber-600" />
                Sandbox: {sandboxCount}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative min-w-[240px] max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ref, student, tutor, or intent ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/60"
              />
            </div>

            {/* Gateway Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Gateway:</span>
              {[
                { id: "all", label: "All Gateways" },
                { id: "stripe", label: "Stripe" },
                { id: "paypal", label: "PayPal" },
                { id: "razorpay", label: "Razorpay" },
                { id: "paystack", label: "Paystack" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setGatewayFilter(btn.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    gatewayFilter === btn.id
                      ? "bg-slate-900 text-white shadow-xs font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Mode Filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Mode:</span>
              {[
                { id: "all", label: "All" },
                { id: "live", label: "Live Only" },
                { id: "sandbox", label: "Sandbox" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setModeFilter(btn.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    modeFilter === btn.id
                      ? "bg-brand text-white shadow-xs font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No payment transactions match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Ref</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Gross Amount</TableHead>
                  <TableHead>Platform Fee (18%)</TableHead>
                  <TableHead>Net to Tutor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const isLive = (tx.paymentMode || "").toLowerCase() === "live";
                  const gw = tx.paymentGateway || tx.paymentMethod || "stripe";

                  return (
                    <TableRow key={tx.id}>
                      {/* Ref & Intent */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="font-mono text-xs font-bold text-brand-700 block">
                            {tx.bookingRef}
                          </span>
                          {tx.paymentIntentId && (
                            <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[120px]">
                              {tx.paymentIntentId}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </TableCell>

                      {/* Gateway Logo */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <GatewayLogo gateway={gw} className="h-4" />
                        </div>
                      </TableCell>

                      {/* Mode Badge */}
                      <TableCell>
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            LIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <FlaskConical className="h-2.5 w-2.5 text-amber-700" />
                            SANDBOX
                          </span>
                        )}
                      </TableCell>

                      {/* Student */}
                      <TableCell className="text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {tx.studentName}
                      </TableCell>

                      {/* Tutor */}
                      <TableCell className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {tx.tutorName}
                      </TableCell>

                      {/* Gross Amount */}
                      <TableCell className="text-xs font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(tx.grossAmount, tx.currency || "USD")}
                      </TableCell>

                      {/* Platform Fee */}
                      <TableCell className="text-xs font-bold text-emerald-700 whitespace-nowrap">
                        +{formatCurrency(tx.platformFee, tx.currency || "USD")}
                      </TableCell>

                      {/* Tutor Payout */}
                      <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                        {formatCurrency(tx.tutorPayout, tx.currency || "USD")}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={
                            tx.status === "PAID" || tx.status === "SETTLED" || tx.status === "CONFIRMED"
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
