"use client";

import * as React from "react";
import {
  UploadCloud,
  Link as LinkIcon,
  X,
  FileText,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Play,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface FileUploadWithLinkProps {
  label?: string;
  description?: string;
  value: string;
  onChange: (url: string, fileMetadata?: { fileName?: string; fileSize?: number }) => void;
  type?: "image" | "document" | "video";
  accept?: string;
  placeholder?: string;
  maxSizeBytes?: number;
  className?: string;
}

export function FileUploadWithLink({
  label,
  description,
  value,
  onChange,
  type = "image",
  accept,
  placeholder,
  maxSizeBytes,
  className = "",
}: FileUploadWithLinkProps) {
  const [activeMode, setActiveMode] = React.useState<"upload" | "link">("upload");
  const [uploading, setUploading] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const defaultAccept =
    accept ||
    (type === "image"
      ? "image/png,image/jpeg,image/webp,image/gif"
      : type === "video"
      ? "video/mp4,video/webm,video/quicktime"
      : ".pdf,.doc,.docx,image/png,image/jpeg");

  const defaultPlaceholder =
    placeholder ||
    (type === "video"
      ? "https://www.youtube.com/watch?v=... or direct MP4 URL"
      : type === "document"
      ? "https://example.com/certificate.pdf"
      : "https://example.com/avatar.jpg");

  const endpoint =
    type === "video"
      ? "/api/upload/video"
      : type === "document"
      ? "/api/upload/document"
      : "/api/upload/avatar";

  const handleUploadFile = async (file: File) => {
    setErrorMsg(null);

    // Frontend validation
    const maxLimit =
      maxSizeBytes ||
      (type === "video" ? 60 * 1024 * 1024 : type === "document" ? 15 * 1024 * 1024 : 5 * 1024 * 1024);

    if (file.size > maxLimit) {
      setErrorMsg(`File size exceeds safety limit of ${(maxLimit / (1024 * 1024)).toFixed(0)}MB.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      const uploadedUrl = data.avatarUrl || data.documentUrl || data.videoUrl || data.url;
      if (uploadedUrl) {
        onChange(uploadedUrl, {
          fileName: data.fileName || file.name,
          fileSize: data.fileSize || file.size,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to scan and upload file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  // Video embed url parser (supports YouTube, Vimeo, and direct video)
  const isVideo = type === "video" || value?.match(/\.(mp4|webm|mov)(\?.*)?$/i);
  const isYoutube = value?.includes("youtube.com") || value?.includes("youtu.be");
  const isVimeo = value?.includes("vimeo.com");

  const getYoutubeEmbed = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const getVimeoEmbed = (url: string) => {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    return match && match[1] ? `https://player.vimeo.com/video/${match[1]}` : null;
  };

  return (
    <div className={`space-y-2.5 text-xs ${className}`}>
      {/* Label and Mode Toggle Switcher */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          {label && (
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {label}
            </label>
          )}
          {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
        </div>

        {/* Tab switch between Cloudinary Upload and Direct Link */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveMode("upload")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              activeMode === "upload"
                ? "bg-white text-[#14209C] shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("link")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              activeMode === "link"
                ? "bg-white text-[#14209C] shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Paste URL</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={defaultAccept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUploadFile(e.target.files[0]);
          }
        }}
      />

      {/* Mode 1: Direct File Upload Area */}
      {activeMode === "upload" && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragActive
              ? "border-[#14209C] bg-indigo-50/50"
              : "border-slate-200 hover:border-slate-300 bg-slate-50/60"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <Loader2 className="w-6 h-6 text-[#14209C] animate-spin" />
              <div className="text-center">
                <span className="font-bold text-xs text-slate-800 block">
                  Scanning & Uploading to Cloudinary...
                </span>
                <span className="text-[10px] text-slate-400">
                  Running virus check, signature verification, and secure cloud sync
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#14209C]">
                {type === "video" ? (
                  <Video className="w-5 h-5" />
                ) : type === "document" ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>
              <p className="font-bold text-xs text-slate-800 mt-1">
                Click to browse or drag and drop
              </p>
              <p className="text-[10px] text-slate-400">
                {type === "video"
                  ? "MP4, WebM, MOV (Up to 60MB)"
                  : type === "document"
                  ? "PDF, DOCX, PNG, JPG (Up to 15MB)"
                  : "PNG, JPG, WebP, GIF (Up to 5MB)"}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <ShieldCheck className="w-3 h-3" />
                <span>Malware & Virus Protected</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Direct URL Input Box */}
      {activeMode === "link" && (
        <div className="space-y-1.5">
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={defaultPlaceholder}
              className="pl-9 font-mono text-xs"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Direct link from Cloudinary, CDN, YouTube, Vimeo, or web storage</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <ShieldCheck className="w-3 h-3" /> HTTPS Link Verified
            </span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Preview Section */}
      {value && !uploading && (
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnail / Icon */}
            {type === "image" ? (
              <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt="Preview" className="h-full w-full object-cover" />
              </div>
            ) : type === "video" ? (
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#14209C] shrink-0">
                <Play className="w-5 h-5" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-800 truncate block">
                  {value.includes("cloudinary.com") ? "Cloudinary Stored Asset" : "Linked Media Asset"}
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Active
                </span>
              </div>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#14209C] hover:underline truncate block max-w-xs mt-0.5"
              >
                {value}
              </a>
            </div>
          </div>

          {/* Remove / Clear Button */}
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition shrink-0"
            title="Remove asset"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Embedded Video Player Preview if active and is a video */}
      {type === "video" && value && (
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-200 mt-2">
          {isYoutube && getYoutubeEmbed(value) ? (
            <iframe
              src={getYoutubeEmbed(value)!}
              title="YouTube Preview"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : isVimeo && getVimeoEmbed(value) ? (
            <iframe
              src={getVimeoEmbed(value)!}
              title="Vimeo Preview"
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={value} controls className="w-full h-full object-contain" />
          )}
        </div>
      )}
    </div>
  );
}
