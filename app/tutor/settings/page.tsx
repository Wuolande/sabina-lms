"use client";

import * as React from "react";
import Link from "next/link";
import {
  DollarSign,
  CreditCard,
  Bell,
  Shield,
  Trash2,
  Save,
  Download,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  Eye,
  EyeOff,
  HelpCircle,
  Percent,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  Lock,
  Globe,
  Sliders,
  Check,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { useModal } from "@/components/ui/modal-context";
import { tutorService } from "@/services/tutorService";

export default function TutorSettingsAndRatesPage() {
  const { toast } = useModal();
  const [activeTab, setActiveTab] = React.useState("rates");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Settings State
  const [settings, setSettings] = React.useState<any | null>(null);

  // Tab 1: Rates & Discounts
  const [hourlyRate, setHourlyRate] = React.useState(45);
  const [currency, setCurrency] = React.useState("USD");
  const [trialLessonEnabled, setTrialLessonEnabled] = React.useState(true);
  const [trialLessonPrice, setTrialLessonPrice] = React.useState(20);
  const [fiveLessonsDiscount, setFiveLessonsDiscount] = React.useState(5);
  const [tenLessonsDiscount, setTenLessonsDiscount] = React.useState(10);
  const [twentyLessonsDiscount, setTwentyLessonsDiscount] = React.useState(15);

  // Tab 2: Payouts
  const [payoutMethod, setPayoutMethod] = React.useState("STRIPE");
  const [payoutSchedule, setPayoutSchedule] = React.useState("WEEKLY");
  const [minThreshold, setMinThreshold] = React.useState(50);
  const [payoutAccount, setPayoutAccount] = React.useState("sarah.jenkins.bank@example.com");

  // Tab 3: Notifications
  const [emailLessonBooked, setEmailLessonBooked] = React.useState(true);
  const [emailMessages, setEmailMessages] = React.useState(true);
  const [emailReviews, setEmailReviews] = React.useState(true);
  const [smsReminders, setSmsReminders] = React.useState(true);

  // Tab 4: Security (Password)
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [updatingPassword, setUpdatingPassword] = React.useState(false);

  // Tab 5: Privacy & Deactivation
  const [hideFromSearch, setHideFromSearch] = React.useState(false);
  const [anonymousReviews, setAnonymousReviews] = React.useState(false);

  // Deactivation Modal
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = React.useState(false);
  const [deactivationReason, setDeactivationReason] = React.useState("Taking a break from teaching");
  const [deactivating, setDeactivating] = React.useState(false);

  // GDPR Deletion Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [deleteReason, setDeleteReason] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await tutorService.getSettings();
      if (data) {
        setSettings(data);
        setHourlyRate(Number(data.hourlyRate) || 45);
        setCurrency(data.currency || "USD");
        setTrialLessonEnabled(data.trialLessonEnabled ?? true);
        setTrialLessonPrice(Number(data.trialLessonPrice) || 20);

        if (data.packageDiscounts) {
          setFiveLessonsDiscount(Number(data.packageDiscounts.fiveLessons) || 5);
          setTenLessonsDiscount(Number(data.packageDiscounts.tenLessons) || 10);
          setTwentyLessonsDiscount(Number(data.packageDiscounts.twentyLessons) || 15);
        }

        if (data.payoutSettings) {
          setPayoutMethod(data.payoutSettings.method || "STRIPE");
          setPayoutSchedule(data.payoutSettings.schedule || "WEEKLY");
          setMinThreshold(Number(data.payoutSettings.minThreshold) || 50);
          setPayoutAccount(data.payoutSettings.accountDetails || "");
        }

        if (data.notificationPreferences) {
          setEmailLessonBooked(data.notificationPreferences.emailLessonBooked ?? true);
          setEmailMessages(data.notificationPreferences.emailMessages ?? true);
          setEmailReviews(data.notificationPreferences.emailReviews ?? true);
          setSmsReminders(data.notificationPreferences.smsReminders ?? true);
        }

        if (data.privacySettings) {
          setHideFromSearch(data.privacySettings.hideFromSearch ?? false);
          setAnonymousReviews(data.privacySettings.anonymousReviews ?? false);
        }
      }
    } catch {
      toast({ title: "Error", message: "Failed to load settings.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      hourlyRate: Number(hourlyRate),
      currency,
      trialLessonEnabled,
      trialLessonPrice: Number(trialLessonPrice),
      packageDiscounts: {
        fiveLessons: Number(fiveLessonsDiscount),
        tenLessons: Number(tenLessonsDiscount),
        twentyLessons: Number(twentyLessonsDiscount),
      },
      payoutSettings: {
        method: payoutMethod,
        currency,
        schedule: payoutSchedule,
        minThreshold: Number(minThreshold),
        accountDetails: payoutAccount,
      },
      notificationPreferences: {
        emailLessonBooked,
        emailMessages,
        emailReviews,
        smsReminders,
      },
      privacySettings: {
        hideFromSearch,
        anonymousReviews,
      },
    };

    const ok = await tutorService.updateSettings(payload);
    setSaving(false);

    if (ok) {
      toast({
        title: "Settings Saved",
        message: "Your teaching rates, payout settings, and preferences have been updated live.",
        variant: "success",
      });
      loadSettings();
    } else {
      toast({ title: "Error", message: "Failed to save settings.", variant: "danger" });
    }
  };

  // Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Weak Password", message: "Password must be at least 8 characters.", variant: "danger" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", message: "Passwords do not match.", variant: "danger" });
      return;
    }

    setUpdatingPassword(true);
    const res = await fetch("/api/user/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setUpdatingPassword(false);

    if (res.ok) {
      toast({ title: "Password Changed", message: "Your password has been updated securely.", variant: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const j = await res.json();
      toast({ title: "Error", message: j.error || "Failed to update password.", variant: "danger" });
    }
  };

  // Deactivate
  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeactivating(true);
    const ok = await tutorService.deactivateAccount(deactivationReason);
    setDeactivating(false);
    setIsDeactivateModalOpen(false);

    if (ok) {
      toast({
        title: "Account Paused",
        message: "Your tutor profile is now paused. You can reactivate anytime by logging back in.",
        variant: "info",
      });
      loadSettings();
    } else {
      toast({ title: "Error", message: "Failed to deactivate account.", variant: "danger" });
    }
  };

  // GDPR Permanent Delete
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmation !== "DELETE MY ACCOUNT PERMANENTLY") {
      toast({ title: "Confirmation Error", message: "Please type the exact confirmation phrase.", variant: "danger" });
      return;
    }

    setDeleting(true);
    const result = await tutorService.deleteAccountGdpr(deleteConfirmation, deleteReason);
    setDeleting(false);

    if (result.success) {
      toast({
        title: "Account Deleted",
        message: "Your account and personal data have been permanently erased under GDPR.",
        variant: "danger",
      });
      setIsDeleteModalOpen(false);
      window.location.href = "/login";
    } else {
      toast({ title: "Error", message: result.error || "Failed to delete account.", variant: "danger" });
    }
  };

  // Calculate Net Earnings Breakdown (Sabina fee: 15%)
  const platformFeePercent = 15;
  const netHourlyPayout = (hourlyRate * (1 - platformFeePercent / 100)).toFixed(2);
  const netTrialPayout = (trialLessonPrice * (1 - platformFeePercent / 100)).toFixed(2);
  const net10PackPayout = ((hourlyRate * 10 * (1 - tenLessonsDiscount / 100)) * (1 - platformFeePercent / 100)).toFixed(2);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Settings & Teaching Rates
              </h1>
              <Badge variant="neutral" size="sm" className="bg-indigo-50 text-[#14209C] border-indigo-200">
                Tutor Preferences
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your hourly pricing, trial discounts, payout channels, and GDPR data privacy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="default"
              disabled={saving}
              onClick={handleSaveSettings}
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save All Settings"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "rates", label: "Teaching Rates & Discounts", icon: <DollarSign className="w-4 h-4" /> },
          { id: "payouts", label: "Payout Methods & Banking", icon: <CreditCard className="w-4 h-4" /> },
          { id: "notifications", label: "Notification Rules", icon: <Bell className="w-4 h-4" /> },
          { id: "security", label: "Security & Login", icon: <Shield className="w-4 h-4" /> },
          { id: "privacy", label: "Data Privacy & Governance", icon: <Trash2 className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="line"
      />

      {/* TAB 1: RATES & DISCOUNTS */}
      {activeTab === "rates" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rates Form (2 cols) */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Lesson Pricing & Package Bundles
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set competitive rates to attract regular students and boost long-term bookings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-900">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Standard Hourly Rate (USD / 50 min)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="pl-9 font-bold text-base"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Average rate for your subject: $35–$60/hr</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    25-Minute Trial Lesson
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        disabled={!trialLessonEnabled}
                        value={trialLessonPrice}
                        onChange={(e) => setTrialLessonPrice(Number(e.target.value))}
                        className="pl-9 font-bold"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={trialLessonEnabled}
                        onChange={(e) => setTrialLessonEnabled(e.target.checked)}
                        className="rounded border-slate-300 text-[#14209C] focus:ring-[#14209C]"
                      />
                      <span>Enabled</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Package Discounts */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[#14209C]" />
                  <span>Lesson Package Discounts</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Offering package discounts encourages students to purchase prepaid bundles of lessons.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="font-bold text-slate-900 block">5-Lesson Package</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={fiveLessonsDiscount}
                        onChange={(e) => setFiveLessonsDiscount(Number(e.target.value))}
                        className="font-bold text-center"
                      />
                      <span className="font-bold text-slate-500">% Off</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="font-bold text-slate-900 block">10-Lesson Package</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={tenLessonsDiscount}
                        onChange={(e) => setTenLessonsDiscount(Number(e.target.value))}
                        className="font-bold text-center"
                      />
                      <span className="font-bold text-slate-500">% Off</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="font-bold text-slate-900 block">20-Lesson Package</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={twentyLessonsDiscount}
                        onChange={(e) => setTwentyLessonsDiscount(Number(e.target.value))}
                        className="font-bold text-center"
                      />
                      <span className="font-bold text-slate-500">% Off</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Earnings Simulator Card */}
            <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 p-6 sm:p-7 space-y-5 h-fit shadow-xs">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#14209C] flex items-center justify-center text-white">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Earnings Calculator</h4>
                  <p className="text-[11px] text-slate-500">Based on standard 15% platform fee</p>
                </div>
              </div>

              <div className="space-y-3 divide-y divide-indigo-100 text-xs">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600">Gross Hourly Price:</span>
                  <span className="font-bold text-slate-900">${hourlyRate}.00</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600">Platform Fee (15%):</span>
                  <span className="text-rose-600 font-semibold">-${(hourlyRate * 0.15).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between pt-3 text-sm">
                  <span className="font-bold text-[#14209C]">Net Payout per 50-min:</span>
                  <span className="font-black text-[#14209C] text-base">${netHourlyPayout}</span>
                </div>

                {trialLessonEnabled && (
                  <div className="flex items-center justify-between pt-2 text-xs">
                    <span className="text-slate-600">Net Trial Lesson Payout:</span>
                    <span className="font-bold text-emerald-700">${netTrialPayout}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-slate-600">Net 10-Lesson Package:</span>
                  <span className="font-bold text-emerald-700">${net10PackPayout}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/90 border border-indigo-100/80 text-[11px] text-slate-500 leading-relaxed">
                💡 <strong>Tutor Tip:</strong> Tutors with package discounts enabled receive on average 3.2x more prepaid lesson bookings.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYOUTS */}
      {activeTab === "payouts" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Payout Channels & Banking Settings
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select how and when you receive your lesson earnings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-900">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Payout Method
              </label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              >
                <option value="STRIPE">Stripe Connect (Direct Bank Deposit)</option>
                <option value="PAYPAL">PayPal</option>
                <option value="WISE">Wise (TransferWise)</option>
                <option value="SWIFT">International Bank Wire (SWIFT / IBAN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payout Schedule
              </label>
              <select
                value={payoutSchedule}
                onChange={(e) => setPayoutSchedule(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              >
                <option value="WEEKLY">Weekly (Every Monday)</option>
                <option value="BI_WEEKLY">Bi-Weekly (1st and 15th)</option>
                <option value="MONTHLY">Monthly (1st of each month)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Minimum Payout Threshold (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(Number(e.target.value))}
                  className="pl-9 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Account Details / Email / IBAN
              </label>
              <Input
                value={payoutAccount}
                onChange={(e) => setPayoutAccount(e.target.value)}
                placeholder="e.g. your-email@paypal.com or IBAN"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Payout Security Verification Active</span>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Earnings are protected by automated 48-hour fraud screening. All payouts are sent securely according to your selected schedule.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Communication & Notification Preferences
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose how and when Sabina notifies you about lessons, messages, and student activity.
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-800">
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
              <input
                type="checkbox"
                checked={emailLessonBooked}
                onChange={(e) => setEmailLessonBooked(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#14209C] focus:ring-[#14209C]"
              />
              <div>
                <span className="font-bold text-slate-900 block">Lesson Bookings & Schedule Changes</span>
                <span className="text-slate-500 text-[11px]">
                  Receive immediate email alerts whenever a student books, reschedules, or cancels a lesson.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
              <input
                type="checkbox"
                checked={emailMessages}
                onChange={(e) => setEmailMessages(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#14209C] focus:ring-[#14209C]"
              />
              <div>
                <span className="font-bold text-slate-900 block">Student Direct Messages</span>
                <span className="text-slate-500 text-[11px]">
                  Get notified when prospective or active students send inquiries in chat.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
              <input
                type="checkbox"
                checked={emailReviews}
                onChange={(e) => setEmailReviews(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#14209C] focus:ring-[#14209C]"
              />
              <div>
                <span className="font-bold text-slate-900 block">Student Reviews & Ratings</span>
                <span className="text-slate-500 text-[11px]">
                  Receive notifications when students submit lesson reviews so you can publish your reply.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
              <input
                type="checkbox"
                checked={smsReminders}
                onChange={(e) => setSmsReminders(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#14209C] focus:ring-[#14209C]"
              />
              <div>
                <span className="font-bold text-slate-900 block">Urgent 15-Minute Lesson SMS / WhatsApp Reminders</span>
                <span className="text-slate-500 text-[11px]">
                  Get high-priority mobile reminders shortly before classroom start times.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & LOGIN */}
      {activeTab === "security" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Account Security & Password
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage your login credentials and active browser sessions.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="max-w-xl space-y-4 text-xs text-slate-900">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                New Password (Min 8 Characters)
              </label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong new password"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button
              type="submit"
              disabled={updatingPassword}
              variant="default"
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{updatingPassword ? "Updating Password..." : "Update Password"}</span>
            </Button>
          </form>
        </div>
      )}

      {/* TAB 5: PRIVACY & GDPR GOVERNANCE */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          {/* Data Export (Right to Access) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#14209C]" />
                  <span>Download Personal Data Archive (GDPR Right to Access)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Export a complete machine-readable JSON archive of all your profile data, lessons history, and student reviews.
                </p>
              </div>

              <a href="/api/tutor/settings/export-data" download>
                <Button variant="outline" size="sm" className="font-bold text-xs flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON Archive</span>
                </Button>
              </a>
            </div>

            {/* Visibility Settings */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Hide Profile from External Search Engines</span>
                  <span className="text-slate-500 text-[11px]">
                    Prevents Google and other search engines from indexing your tutor marketplace page.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hideFromSearch}
                  onChange={(e) => setHideFromSearch(e.target.checked)}
                  className="rounded border-slate-300 text-[#14209C] focus:ring-[#14209C]"
                />
              </label>
            </div>
          </div>

          {/* Account Deactivation (Temporary) */}
          <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                  <PauseCircle className="w-4 h-4 text-amber-600" />
                  <span>Temporarily Deactivate / Pause Account</span>
                </h3>
                <p className="text-xs text-amber-800/90 mt-0.5">
                  Temporarily hides your profile and pauses new booking requests. Your teaching records, reviews, and materials remain safe for when you return.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeactivateModalOpen(true)}
                className="font-bold text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                <span>Deactivate Account</span>
              </Button>
            </div>
          </div>

          {/* Permanent Account Deletion (GDPR Danger Zone) */}
          <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Permanent Account Deletion (GDPR Right to Erasure)</span>
                </h3>
                <p className="text-xs text-rose-800/90 mt-0.5">
                  Permanently deletes your account and erases all personal identity records in accordance with global data protection laws. This action is irreversible.
                </p>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                <span>Delete Account Permanently</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Account Modal */}
      <Modal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        title="Temporarily Deactivate Tutor Account"
        description="Your profile will be hidden from search results. You can reactivate anytime."
      >
        <form onSubmit={handleDeactivate} className="space-y-4 pt-2 text-slate-900">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Deactivating
            </label>
            <select
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Taking a break from teaching">Taking a temporary break from teaching</option>
              <option value="Schedule fully booked elsewhere">Schedule is fully booked elsewhere</option>
              <option value="Traveling / Holiday">Traveling / On Holiday</option>
              <option value="Personal reasons">Personal reasons</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            Note: Any upcoming confirmed lessons will remain scheduled unless manually cancelled.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsDeactivateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={deactivating}
              className="font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {deactivating ? "Deactivating..." : "Confirm Deactivation"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* GDPR Permanent Delete Account Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Permanently Delete Account (GDPR Right to Erasure)"
        description="WARNING: This action is permanent and cannot be undone."
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4 pt-2 text-slate-900">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
            <span className="font-bold block">Irreversible Data Erasure:</span>
            <p className="text-[11px] leading-relaxed">
              In compliance with GDPR and CCPA, all your personal identifying information (name, email, avatar, bio, and credentials) will be permanently erased.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Leaving (Optional)
            </label>
            <Textarea
              rows={2}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Help us improve Sabina LMS..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">
              Type <strong className="font-mono text-slate-900">DELETE MY ACCOUNT PERMANENTLY</strong> to confirm
            </label>
            <Input
              required
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE MY ACCOUNT PERMANENTLY"
              className="font-mono text-xs border-rose-300 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={deleting || deleteConfirmation !== "DELETE MY ACCOUNT PERMANENTLY"}
              className="font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleting ? "Erasing Data..." : "Permanently Delete Account"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
