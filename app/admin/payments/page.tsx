"use client";

import * as React from "react";
import { DollarSign, TrendingUp, CreditCard, ShieldCheck } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { mockTutorEarnings } from "@/lib/mock-data/earnings";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Payments & Revenue Ledger
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Gross student volume, platform commission splits (18%), and merchant settlements.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Inflows"
          value="$342,500.00"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Platform Take (18%)"
          value="$61,650.00"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="brand"
        />
        <StatCard
          title="Tutor Disbursements"
          value="$280,850.00"
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          title="Refund Rate"
          value="0.3%"
          icon={<ShieldCheck className="h-5 w-5" />}
          variant="accent"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Recent Payment Events
        </h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Ref</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Gross Amount</TableHead>
              <TableHead>Platform Fee (18%)</TableHead>
              <TableHead>Net to Tutor</TableHead>
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
                <TableCell className="text-xs font-bold text-slate-900">
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell className="text-xs font-bold text-brand-700">
                  +{formatCurrency(tx.platformFee)}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {formatCurrency(tx.netAmount)}
                </TableCell>
                <TableCell>
                  <Badge variant="success" size="sm">
                    SETTLED
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
