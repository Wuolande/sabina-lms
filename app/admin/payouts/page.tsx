"use client";

import * as React from "react";
import { DollarSign, CheckCircle2, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { mockTutors } from "@/lib/mock-data/tutors";
import { formatCurrency } from "@/lib/utils";

export default function AdminPayoutsPage() {
  const payouts = [
    { id: "po-101", tutor: mockTutors[0].user.displayName, amount: 1240.0, method: "Stripe Direct (UK)", status: "PAID", date: "2026-08-20" },
    { id: "po-102", tutor: mockTutors[1].user.displayName, amount: 890.0, method: "Stripe Direct (US)", status: "PAID", date: "2026-08-19" },
    { id: "po-103", tutor: mockTutors[2].user.displayName, amount: 640.0, method: "Stripe Direct (FR)", status: "PROCESSING", date: "2026-08-22" },
    { id: "po-104", tutor: mockTutors[4].user.displayName, amount: 780.0, method: "Stripe Direct (CA)", status: "PENDING", date: "2026-08-23" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Tutor Payout Disbursements
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Automated batch payouts and manual disbursement overrides.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payout Ref</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Net Amount</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Date</TableHead>
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
                <TableCell className="text-xs font-bold text-slate-900">
                  {p.tutor}
                </TableCell>
                <TableCell className="text-xs font-black text-slate-900">
                  {formatCurrency(p.amount)}
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {p.method}
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {p.date}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      p.status === "PAID"
                        ? "success"
                        : p.status === "PROCESSING"
                        ? "warning"
                        : "subtle"
                    }
                    size="sm"
                  >
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {p.status === "PENDING" && (
                    <Button variant="default" size="sm" className="h-7 text-xs font-bold bg-emerald-600">
                      Release Funds
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
