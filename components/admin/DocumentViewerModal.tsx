"use client";

import * as React from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ExternalLink,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  GraduationCap,
  Award,
  AlertTriangle,
  FileCheck,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ApplicationDocument } from "@/src/modules/tutor-applications/domain/types";

interface DocumentViewerModalProps {
  document: ApplicationDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify?: (documentId: string) => Promise<void> | void;
  onReject?: (documentId: string) => Promise<void> | void;
  isActionLoading?: boolean;
}

const DOC_TYPE_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  IDENTITY: {
    label: "Government Identity Document",
    icon: ShieldCheck,
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
  },
  DEGREE_CERTIFICATE: {
    label: "University Degree / Diploma",
    icon: GraduationCap,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  TEACHING_CREDENTIAL: {
    label: "Teaching Credential / License",
    icon: Award,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  RESUME: {
    label: "Curriculum Vitae / Resume",
    icon: FileText,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  OTHER: {
    label: "Supporting Verification Document",
    icon: FileCheck,
    color: "text-slate-700",
    bg: "bg-slate-50 border-slate-200",
  },
};

export function DocumentViewerModal({
  document,
  isOpen,
  onClose,
  onVerify,
  onReject,
  isActionLoading = false,
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [imgLoading, setImgLoading] = React.useState(true);
  const [imgError, setImgError] = React.useState(false);

  // Reset zoom & rotation whenever document changes
  React.useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setImgLoading(true);
      setImgError(false);
      // Lock body scroll
      window.document.body.style.overflow = "hidden";
    }
    return () => {
      window.document.body.style.overflow = "unset";
    };
  }, [isOpen, document?.id]);

  // Keyboard shortcut handlers
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "r" || e.key === "R") handleRotate();
      if (e.key === "0") handleResetZoom();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, zoom, rotation]);

  if (!isOpen || !document) return null;

  const typeConfig = DOC_TYPE_META[document.documentType] || DOC_TYPE_META.OTHER;
  const TypeIcon = typeConfig.icon;

  const isPdf =
    document.fileUrl.toLowerCase().endsWith(".pdf") ||
    document.fileUrl.includes("/raw/upload/") ||
    document.fileUrl.includes(".pdf?");

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3.0));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = () => {
    const a = window.document.createElement("a");
    a.href = document.fileUrl;
    a.download = document.title || "document";
    a.target = "_blank";
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-viewer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop Dismiss Target */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Modal Container */}
      <div className="relative z-10 w-full max-w-5xl h-[92vh] max-h-[920px] bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200">
        {/* ─── Top Header Bar ─── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${typeConfig.bg} ${typeConfig.color}`}
            >
              <TypeIcon className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="document-viewer-title"
                  className="text-sm sm:text-base font-black text-white truncate max-w-[200px] sm:max-w-md"
                >
                  {document.title}
                </h2>
                <Badge
                  variant={
                    document.verificationStatus === "VERIFIED"
                      ? "success"
                      : document.verificationStatus === "REJECTED"
                      ? "destructive"
                      : "warning"
                  }
                  size="sm"
                  className="font-bold shrink-0 text-[10px]"
                >
                  {document.verificationStatus}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                {typeConfig.label}
              </p>
            </div>
          </div>

          {/* Quick Actions (Zoom, Rotate, External, Download, Close) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {!isPdf && (
              <div className="hidden sm:flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700 text-slate-300">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out (-)"
                  className="p-1.5 rounded-lg hover:text-white hover:bg-slate-700 transition"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono px-1.5 text-slate-300 select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In (+)"
                  className="p-1.5 rounded-lg hover:text-white hover:bg-slate-700 transition"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  title="Rotate 90° (R)"
                  className="p-1.5 rounded-lg hover:text-white hover:bg-slate-700 transition border-l border-slate-700/80 ml-0.5"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset Zoom (0)"
                  className="p-1.5 rounded-lg hover:text-white hover:bg-slate-700 transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              title="Download Original File"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
            >
              <Download className="w-4 h-4" />
            </button>

            <a
              href={document.fileUrl}
              target="_blank"
              rel="noreferrer"
              title="Open Raw File in New Window"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition flex items-center justify-center"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              title="Close Viewer (Esc)"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-600/80 border border-slate-700 hover:border-rose-500 transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Inspection Canvas Area ─── */}
        <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-hidden relative flex items-center justify-center select-none">
          {isPdf ? (
            <div className="w-full h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative">
              <iframe
                src={`${document.fileUrl}#toolbar=1&navpanes=0`}
                title={document.title}
                className="w-full h-full border-0 bg-white"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate">
                  PDF Preview • If document does not render, click Open in New Tab
                </span>
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-bold shrink-0 ml-2"
                >
                  Open External PDF
                </a>
              </div>
            </div>
          ) : (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              {imgLoading && !imgError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <span className="text-xs">Loading high-resolution document...</span>
                </div>
              )}

              {imgError ? (
                <div className="flex flex-col items-center justify-center gap-3 p-8 bg-slate-900/60 rounded-2xl border border-slate-800 text-center max-w-md">
                  <AlertTriangle className="w-10 h-10 text-amber-500" />
                  <p className="text-sm font-bold text-white">Preview Not Directly Embeddable</p>
                  <p className="text-xs text-slate-400">
                    This file format or remote host cannot be rendered directly in canvas. Click below to inspect externally.
                  </p>
                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Original Document
                  </a>
                </div>
              ) : (
                <div
                  className="transition-transform duration-150 ease-out origin-center"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={document.fileUrl}
                    alt={document.title}
                    onLoad={() => setImgLoading(false)}
                    onError={() => {
                      setImgLoading(false);
                      setImgError(true);
                    }}
                    className="max-w-[85vw] max-h-[72vh] object-contain rounded-xl shadow-2xl bg-white border border-slate-800"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Bottom Footer & Audit Decision Bar ─── */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Metadata info */}
          <div className="flex flex-col min-w-0">
            {document.notes && (
              <p className="text-xs text-rose-400 font-medium truncate">
                <span className="font-bold">Rejection Note:</span> {document.notes}
              </p>
            )}
            <p className="text-[11px] text-slate-400 truncate">
              ID: <span className="font-mono">{document.id}</span> • Status:{" "}
              <strong className="text-slate-200">{document.verificationStatus}</strong>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {onReject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(document.id)}
                disabled={isActionLoading || document.verificationStatus === "REJECTED"}
                className="text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600 border-rose-800/80 h-9 px-4 rounded-xl transition"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject Document
              </Button>
            )}

            {onVerify && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onVerify(document.id)}
                disabled={isActionLoading || document.verificationStatus === "VERIFIED"}
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 h-9 px-4 rounded-xl shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Verify Document
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700 h-9 px-4 rounded-xl"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
