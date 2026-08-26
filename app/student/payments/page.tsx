"use client";

import * as React from "react";
import Link from "next/link";
import {
  CreditCard,
  Download,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Plus,
  Search,
  FileText,
  Printer,
  Calendar,
  Clock,
  Trash2,
  Check,
  DollarSign,
  Building,
  Mail,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { useModal } from "@/components/ui/modal-context";
import { studentService } from "@/services/studentService";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

export default function StudentPaymentsPage() {
  const { toast } = useModal();
  const [activeTab, setActiveTab] = React.useState("invoices");
  const [billingData, setBillingData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  // Selected invoice for Receipt Modal
  const [selectedInvoice, setSelectedInvoice] = React.useState<any | null>(null);

  // Add Card Modal
  const [isAddCardOpen, setIsAddCardOpen] = React.useState(false);
  const [cardBrand, setCardBrand] = React.useState("Visa");
  const [cardNumber, setCardNumber] = React.useState("");
  const [expMonth, setExpMonth] = React.useState(8);
  const [expYear, setExpYear] = React.useState(2028);
  const [isDefaultCard, setIsDefaultCard] = React.useState(true);
  const [addingCard, setAddingCard] = React.useState(false);

  // Billing Profile Form
  const [billingName, setBillingName] = React.useState("");
  const [billingEmail, setBillingEmail] = React.useState("");
  const [taxId, setTaxId] = React.useState("");
  const [addressLine1, setAddressLine1] = React.useState("");
  const [city, setCity] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [country, setCountry] = React.useState("United States");
  const [savingProfile, setSavingProfile] = React.useState(false);

  const loadBilling = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentService.getBilling360();
      setBillingData(data);
      if (data?.billingProfile) {
        setBillingName(data.billingProfile.billingName || "");
        setBillingEmail(data.billingProfile.billingEmail || "");
        setTaxId(data.billingProfile.taxId || "");
        setAddressLine1(data.billingProfile.addressLine1 || "");
        setCity(data.billingProfile.city || "");
        setPostalCode(data.billingProfile.postalCode || "");
        setCountry(data.billingProfile.country || "United States");
      }
    } catch {
      toast({ title: "Error", message: "Failed to load billing history.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const last4Digits = cardNumber.replace(/\s+/g, "").slice(-4) || "4242";

    setAddingCard(true);
    try {
      const updated = await studentService.addPaymentMethod({
        cardBrand,
        last4: last4Digits,
        expMonth: Number(expMonth),
        expYear: Number(expYear),
        isDefault: isDefaultCard,
      });

      if (updated) {
        setBillingData(updated);
        toast({ title: "Card Added", message: `${cardBrand} ending in ${last4Digits} saved successfully.`, variant: "success" });
        setIsAddCardOpen(false);
        setCardNumber("");
      }
    } catch {
      toast({ title: "Error", message: "Failed to save payment method.", variant: "danger" });
    } finally {
      setAddingCard(false);
    }
  };

  const handleDeleteCard = async (methodId: string) => {
    try {
      const updated = await studentService.deletePaymentMethod(methodId);
      if (updated) {
        setBillingData(updated);
        toast({ title: "Card Removed", message: "Payment method has been deleted.", variant: "info" });
      }
    } catch {
      toast({ title: "Error", message: "Failed to delete payment card.", variant: "danger" });
    }
  };

  const handleSetDefaultCard = async (methodId: string) => {
    try {
      const updated = await studentService.setDefaultPaymentMethod(methodId);
      if (updated) {
        setBillingData(updated);
        toast({ title: "Default Updated", message: "Default payment method updated.", variant: "success" });
      }
    } catch {
      toast({ title: "Error", message: "Failed to set default card.", variant: "danger" });
    }
  };

  const handleSaveBillingProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await studentService.updateBillingProfile({
        billingName,
        billingEmail,
        taxId,
        addressLine1,
        city,
        postalCode,
        country,
      });

      if (updated) {
        setBillingData(updated);
        toast({ title: "Billing Info Saved", message: "Official invoice details updated.", variant: "success" });
      }
    } catch {
      toast({ title: "Error", message: "Failed to update billing details.", variant: "danger" });
    } finally {
      setSavingProfile(false);
    }
  };

  const invoices: any[] = billingData?.invoices || [];
  const paymentMethods: any[] = billingData?.paymentMethods || [];
  const summary = billingData?.summary || { totalSpent: 0, totalInvoices: 0, paidInvoices: 0, averagePerLesson: 0 };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.bookingRef.toLowerCase().includes(search.toLowerCase()) ||
      inv.tutorName.toLowerCase().includes(search.toLowerCase()) ||
      inv.subjectName.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && inv.status === statusFilter;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Billing & Invoices
            </h1>
            <Badge variant="neutral" size="sm" className="bg-indigo-50 text-[#14209C] border-indigo-200">
              256-Bit SSL Encrypted
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your payment methods, transaction receipts, and official tax invoice settings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Ledger</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddCardOpen(true)}
            className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Payment Card</span>
          </Button>
        </div>
      </div>

      {/* 2. Financial Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Spent"
          value={formatCurrency(summary.totalSpent, "USD")}
          icon={<DollarSign className="h-5 w-5 text-[#14209C]" />}
          description="Cumulative lesson investment"
        />
        <StatCard
          title="Settled Invoices"
          value={`${summary.paidInvoices} of ${summary.totalInvoices}`}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          description="All payments confirmed"
        />
        <StatCard
          title="Average Lesson Cost"
          value={formatCurrency(summary.averagePerLesson, "USD")}
          icon={<CreditCard className="h-5 w-5 text-blue-600" />}
          description="Per 50-minute session"
        />
        <StatCard
          title="Active Payment Cards"
          value={paymentMethods.length}
          icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
          description="Default: Visa •••• 4242"
        />
      </div>

      {/* 3. Navigation Tabs */}
      <Tabs
        tabs={[
          { id: "invoices", label: `Invoices & Receipts (${invoices.length})`, icon: <FileText className="w-4 h-4" /> },
          { id: "methods", label: `Saved Cards (${paymentMethods.length})`, icon: <CreditCard className="w-4 h-4" /> },
          { id: "profile", label: "Billing & Tax Profile", icon: <Building className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="line"
      />

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: INVOICES & RECEIPT LEDGER
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "invoices" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              {["ALL", "PAID", "PENDING", "REFUNDED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? "bg-[#14209C] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "ALL" ? "All Invoices" : st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search invoice, ref, tutor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pl-9 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading invoice ledger...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p>No invoices found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Instructor & Subject</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-[#14209C]">
                        {inv.id}
                        <span className="block text-[10px] text-slate-400 font-normal">{inv.bookingRef}</span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(inv.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar src={inv.tutorAvatar} fallbackName={inv.tutorName} size="xs" />
                          <div className="min-w-0">
                            <strong className="text-xs font-bold text-slate-900 block truncate">
                              {inv.subjectName}
                            </strong>
                            <span className="text-[11px] text-slate-500">
                              {inv.tutorName}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">
                        {inv.durationMinutes} mins
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 capitalize">
                        💳 {inv.paymentMethod}
                      </TableCell>
                      <TableCell className="text-xs font-black text-slate-900">
                        {formatCurrency(inv.amount, inv.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={inv.status === "PAID" ? "success" : inv.status === "REFUNDED" ? "neutral" : "destructive"}
                          size="xs"
                          className="font-bold"
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoice(inv)}
                          className="text-xs font-bold flex items-center gap-1 ml-auto"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Receipt</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: SAVED PAYMENT CARDS
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "methods" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Saved Cards & Payment Channels
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your payment information is securely stored via Stripe with end-to-end tokenization.
                </p>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => setIsAddCardOpen(true)}
                className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Card</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg space-y-6 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tracking-widest uppercase text-indigo-200">
                        {pm.cardBrand}
                      </span>
                      {pm.isDefault && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Default Card
                        </span>
                      )}
                    </div>
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Card Chip Visual */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 rounded-lg bg-amber-400/80 border border-amber-300/40 shadow-xs flex items-center justify-center">
                      <div className="w-6 h-4 border border-amber-600/40 rounded-xs" />
                    </div>
                    <span className="text-lg sm:text-xl font-mono tracking-widest font-bold text-slate-100">
                      •••• •••• •••• {pm.last4}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700/60">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Expires
                      </span>
                      <strong className="font-mono text-slate-200">
                        {pm.expMonth < 10 ? `0${pm.expMonth}` : pm.expMonth}/{pm.expYear}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {!pm.isDefault && (
                        <button
                          onClick={() => handleSetDefaultCard(pm.id)}
                          className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCard(pm.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title="Remove Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: BILLING & TAX PROFILE
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "profile" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Official Tax & Invoice Details
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These details will automatically appear on all downloadable PDF receipts and tax invoices.
            </p>
          </div>

          <form onSubmit={handleSaveBillingProfile} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Billing / Full Name *
                </label>
                <Input
                  required
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  placeholder="e.g. Alex Rivera or Rivera Consulting LLC"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Invoice Delivery Email *
                </label>
                <Input
                  type="email"
                  required
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="e.g. billing@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tax / VAT Registration ID (Optional)
              </label>
              <Input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="e.g. US-EIN-987654321 or GB123456789"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Street Address
              </label>
              <Input
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="e.g. 742 Evergreen Terrace"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  City
                </label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Springfield"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Postal Code
                </label>
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 97477"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Country
                </label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                disabled={savingProfile}
                variant="default"
                className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs"
              >
                {savingProfile ? "Saving..." : "Save Billing Information"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL 1: ADD PAYMENT METHOD ── */}
      <Modal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        title="Add Credit or Debit Card"
        description="Enter your card details for instant lesson bookings and recurring schedules."
        maxWidth="md"
      >
        <form onSubmit={handleAddCard} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Card Brand
            </label>
            <select
              value={cardBrand}
              onChange={(e) => setCardBrand(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            >
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="American Express">American Express</option>
              <option value="Discover">Discover</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Card Number *
            </label>
            <Input
              required
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              leftIcon={<CreditCard className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Exp Month
              </label>
              <Input
                type="number"
                min={1}
                max={12}
                value={expMonth}
                onChange={(e) => setExpMonth(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Exp Year
              </label>
              <Input
                type="number"
                min={2026}
                max={2035}
                value={expYear}
                onChange={(e) => setExpYear(Number(e.target.value))}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefaultCard}
              onChange={(e) => setIsDefaultCard(e.target.checked)}
              className="rounded text-[#14209C] focus:ring-[#14209C]"
            />
            <span>Set as my default payment method</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddCardOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={addingCard}
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white"
            >
              {addingCard ? "Saving..." : "Save Card"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 2: OFFICIAL INVOICE & RECEIPT ── */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title="Official Tax Invoice & Receipt"
          description={`Invoice #${selectedInvoice.id} • Issued on ${formatDate(selectedInvoice.date)}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 pt-2 text-slate-900 print:p-0">
            {/* Invoice Header Banner */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#14209C] uppercase block">
                  Sabina LMS Education Ltd.
                </span>
                <strong className="text-base font-black text-slate-900">Sabina Edge Learning Marketplace</strong>
                <p className="text-xs text-slate-500">VAT ID: EU-984-210-99 • support@sabinaedge.com</p>
              </div>

              <div className="text-right">
                <Badge variant="success" size="sm" className="font-bold">
                  Status: {selectedInvoice.status}
                </Badge>
                <span className="text-[11px] font-mono text-slate-400 block mt-1">Ref: {selectedInvoice.bookingRef}</span>
              </div>
            </div>

            {/* Billed to */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To (Student)</span>
                <strong className="text-slate-900 font-bold block">{billingName || "Alex Rivera"}</strong>
                <p className="text-slate-500">{billingEmail || "alex.rivera@example.com"}</p>
                <p className="text-slate-500">{addressLine1}, {city} {postalCode}</p>
                {taxId && <p className="text-slate-700 font-mono font-bold">Tax ID: {taxId}</p>}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Summary</span>
                <p className="text-slate-700">Payment Date: <strong className="text-slate-900">{formatDate(selectedInvoice.date)}</strong></p>
                <p className="text-slate-700">Channel: <strong className="text-slate-900 capitalize">{selectedInvoice.paymentMethod}</strong></p>
                <p className="text-slate-700">LiveKit Room: <span className="font-mono text-slate-600">Active</span></p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <div className="grid grid-cols-12 bg-slate-100 p-3 font-bold text-slate-700 uppercase text-[10px]">
                <div className="col-span-7">Item & Instructor</div>
                <div className="col-span-2 text-center">Duration</div>
                <div className="col-span-3 text-right">Total</div>
              </div>

              <div className="grid grid-cols-12 p-3.5 border-t border-slate-100 items-center">
                <div className="col-span-7 space-y-0.5">
                  <strong className="text-slate-900 block">{selectedInvoice.subjectName}</strong>
                  <span className="text-slate-500">Instructor: {selectedInvoice.tutorName}</span>
                </div>
                <div className="col-span-2 text-center font-semibold text-slate-700">
                  {selectedInvoice.durationMinutes} mins
                </div>
                <div className="col-span-3 text-right font-black text-slate-900 text-sm">
                  {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                </div>
              </div>

              <div className="bg-slate-50/80 p-3.5 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Platform Video & Security Fee</span>
                <span className="font-bold text-emerald-600">INCLUDED ($0.00)</span>
              </div>

              <div className="p-4 border-t border-slate-200 flex justify-between items-center text-base font-black text-slate-950 font-heading bg-indigo-50/40">
                <span>Total Amount Paid</span>
                <span>{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
              </div>
            </div>

            {/* Print & Download Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Authorized electronic receipt generated by Sabina LMS.
              </span>

              <Button
                variant="default"
                size="sm"
                onClick={() => window.print()}
                className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Invoice</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
