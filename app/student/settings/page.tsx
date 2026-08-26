"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Globe,
  Clock,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Download,
  AlertTriangle,
  Trash2,
  PauseCircle,
  Bell,
  Sparkles,
  Camera,
  Target,
  BookOpen,
  Check,
  FileText,
  Sliders,
  ExternalLink,
  Laptop,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { FileUploadWithLink } from "@/components/ui/FileUploadWithLink";
import { useModal } from "@/components/ui/modal-context";
import { studentService } from "@/services/studentService";

export default function StudentSettingsPage() {
  const { toast } = useModal();
  const [activeTab, setActiveTab] = React.useState("profile");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [settingsData, setSettingsData] = React.useState<any | null>(null);

  // Profile Form State
  const [displayName, setDisplayName] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [country, setCountry] = React.useState("United States");
  const [timezone, setTimezone] = React.useState("America/New_York");
  const [preferredLanguage, setPreferredLanguage] = React.useState("English");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Learning Preferences Form State
  const [targetExam, setTargetExam] = React.useState("");
  const [currentLevel, setCurrentLevel] = React.useState("Intermediate");
  const [weeklyStudyHoursTarget, setWeeklyStudyHoursTarget] = React.useState(6);
  const [homeworkPreference, setHomeworkPreference] = React.useState("moderate");
  const [learningStyleNotes, setLearningStyleNotes] = React.useState("");

  // Notification Preferences State
  const [notifEmail, setNotifEmail] = React.useState(true);
  const [notifInApp, setNotifInApp] = React.useState(true);
  const [notifReminders, setNotifReminders] = React.useState(true);
  const [notifSms, setNotifSms] = React.useState(false);
  const [notifMarketing, setNotifMarketing] = React.useState(false);

  // Privacy Settings State
  const [shareGoalsWithTutors, setShareGoalsWithTutors] = React.useState(true);
  const [showProfileInLeaderboards, setShowProfileInLeaderboards] = React.useState(true);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [updatingPassword, setUpdatingPassword] = React.useState(false);

  // Deactivation & Delete Modals
  const [isDeactivateOpen, setIsDeactivateOpen] = React.useState(false);
  const [deactivateReason, setDeactivateReason] = React.useState("Taking a break from studies");
  const [isDeactivating, setIsDeactivating] = React.useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Taxonomy Reference Data
  const [countriesList, setCountriesList] = React.useState<any[]>([]);
  const [timezonesList, setTimezonesList] = React.useState<any[]>([]);
  const [languagesList, setLanguagesList] = React.useState<any[]>([]);

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      // Parallel fetch settings + taxonomy
      const [data, cRes, tzRes, lRes] = await Promise.all([
        studentService.getSettings360(),
        fetch('/api/countries').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/timezones').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/languages').then((r) => (r.ok ? r.json() : [])),
      ]);

      if (cRes) setCountriesList(cRes);
      if (tzRes) setTimezonesList(tzRes);
      if (lRes) setLanguagesList(lRes);

      setSettingsData(data);
      if (data) {
        // User
        setDisplayName(data.user?.displayName || "Alex Rivera");
        setFirstName(data.user?.firstName || "Alex");
        setLastName(data.user?.lastName || "Rivera");
        setEmail(data.user?.email || "alex.rivera@example.com");
        setPhone(data.user?.phone || "+1 (555) 987-6543");
        setCountry(data.user?.country || "United States");
        setTimezone(data.user?.timezone || "America/New_York");
        setPreferredLanguage(data.user?.preferredLanguage || "English");
        setAvatarUrl(data.user?.avatarUrl || "");

        // Learning Preferences
        setTargetExam(data.learningPreferences?.targetExam || "IELTS 7.5+ & Advanced Math");
        setCurrentLevel(data.learningPreferences?.currentLevel || "Intermediate");
        setWeeklyStudyHoursTarget(data.learningPreferences?.weeklyStudyHoursTarget || 6);
        setHomeworkPreference(data.learningPreferences?.homeworkPreference || "moderate");
        setLearningStyleNotes(data.learningPreferences?.learningStyleNotes || "");

        // Notification Preferences
        if (data.notificationPreferences) {
          setNotifEmail(data.notificationPreferences.email ?? true);
          setNotifInApp(data.notificationPreferences.inApp ?? true);
          setNotifReminders(data.notificationPreferences.reminders ?? true);
          setNotifSms(data.notificationPreferences.sms ?? false);
          setNotifMarketing(data.notificationPreferences.marketing ?? false);
        }

        // Privacy Settings
        if (data.privacySettings) {
          setShareGoalsWithTutors(data.privacySettings.shareGoalsWithTutors ?? true);
          setShowProfileInLeaderboards(data.privacySettings.showProfileInLeaderboards ?? true);
        }
      }
    } catch {
      toast({ title: "Error", message: "Failed to load student settings.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Handle Avatar Upload via Cloudinary API
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setAvatarUrl(data.secure_url);

      // Save directly to user profile
      await studentService.updateSettings({
        user: { avatarUrl: data.secure_url },
      });

      toast({
        title: "Photo Updated",
        message: "Your new profile picture is now live across your student account.",
        variant: "success",
      });
    } catch {
      toast({ title: "Upload Failed", message: "Could not upload image. Please try again.", variant: "danger" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save Settings Form
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        user: {
          displayName: `${firstName.trim()} ${lastName.trim()}`.trim() || displayName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          country,
          timezone,
          preferredLanguage,
          avatarUrl,
        },
        learningPreferences: {
          targetExam,
          currentLevel,
          weeklyStudyHoursTarget: Number(weeklyStudyHoursTarget),
          homeworkPreference,
          learningStyleNotes,
        },
        notificationPreferences: {
          email: notifEmail,
          inApp: notifInApp,
          reminders: notifReminders,
          sms: notifSms,
          marketing: notifMarketing,
        },
        privacySettings: {
          shareGoalsWithTutors,
          showProfileInLeaderboards,
        },
      };

      const updated = await studentService.updateSettings(payload);
      if (updated) {
        setSettingsData(updated);
        toast({
          title: "Settings Saved",
          message: "Your student profile and preferences have been updated successfully.",
          variant: "success",
        });
      }
    } catch {
      toast({ title: "Error", message: "Failed to save settings.", variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  // Password Change Handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Weak Password", message: "New password must be at least 8 characters.", variant: "warning" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", message: "New passwords do not match.", variant: "danger" });
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Password update failed");
      }

      toast({
        title: "Password Changed",
        message: "Your account password was updated successfully.",
        variant: "success",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Error", message: err.message || "Failed to update password.", variant: "danger" });
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Deactivate Account Handler
  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      const ok = await studentService.deactivateAccount(deactivateReason);
      if (ok) {
        toast({
          title: "Account Paused",
          message: "Your student account has been temporarily deactivated.",
          variant: "info",
        });
        setIsDeactivateOpen(false);
        loadSettings();
      }
    } catch {
      toast({ title: "Error", message: "Failed to deactivate account.", variant: "danger" });
    } finally {
      setIsDeactivating(false);
    }
  };

  // Delete Account Handler (GDPR Right to Erasure)
  const handleDeleteAccount = async () => {
    const requiredPhrase = `DELETE ${displayName.toUpperCase()}`;
    if (deleteConfirmation.trim().toUpperCase() !== requiredPhrase) {
      toast({
        title: "Confirmation Mismatch",
        message: `Please type exactly "${requiredPhrase}" to proceed.`,
        variant: "warning",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const ok = await studentService.deleteAccountPermanently(deleteConfirmation.trim());
      if (ok) {
        toast({
          title: "Account Erased",
          message: "Your student data has been permanently deleted in compliance with GDPR.",
          variant: "info",
        });
        window.location.href = "/";
      }
    } catch {
      toast({ title: "Error", message: "Failed to delete account.", variant: "danger" });
    } finally {
      setIsDeleting(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };
  const passStrength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Settings & Preferences
            </h1>
            <Badge variant="neutral" size="sm" className="bg-indigo-50 text-[#14209C] border-indigo-200">
              Student Account Governance
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal profile, study objectives, notification channels, security, and GDPR privacy.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/student/settings/export-data"
            target="_blank"
            rel="noopener noreferrer"
            download
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Learning Archive</span>
            </Button>
          </a>

          <Button
            variant="default"
            size="sm"
            onClick={() => handleSaveSettings()}
            disabled={saving}
            className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Check className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save All Changes"}</span>
          </Button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <Tabs
        tabs={[
          { id: "profile", label: "Profile & Identity", icon: <User className="w-4 h-4" /> },
          { id: "learning", label: "Study Goals & Pace", icon: <Target className="w-4 h-4" /> },
          { id: "notifications", label: "Notifications & Reminders", icon: <Bell className="w-4 h-4" /> },
          { id: "security", label: "Password & Security", icon: <Lock className="w-4 h-4" /> },
          { id: "privacy", label: "Privacy & GDPR Governance", icon: <Shield className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="line"
      />

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: PROFILE & PERSONAL DETAILS
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            {/* Avatar Row */}
            <div className="pb-6 border-b border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{displayName}</h3>
                <Badge variant="success" size="xs" className="font-bold">Active Student</Badge>
              </div>
              <FileUploadWithLink
                label="Student Profile Picture"
                description="Upload photo to Cloudinary or paste image URL. Files are virus & malware scanned."
                type="image"
                value={avatarUrl}
                onChange={(url) => setAvatarUrl(url)}
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  First Name *
                </label>
                <Input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Alex"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Last Name *
                </label>
                <Input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Rivera"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <Input
                  disabled
                  value={email}
                  leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Primary login and notification email.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="h-4 w-4 text-slate-400" />}
                  placeholder="+1 (555) 987-6543"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <SearchableSelect
                  label="Country of Residence"
                  placeholder="Select country..."
                  searchPlaceholder="Search 170+ countries..."
                  value={country}
                  onChange={setCountry}
                  options={
                    countriesList.length > 0
                      ? countriesList.map((c) => ({
                          value: c.name,
                          label: c.name,
                          sublabel: `${c.continent} • ${c.dialCode}`,
                        }))
                      : [country || "United States"]
                  }
                />
              </div>

              <div>
                <SearchableSelect
                  label="Local Timezone"
                  placeholder="Select timezone..."
                  searchPlaceholder="Search 60+ timezones..."
                  value={timezone}
                  onChange={setTimezone}
                  options={
                    timezonesList.length > 0
                      ? timezonesList.map((tz) => ({
                          value: tz.identifier,
                          label: tz.identifier,
                          sublabel: `${tz.utcOffset} • ${tz.displayName}`,
                        }))
                      : [timezone || "America/New_York"]
                  }
                />
              </div>

              <div>
                <SearchableSelect
                  label="Preferred Language"
                  placeholder="Select language..."
                  searchPlaceholder="Search 70+ languages..."
                  value={preferredLanguage}
                  onChange={setPreferredLanguage}
                  options={
                    languagesList.length > 0
                      ? languagesList.map((l) => ({
                          value: l.name,
                          label: l.name,
                          sublabel: `${l.nativeName} (${l.code})`,
                        }))
                      : [preferredLanguage || "English"]
                  }
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                variant="default"
                className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs"
              >
                {saving ? "Saving Changes..." : "Save Profile Details"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: STUDY GOALS & PACE PREFERENCES
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "learning" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-[#14209C]" />
                <span>Learning Objectives & Study Pace</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                These settings personalize your roadmap and help instructors prepare customized materials.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Exam / Focus Goal *
                </label>
                <Input
                  required
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="e.g. IELTS Academic 7.5+, SAT Math 800, Python Mastery"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Current Proficiency Level
                </label>
                <select
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                >
                  <option value="Beginner">Beginner (Foundations & Basics)</option>
                  <option value="Intermediate">Intermediate (Skill Building & Conversation)</option>
                  <option value="Advanced">Advanced (Exam Preparation & Fluency)</option>
                  <option value="Fluent / Expert">Fluent / Expert (Professional Mastery)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Weekly Study Target (Hours / Week)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={40}
                  value={weeklyStudyHoursTarget}
                  onChange={(e) => setWeeklyStudyHoursTarget(Number(e.target.value))}
                />
                <p className="text-[11px] text-slate-400 mt-1">Recommended: 4–8 hours for consistent mastery.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Homework & Exercise Preference
                </label>
                <select
                  value={homeworkPreference}
                  onChange={(e) => setHomeworkPreference(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                >
                  <option value="heavy">Intensive (Worksheets & Assignments after every class)</option>
                  <option value="moderate">Moderate (Short exercises & reading recommendations)</option>
                  <option value="light">Light (Practice questions only when requested)</option>
                  <option value="none">Live Only (Discussion and in-class practice only)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Learning Style & Special Needs (Shared with Tutors)
              </label>
              <textarea
                rows={3}
                value={learningStyleNotes}
                onChange={(e) => setLearningStyleNotes(e.target.value)}
                placeholder="e.g. Visual learner. Prefer interactive mock tests and coding exercises over theoretical slides..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                variant="default"
                className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs"
              >
                {saving ? "Saving..." : "Save Learning Preferences"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: NOTIFICATIONS & REMINDERS
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "notifications" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Notification Channels & Automated Reminders
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose how and when Sabina LMS sends you lesson alerts, tutor feedback, and updates.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-slate-900 block">
                    Email Notifications
                  </strong>
                  <p className="text-[11px] text-slate-500">
                    Receive lesson booking confirmations, tutor homework alerts, and payment receipts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifEmail}
                  onChange={(e) => setNotifEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-[#14209C] focus:ring-[#14209C] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-slate-900 block">
                    Upcoming Class Reminders (1 Hour & 15 Mins Prior)
                  </strong>
                  <p className="text-[11px] text-slate-500">
                    Automated countdown notifications with direct LiveKit classroom launch links.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifReminders}
                  onChange={(e) => setNotifReminders(e.target.checked)}
                  className="w-4 h-4 rounded text-[#14209C] focus:ring-[#14209C] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-slate-900 block">
                    In-App Notification Center & Audio Chimes
                  </strong>
                  <p className="text-[11px] text-slate-500">
                    Receive flyout alerts and bell badges on direct chat messages and homework reviews.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifInApp}
                  onChange={(e) => setNotifInApp(e.target.checked)}
                  className="w-4 h-4 rounded text-[#14209C] focus:ring-[#14209C] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-slate-900 block">
                    SMS & WhatsApp Alerts
                  </strong>
                  <p className="text-[11px] text-slate-500">
                    Get instantaneous text notifications on mobile for emergency schedule changes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifSms}
                  onChange={(e) => setNotifSms(e.target.checked)}
                  className="w-4 h-4 rounded text-[#14209C] focus:ring-[#14209C] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-slate-900 block">
                    Promotional Learning Discounts & Newsletters
                  </strong>
                  <p className="text-[11px] text-slate-500">
                    Occasional offers on multi-session bundles and exam preparation workshops.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifMarketing}
                  onChange={(e) => setNotifMarketing(e.target.checked)}
                  className="w-4 h-4 rounded text-[#14209C] focus:ring-[#14209C] cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                variant="default"
                className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs"
              >
                {saving ? "Saving..." : "Save Notification Preferences"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 4: PASSWORD & SECURITY
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Password Change Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Change Password
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensure your account is using a strong, unique password with at least 8 characters.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Current Password *
                </label>
                <Input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <Input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                />

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passStrength <= 25
                            ? "bg-rose-500 w-1/4"
                            : passStrength <= 50
                            ? "bg-amber-500 w-2/4"
                            : passStrength <= 75
                            ? "bg-blue-500 w-3/4"
                            : "bg-emerald-500 w-full"
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Strength: {passStrength >= 75 ? "Strong" : passStrength >= 50 ? "Moderate" : "Weak"}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password *
                </label>
                <Input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                />
              </div>

              <Button
                type="submit"
                disabled={updatingPassword}
                variant="default"
                className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs"
              >
                {updatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </div>

          {/* Active Sessions & Security Overview */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Active Login Session
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#14209C]">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">
                    Current Web Browser Session
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    IP: 192.168.1.1 • Location: {country} • Active Now
                  </span>
                </div>
              </div>

              <Badge variant="success" size="xs" className="font-bold">
                Online & Verified
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 5: PRIVACY & GDPR GOVERNANCE
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          {/* GDPR Rights Overview */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>GDPR Data Privacy & Control</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Under GDPR Article 15 & 17, you retain full rights to access, export, or erase your personal identifiable data.
              </p>
            </div>

            {/* Privacy Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-slate-900 block">
                    Share Learning Goals with Verified Instructors
                  </strong>
                  <p className="text-[11px] text-slate-500">
                    Allows your booked tutors to view active milestones and prepare tailored worksheets.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={shareGoalsWithTutors}
                  onChange={(e) => setShareGoalsWithTutors(e.target.checked)}
                  className="w-4 h-4 rounded text-[#14209C] focus:ring-[#14209C] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-slate-900 block">
                    Display Anonymized Learning Streak in Community Leaderboards
                  </strong>
                  <p className="text-[11px] text-slate-500">
                    Show your consecutive study streak on student rankings without exposing private contact info.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showProfileInLeaderboards}
                  onChange={(e) => setShowProfileInLeaderboards(e.target.checked)}
                  className="w-4 h-4 rounded text-[#14209C] focus:ring-[#14209C] cursor-pointer"
                />
              </div>
            </div>

            {/* Export Data Card */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <strong className="text-xs font-bold text-slate-900 block">
                  Export My Learning & Billing Data (GDPR Portability)
                </strong>
                <p className="text-[11px] text-slate-500">
                  Download a complete JSON package containing your profile, lesson history, milestones, and invoice receipts.
                </p>
              </div>

              <a
                href="/api/student/settings/export-data"
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Button variant="outline" size="sm" className="text-xs font-bold shrink-0 bg-white">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Archive (.json)
                </Button>
              </a>
            </div>
          </div>

          {/* Danger Zone: Deactivate & Delete */}
          <div className="rounded-3xl border border-rose-200 bg-rose-50/30 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="pb-3 border-b border-rose-200/70">
              <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Account Deactivation & Permanent Erasure</span>
              </h3>
              <p className="text-xs text-rose-700/80 mt-0.5">
                Actions in this section affect account accessibility and permanent storage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deactivate Box */}
              <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">
                    Temporary Account Deactivation
                  </strong>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pause upcoming lesson reminders and notifications without deleting your past study history or worksheets.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeactivateOpen(true)}
                  className="text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50 w-full"
                >
                  <PauseCircle className="w-3.5 h-3.5 mr-1.5" />
                  Deactivate Account
                </Button>
              </div>

              {/* Permanent Delete Box */}
              <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <strong className="text-xs font-bold text-rose-900 block">
                    Permanently Delete Account (GDPR Erasure)
                  </strong>
                  <p className="text-[11px] text-rose-700/80 mt-1">
                    Irreversibly anonymizes and erases all personal identity records, payment methods, and profiles.
                  </p>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white w-full"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Permanently Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: TEMPORARY DEACTIVATION ── */}
      <Modal
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        title="Temporarily Deactivate Student Account"
        description="Your lesson records and worksheets will remain safely archived until you log back in."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Deactivating
            </label>
            <select
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            >
              <option value="Taking a break from studies">Taking a break from studies</option>
              <option value="Completed target examination">Completed target examination</option>
              <option value="Financial or scheduling reasons">Financial or scheduling reasons</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsDeactivateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isDeactivating ? "Deactivating..." : "Confirm Deactivation"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL 2: PERMANENT GDPR ERASURE ── */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="⚠️ Permanently Delete Student Account"
        description="This action is irreversible under GDPR Right to Erasure. All profile records, payment cards, and private goals will be permanently deleted."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
            To confirm permanent deletion, please type:
            <strong className="block font-mono text-xs font-black mt-1 text-rose-950">
              DELETE {displayName.toUpperCase()}
            </strong>
          </div>

          <Input
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder={`DELETE ${displayName.toUpperCase()}`}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmation.trim().toUpperCase() !== `DELETE ${displayName.toUpperCase()}`}
              className="font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? "Erasing Data..." : "Permanently Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
