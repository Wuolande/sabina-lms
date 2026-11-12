"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Download,
  Share2,
  Printer,
  ArrowLeft,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { trainingService } from "@/services/trainingService";
import { TutorCertificate } from "@/src/modules/training/types/trainingTypes";
import { formatDate } from "@/lib/utils";

export default function CertificateViewPage() {
  const params = useParams();
  const id = params?.id as string;

  const [certificate, setCertificate] = React.useState<TutorCertificate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      trainingService.getCertificateById(id)
        .then((data) => setCertificate(data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-xl mx-auto" />
        <div className="h-96 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Certificate Not Found</h2>
        <p className="text-xs text-slate-500">The certificate ID &ldquo;{id}&rdquo; does not exist or has expired.</p>
        <Link href="/tutor/training">
          <Button variant="default" size="default">Back to Academy</Button>
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* ── Top Bar Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          href="/tutor/training"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tutor Academy
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="text-xs font-bold rounded-xl"
            leftIcon={<Share2 className="h-3.5 w-3.5" />}
          >
            {copied ? "Link Copied!" : "Share Link"}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handlePrint}
            className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
            leftIcon={<Printer className="h-3.5 w-3.5" />}
          >
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* ── Official Printable Certificate Surface ── */}
      <div className="relative rounded-3xl border-8 border-slate-900 bg-white p-8 sm:p-14 shadow-2xl overflow-hidden print:border-4 print:p-8 print:shadow-none">
        {/* Subtle Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <Award className="h-[600px] w-[600px] text-slate-950" />
        </div>

        {/* Outer Corner Ornaments */}
        <div className="absolute top-4 left-4 h-12 w-12 border-t-2 border-l-2 border-amber-500" />
        <div className="absolute top-4 right-4 h-12 w-12 border-t-2 border-r-2 border-amber-500" />
        <div className="absolute bottom-4 left-4 h-12 w-12 border-b-2 border-l-2 border-amber-500" />
        <div className="absolute bottom-4 right-4 h-12 w-12 border-b-2 border-r-2 border-amber-500" />

        <div className="relative z-10 text-center space-y-6">
          {/* Official Academy Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-extrabold uppercase tracking-widest text-amber-900 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Sabina Edge Academy • Official Credential
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight font-heading">
              Certificate of Excellence
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Verified Online Tutoring & Pedagogical Proficiency
            </p>
          </div>

          <div className="py-2">
            <p className="text-sm text-slate-500 italic">This is proudly awarded to</p>
            <h2 className="text-2xl sm:text-4xl font-black text-[#14209C] font-heading mt-2">
              {certificate.tutorName}
            </h2>
            <div className="h-0.5 w-32 bg-amber-400 mx-auto mt-3" />
          </div>

          <div className="max-w-xl mx-auto space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              for successfully completing all rigorous training modules, diagnostic assessments, and achieving a passing grade of <strong>{certificate.scoreAchieved}%</strong> in
            </p>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900 font-heading">
              {certificate.courseTitle}
            </h3>
            <p className="text-xs text-slate-500">
              conferring the official professional designation:
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {certificate.badgeTitle}
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end border-t border-slate-100">
            {/* Issue Details */}
            <div className="text-left space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Issued Date
              </span>
              <p className="text-xs font-bold text-slate-800">
                {formatDate(certificate.issuedAt)}
              </p>
              <span className="text-[10px] font-mono text-slate-500 block">
                ID: {certificate.certificateCode}
              </span>
            </div>

            {/* Official Gold Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 p-1 shadow-md flex items-center justify-center text-slate-950">
                <div className="h-full w-full rounded-full border-2 border-dashed border-amber-950/40 flex flex-col items-center justify-center p-1 text-center">
                  <Award className="h-6 w-6 text-slate-950" />
                  <span className="text-[7px] font-black uppercase tracking-wider mt-0.5">
                    Official Seal
                  </span>
                </div>
              </div>
            </div>

            {/* Academic Registrar Signature */}
            <div className="text-right space-y-1">
              <div className="font-serif italic text-lg text-slate-800">
                Dr. Katherine Vance
              </div>
              <div className="h-px w-32 bg-slate-300 ml-auto" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Dean of Academic Quality & Standards
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
