"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  DollarSign,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Video,
  Globe,
  GraduationCap,
  Award,
  Briefcase,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  RefreshCw,
  Save,
  Play,
  Layers,
  Star,
  Clock,
  Camera,
  UploadCloud,
  AlertCircle,
  Check,
  Info,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";
import { FileUploadWithLink } from "@/components/ui/FileUploadWithLink";
import { useModal } from "@/components/ui/modal-context";
import { tutorService } from "@/services/tutorService";

interface EducationItem {
  id?: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startYear: number;
  endYear: number;
  honors?: string;
  documentUrl?: string;
  documentName?: string;
  isVerified?: boolean;
}

interface CertificationItem {
  id?: string;
  title: string;
  issuer: string;
  issueYear: number;
  credentialId?: string;
  certificateUrl?: string;
  documentUrl?: string;
  documentName?: string;
  isVerified?: boolean;
}

interface ExperienceItem {
  id?: string;
  role: string;
  organization: string;
  location?: string;
  startYear: number;
  endYear?: number | null;
  description?: string;
}

export default function TutorProfileSettingsPage() {
  const { toast } = useModal();
  const [activeTab, setActiveTab] = React.useState("basic");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Profile data state
  const [profile, setProfile] = React.useState<any | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [timezone, setTimezone] = React.useState("");
  const [headline, setHeadline] = React.useState("");
  const [hourlyRate, setHourlyRate] = React.useState(40);
  const [currency, setCurrency] = React.useState("USD");
  const [yearsExperience, setYearsExperience] = React.useState(5);
  const [teachingStyle, setTeachingStyle] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [introVideoUrl, setIntroVideoUrl] = React.useState("");

  // Sub-lists
  const [educations, setEducations] = React.useState<EducationItem[]>([]);
  const [certifications, setCertifications] = React.useState<CertificationItem[]>([]);
  const [experiences, setExperiences] = React.useState<ExperienceItem[]>([]);

  // Education Modal
  const [isEduModalOpen, setIsEduModalOpen] = React.useState(false);
  const [newEduDegree, setNewEduDegree] = React.useState("");
  const [newEduField, setNewEduField] = React.useState("");
  const [newEduInst, setNewEduInst] = React.useState("");
  const [newEduStartYear, setNewEduStartYear] = React.useState(2015);
  const [newEduEndYear, setNewEduEndYear] = React.useState(2019);
  const [newEduHonors, setNewEduHonors] = React.useState("");
  const [newEduDocUrl, setNewEduDocUrl] = React.useState("");
  const [newEduDocName, setNewEduDocName] = React.useState("");

  // Certification Modal
  const [isCertModalOpen, setIsCertModalOpen] = React.useState(false);
  const [newCertTitle, setNewCertTitle] = React.useState("");
  const [newCertIssuer, setNewCertIssuer] = React.useState("");
  const [newCertYear, setNewCertYear] = React.useState(2020);
  const [newCertId, setNewCertId] = React.useState("");
  const [newCertDocUrl, setNewCertDocUrl] = React.useState("");
  const [newCertDocName, setNewCertDocName] = React.useState("");

  // Experience Modal
  const [isExpModalOpen, setIsExpModalOpen] = React.useState(false);
  const [newExpRole, setNewExpRole] = React.useState("");
  const [newExpOrg, setNewExpOrg] = React.useState("");
  const [newExpLoc, setNewExpLoc] = React.useState("");
  const [newExpStartYear, setNewExpStartYear] = React.useState(2018);
  const [newExpEndYear, setNewExpEndYear] = React.useState<number | null>(2022);
  const [newExpDesc, setNewExpDesc] = React.useState("");

  // Taxonomy Reference Data
  const [countriesList, setCountriesList] = React.useState<any[]>([]);
  const [timezonesList, setTimezonesList] = React.useState<any[]>([]);
  const [currenciesList, setCurrenciesList] = React.useState<any[]>([]);
  const [languagesList, setLanguagesList] = React.useState<any[]>([]);
  const [subjectsList, setSubjectsList] = React.useState<any[]>([]);

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const [data, cRes, tzRes, curRes, lRes, subRes] = await Promise.all([
        tutorService.getMyProfile(),
        tutorService.getAllCountries(),
        tutorService.getAllTimezones(),
        tutorService.getAllCurrencies(),
        tutorService.getAllLanguages(),
        tutorService.getAllSubjects(),
      ]);

      if (cRes) setCountriesList(cRes);
      if (tzRes) setTimezonesList(tzRes);
      if (curRes) setCurrenciesList(curRes);
      if (lRes) setLanguagesList(lRes);
      if (subRes) setSubjectsList(subRes);

      if (data) {
        setProfile(data);
        setAvatarUrl(data.user?.avatarUrl || "");
        setDisplayName(data.user?.displayName || "");
        setCountry(data.user?.country || "");
        setTimezone(data.user?.timezone || "");
        setHeadline(data.headline || "");
        setHourlyRate(Number(data.hourlyRate) || 40);
        setCurrency(data.currency || "USD");
        setYearsExperience(Number(data.yearsExperience) || 5);
        setTeachingStyle(data.teachingStyle || "");
        setBio(data.bio || "");
        setIntroVideoUrl(data.introVideoUrl || "");
        setEducations(data.educations || []);
        setCertifications(data.certifications || []);
        setExperiences(data.experiences || []);
      }
    } catch {
      toast({ title: "Error", message: "Failed to load tutor profile.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid File", message: "Please select an image file (PNG, JPG, WebP).", variant: "danger" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", message: "Avatar must be under 5MB.", variant: "danger" });
      return;
    }

    setUploadingAvatar(true);
    const newUrl = await tutorService.uploadAvatar(file);
    setUploadingAvatar(false);

    if (newUrl) {
      setAvatarUrl(newUrl);
      toast({
        title: "Avatar Uploaded",
        message: "Your new profile photo is uploaded to Cloudinary and live across Sabina LMS.",
        variant: "success",
      });
      loadProfile();
    } else {
      toast({ title: "Upload Failed", message: "Failed to upload avatar.", variant: "danger" });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      displayName,
      avatarUrl,
      country,
      timezone,
      headline,
      hourlyRate: Number(hourlyRate),
      currency,
      yearsExperience: Number(yearsExperience),
      teachingStyle,
      bio,
      introVideoUrl,
      educations,
      certifications,
      experiences,
    };

    const ok = await tutorService.updateMyProfile(payload);
    setSaving(false);

    if (ok) {
      toast({
        title: "Profile Saved",
        message: "Your public profile has been updated. Newly edited credentials have been submitted for verification.",
        variant: "success",
      });
      loadProfile();
    } else {
      toast({ title: "Error", message: "Failed to save profile changes.", variant: "danger" });
    }
  };

  // Education Helpers
  const handleAddEducation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEduDegree || !newEduInst) return;
    setEducations([
      ...educations,
      {
        degree: newEduDegree,
        fieldOfStudy: newEduField,
        institution: newEduInst,
        startYear: newEduStartYear,
        endYear: newEduEndYear,
        honors: newEduHonors,
        documentUrl: newEduDocUrl,
        documentName: newEduDocName,
        isVerified: false, // Triggers re-verification
      },
    ]);
    setIsEduModalOpen(false);
    setNewEduDegree("");
    setNewEduField("");
    setNewEduInst("");
    setNewEduHonors("");
    setNewEduDocUrl("");
    setNewEduDocName("");
    toast({
      title: "Degree Added",
      message: "Academic degree and verification document added. Click 'Save All Changes' to submit for official verification.",
      variant: "info",
    });
  };

  const handleRemoveEducation = (idx: number) => {
    setEducations(educations.filter((_, i) => i !== idx));
  };

  // Certification Helpers
  const handleAddCertification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertTitle || !newCertIssuer) return;
    setCertifications([
      ...certifications,
      {
        title: newCertTitle,
        issuer: newCertIssuer,
        issueYear: newCertYear,
        credentialId: newCertId,
        documentUrl: newCertDocUrl,
        documentName: newCertDocName,
        isVerified: false, // Triggers re-verification
      },
    ]);
    setIsCertModalOpen(false);
    setNewCertTitle("");
    setNewCertIssuer("");
    setNewCertId("");
    setNewCertDocUrl("");
    setNewCertDocName("");
    toast({
      title: "Certification Added",
      message: "Certification added. Click 'Save All Changes' to submit for verification.",
      variant: "info",
    });
  };

  const handleRemoveCertification = (idx: number) => {
    setCertifications(certifications.filter((_, i) => i !== idx));
  };

  // Experience Helpers
  const handleAddExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpRole || !newExpOrg) return;
    setExperiences([
      ...experiences,
      {
        role: newExpRole,
        organization: newExpOrg,
        location: newExpLoc,
        startYear: newExpStartYear,
        endYear: newExpEndYear,
        description: newExpDesc,
      },
    ]);
    setIsExpModalOpen(false);
    setNewExpRole("");
    setNewExpOrg("");
    setNewExpLoc("");
    setNewExpDesc("");
  };

  const handleRemoveExperience = (idx: number) => {
    setExperiences(experiences.filter((_, i) => i !== idx));
  };

  const getEmbedVideoUrl = (url: string) => {
    if (!url) return null;
    if (url.includes("youtube.com/watch?v=")) {
      const vid = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${vid}`;
    }
    if (url.includes("youtu.be/")) {
      const vid = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${vid}`;
    }
    return url;
  };

  const pendingEduCount = educations.filter((e) => !e.isVerified).length;
  const pendingCertCount = certifications.filter((c) => !c.isVerified).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Hidden File Input for Cloudinary Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {/* Hero Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar with Camera Button */}
            <div className="relative group shrink-0">
              <Avatar
                src={avatarUrl || profile?.user?.avatarUrl}
                fallbackName={displayName || "Tutor"}
                size="xl"
                statusIndicator="online"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#14209C] text-white shadow-md hover:bg-[#0d1870] transition-transform hover:scale-105 border-2 border-white cursor-pointer"
                title="Click to Upload Profile Picture to Cloudinary"
              >
                {uploadingAvatar ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {displayName || "Tutor Profile"}
                </h1>
                <Badge variant="success" size="sm" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Tutor
                </Badge>
                {profile?.isSuperTutor && (
                  <Badge variant="neutral" size="sm" className="gap-1 bg-indigo-50 text-[#14209C] border-indigo-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Super Tutor
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-500 line-clamp-1">
                {headline || "No headline set"}
              </p>

              <div className="flex items-center gap-3 text-xs pt-1 text-slate-500">
                <span>{profile?.averageRating || 5.0}★ ({profile?.reviewCount || 0} reviews)</span>
                <span>•</span>
                <span>{profile?.totalLessons || 0} lessons taught</span>
                <span>•</span>
                <span className="font-bold text-slate-900">${hourlyRate}/hr</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {profile?.slug && (
              <Link href={`/tutors/${profile.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="font-bold text-xs flex items-center gap-1.5">
                  <span>View Public Profile</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </Link>
            )}

            <Button
              variant="default"
              disabled={saving}
              onClick={handleSaveProfile}
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save All Changes"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "basic", label: "Basic Info & Headline", icon: <User className="w-4 h-4" /> },
          { id: "bio", label: "About & Video Intro", icon: <Video className="w-4 h-4" /> },
          { id: "subjects", label: "Subjects Taught", count: profile?.subjects?.length, icon: <BookOpen className="w-4 h-4" /> },
          { id: "education", label: "Education & Degrees", count: educations.length, icon: <GraduationCap className="w-4 h-4" /> },
          { id: "certifications", label: "Certifications", count: certifications.length, icon: <Award className="w-4 h-4" /> },
          { id: "experience", label: "Teaching Experience", count: experiences.length, icon: <Briefcase className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="line"
      />

      {/* TAB 1: BASIC INFO & HEADLINE */}
      {activeTab === "basic" && (
        <div className="space-y-6">
          {/* Prominent Profile Picture Uploader Banner */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-2">
              <div className="flex items-center gap-5">
                <div className="relative group shrink-0">
                  <Avatar
                    src={avatarUrl || profile?.user?.avatarUrl}
                    fallbackName={displayName || "Tutor"}
                    size="xl"
                    statusIndicator="online"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#14209C]" />
                    <span>Profile Photo & Avatar</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload a clear, friendly photo. JPG, PNG or WebP up to 5MB. Stored on Cloudinary CDN.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="text-xs font-bold border-[#14209C] text-[#14209C] hover:bg-indigo-50 flex items-center gap-1.5"
                    >
                      <UploadCloud className={`w-3.5 h-3.5 ${uploadingAvatar ? "animate-spin" : ""}`} />
                      <span>{uploadingAvatar ? "Uploading to Cloudinary..." : "Upload New Photo"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Profile Details & Pricing
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                These details appear at the top of your public tutor card in search results.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-900">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Display Name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins, M.Ed."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hourly Lesson Rate (USD / 50 min)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="pl-9 font-bold"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Professional Headline
                </label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Certified ESL Master Instructor | Harvard Graduate | 10+ Yrs Business English"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Years of Teaching Experience
                </label>
                <Input
                  type="number"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(Number(e.target.value))}
                />
              </div>

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

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Teaching Style & Methodology
                </label>
                <Input
                  value={teachingStyle}
                  onChange={(e) => setTeachingStyle(e.target.value)}
                  placeholder="e.g. Holistic conversational immersion, customized lesson summaries, and interactive drills"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ABOUT & VIDEO INTRO */}
      {activeTab === "bio" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Biography & Video Introduction
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Introduce yourself, your teaching philosophy, and share a video to boost student conversion.
            </p>
          </div>

          <div className="space-y-6 text-xs text-slate-900">
            <FileUploadWithLink
              label="Introduction Video"
              description="Upload an introduction video file (MP4, WebM) directly to Cloudinary, or paste a YouTube / Vimeo / Direct video link."
              type="video"
              value={introVideoUrl}
              onChange={(url) => setIntroVideoUrl(url)}
              placeholder="https://www.youtube.com/watch?v=... or direct MP4"
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Biography & Teaching Approach
              </label>
              <Textarea
                rows={8}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your background, educational philosophy, and what students can expect in a typical lesson..."
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECTS TAUGHT */}
      {activeTab === "subjects" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Subjects & Curriculum Offerings
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Subjects verified by Sabina Academic Operations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(profile?.subjects || []).map((sub: any) => (
              <div
                key={sub.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{sub.name}</span>
                    {sub.isPrimary && (
                      <Badge variant="neutral" size="xs" className="bg-[#14209C] text-white">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{sub.category}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(sub.levels || ["All Levels"]).map((lvl: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-semibold text-slate-600"
                    >
                      {lvl}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EDUCATION & DEGREES */}
      {activeTab === "education" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          {/* Re-verification Info Banner */}
          {pendingEduCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Re-Verification in Progress ({pendingEduCount} item)</span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Newly added or modified degrees are queued for review by the Sabina Academic Registrar. Once verified, the official green badge will appear automatically on your public profile.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Academic Degrees & Higher Education
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Add university degrees. Modifications trigger credentials review.
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEduModalOpen(true)}
              className="font-bold bg-[#14209C] text-white text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Degree</span>
            </Button>
          </div>

          <div className="space-y-3">
            {educations.map((edu, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#14209C] shrink-0 border border-indigo-100">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                      </h4>
                      {edu.isVerified ? (
                        <Badge variant="neutral" size="xs" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <Check className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="xs" className="bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="w-3 h-3 mr-1" /> Pending Review
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{edu.institution}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {edu.startYear} – {edu.endYear} {edu.honors ? `· ${edu.honors}` : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveEducation(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Delete degree"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CERTIFICATIONS */}
      {activeTab === "certifications" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          {/* Re-verification Info Banner */}
          {pendingCertCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Re-Verification in Progress ({pendingCertCount} item)</span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Newly added certificates are reviewed within 24 hours. Your existing approved credentials remain active and displayed on your public profile.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Teaching Certifications & Accreditations
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified TEFL, CELTA, DELTA, and language teaching credentials.
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCertModalOpen(true)}
              className="font-bold bg-[#14209C] text-white text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Certification</span>
            </Button>
          </div>

          <div className="space-y-3">
            {certifications.map((cert, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{cert.title}</h4>
                      {cert.isVerified ? (
                        <Badge variant="neutral" size="xs" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <Check className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="xs" className="bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="w-3 h-3 mr-1" /> Pending Review
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{cert.issuer} ({cert.issueYear})</p>
                    {cert.credentialId && (
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">ID: {cert.credentialId}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveCertification(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Delete certification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: TEACHING EXPERIENCE */}
      {activeTab === "experience" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Teaching Career & Work Experience
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Highlight your past roles at schools, universities, and language centers.
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsExpModalOpen(true)}
              className="font-bold bg-[#14209C] text-white text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Position</span>
            </Button>
          </div>

          <div className="space-y-3">
            {experiences.map((exp, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{exp.role}</h4>
                    <p className="text-xs text-slate-600">
                      {exp.organization} {exp.location ? `· ${exp.location}` : ""}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {exp.startYear} – {exp.endYear || "Present"}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveExperience(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Delete experience"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Education Modal */}
      <Modal
        isOpen={isEduModalOpen}
        onClose={() => setIsEduModalOpen(false)}
        title="Add Academic Degree"
        description="Enter your university educational background. Will be submitted for official verification."
      >
        <form onSubmit={handleAddEducation} className="space-y-4 pt-2 text-slate-900">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Degree Title</label>
            <Input required placeholder="e.g. Master of Education (M.Ed.)" value={newEduDegree} onChange={(e) => setNewEduDegree(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Field of Study</label>
            <Input placeholder="e.g. Language & Literacy" value={newEduField} onChange={(e) => setNewEduField(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Institution</label>
            <Input required placeholder="e.g. Harvard University" value={newEduInst} onChange={(e) => setNewEduInst(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Start Year</label>
              <Input type="number" value={newEduStartYear} onChange={(e) => setNewEduStartYear(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">End Year</label>
              <Input type="number" value={newEduEndYear} onChange={(e) => setNewEduEndYear(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Honors / Distinctions</label>
            <Input placeholder="e.g. Magna Cum Laude, Dean's List" value={newEduHonors} onChange={(e) => setNewEduHonors(e.target.value)} />
          </div>
          <div>
            <FileUploadWithLink
              label="Verification Document (Diploma Scan / Academic Transcript)"
              description="Upload PDF or image to Cloudinary, or paste document URL. Checked for malware."
              type="document"
              value={newEduDocUrl}
              onChange={(url, meta) => {
                setNewEduDocUrl(url);
                if (meta?.fileName) setNewEduDocName(meta.fileName);
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsEduModalOpen(false)}>Cancel</Button>
            <Button variant="default" type="submit" className="font-bold bg-[#14209C] text-white">Add Degree</Button>
          </div>
        </form>
      </Modal>

      {/* Add Certification Modal */}
      <Modal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        title="Add Teaching Certification"
        description="Enter your teaching credentials. Will be submitted for official verification."
      >
        <form onSubmit={handleAddCertification} className="space-y-4 pt-2 text-slate-900">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Certificate Title</label>
            <Input required placeholder="e.g. Cambridge DELTA Level 7" value={newCertTitle} onChange={(e) => setNewCertTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Issuing Organization</label>
            <Input required placeholder="e.g. Cambridge English" value={newCertIssuer} onChange={(e) => setNewCertIssuer(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Issue Year</label>
            <Input type="number" value={newCertYear} onChange={(e) => setNewCertYear(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Credential ID (Optional)</label>
            <Input placeholder="e.g. DLT-998823" value={newCertId} onChange={(e) => setNewCertId(e.target.value)} />
          </div>
          <div>
            <FileUploadWithLink
              label="Certificate Document (PDF / Scan)"
              description="Upload TEFL/CELTA certificate to Cloudinary or paste credential URL."
              type="document"
              value={newCertDocUrl}
              onChange={(url, meta) => {
                setNewCertDocUrl(url);
                if (meta?.fileName) setNewCertDocName(meta.fileName);
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsCertModalOpen(false)}>Cancel</Button>
            <Button variant="default" type="submit" className="font-bold bg-[#14209C] text-white">Add Certification</Button>
          </div>
        </form>
      </Modal>

      {/* Add Experience Modal */}
      <Modal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        title="Add Work Experience"
        description="Highlight your past teaching roles and career positions."
      >
        <form onSubmit={handleAddExperience} className="space-y-4 pt-2 text-slate-900">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Position / Role</label>
            <Input required placeholder="e.g. Senior ESL Instructor" value={newExpRole} onChange={(e) => setNewExpRole(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Organization / School</label>
            <Input required placeholder="e.g. Boston International Academy" value={newExpOrg} onChange={(e) => setNewExpOrg(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Location</label>
            <Input placeholder="e.g. Boston, USA" value={newExpLoc} onChange={(e) => setNewExpLoc(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Start Year</label>
              <Input type="number" value={newExpStartYear} onChange={(e) => setNewExpStartYear(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">End Year (Leave blank if current)</label>
              <Input type="number" value={newExpEndYear || ""} onChange={(e) => setNewExpEndYear(e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Key Responsibilities & Achievements</label>
            <Textarea rows={3} placeholder="Taught intensive immersion classes to over 400 international students..." value={newExpDesc} onChange={(e) => setNewExpDesc(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsExpModalOpen(false)}>Cancel</Button>
            <Button variant="default" type="submit" className="font-bold bg-[#14209C] text-white">Add Experience</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
