"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * High-fidelity, official SVG wordmarks and icons for all supported
 * payment gateways and major payment networks.
 */

export function StripeLogo({ className }: IconProps) {
  return (
    <svg className={cn("h-5 w-auto", className)} viewBox="0 0 60 25" fill="none">
      <path
        fill="#635BFF"
        d="M59.64 14.28c0-4.48-2.18-8.02-6.42-8.02-4.26 0-6.84 3.54-6.84 8 0 5.28 3.06 7.9 7.42 7.9 2.12 0 3.72-.48 4.94-1.16v-3.4c-1.22.62-2.6 1-4.22 1-1.7 0-3.18-.62-3.38-2.62h8.42c.04-.3.08-.96.08-1.7zm-8.5-1.5c0-1.78 1.08-2.48 2.12-2.48s2.08.7 2.08 2.48h-4.2zm-9.36-6.52c-1.68 0-2.76.8-3.34 1.36l-.22-1.08h-3.64v19.64l4.24-.9.02-4.7c.6.5 1.58 1.18 3.12 1.18 3.2 0 5.76-2.52 5.76-7.72-.02-4.9-2.6-7.78-5.94-7.78zm-1.2 11.8c-1.04 0-1.66-.36-2.08-.82l-.04-5.64c.46-.5 1.12-.88 2.12-.88 1.62 0 2.76 1.48 2.76 3.66 0 2.22-1.12 3.68-2.76 3.68zm-14.8-13.7v3.96h2.84v3.52h-2.84v6.8c0 1.3.84 1.74 1.94 1.74.72 0 1.28-.08 1.62-.22v3.34c-.6.26-1.52.42-2.64.42-2.76 0-5.14-1.28-5.14-5.14v-6.94h-2.16v-3.52h2.16v-2.96l4.22-1zm-9.38 6.94l-.26-1.16h-3.6v15.04h4.22v-9.7c1.02-1.32 2.74-1.08 3.32-.88v-3.92c-.62-.24-2.72-.56-3.68.62zm-8.8-3.48c-2.3 0-3.8 1.16-3.8 2.94 0 3.38 4.94 2.84 4.94 4.3 0 .58-.5 1.02-1.52 1.02-1.34 0-3.08-.56-4.44-1.34v3.74c1.54.66 3.18.96 4.62.96 2.52 0 5.6-1.24 5.6-4.28 0-3.64-4.96-3.04-4.96-4.42 0-.44.42-.82 1.3-.82 1.12 0 2.54.42 3.68 1.04v-3.6c-1.24-.52-2.64-.84-5.42-.84z"
      />
    </svg>
  );
}

export function PayPalLogo({ className }: IconProps) {
  return (
    <svg className={cn("h-5 w-auto", className)} viewBox="0 0 84 24" fill="none">
      <path
        fill="#003087"
        d="M10.87 2.05H3.6a.9.9 0 0 0-.9.76L.02 21.05a.55.55 0 0 0 .54.62h4.06a.9.9 0 0 0 .9-.76l.78-4.95a.9.9 0 0 1 .9-.76h2.24c4.46 0 7.02-2.16 7.68-6.52.3-2-.03-3.54-1.03-4.63-.98-1.1-2.78-1.66-5.22-1.66z"
      />
      <path
        fill="#0079C1"
        d="M19.78 7.37c-.3 2-.03 3.54-1.03 4.63-.98 1.1-2.78 1.66-5.22 1.66h-2.24a.9.9 0 0 0-.9.76l-1.03 6.53a.55.55 0 0 0 .54.62h3.58a.9.9 0 0 0 .9-.76l.73-4.63a.9.9 0 0 1 .9-.76h1.8c3.67 0 5.78-1.78 6.32-5.37.24-1.63-.03-2.9-.84-3.79-.17-.18-.36-.34-.58-.48-.37.9-.76 1.83-1.16 2.61z"
      />
      <path
        fill="#00457C"
        d="M18.75 6.7c-.17-.18-.36-.34-.58-.48-.56-.37-1.28-.6-2.18-.72-.75-.1-1.65-.15-2.66-.15H8.7a.9.9 0 0 0-.9.76L6.5 14.5a.9.9 0 0 0 .9.76h2.24c4.46 0 7.02-2.16 7.68-6.52.28-1.9-.03-3.44-1.03-4.54z"
      />
      {/* PayPal Wordmark */}
      <text x="27" y="17" fill="#003087" fontSize="16" fontWeight="900" fontFamily="sans-serif">
        Pay<tspan fill="#0079C1">Pal</tspan>
      </text>
    </svg>
  );
}

export function RazorpayLogo({ className }: IconProps) {
  return (
    <svg className={cn("h-5 w-auto", className)} viewBox="0 0 110 24" fill="none">
      <path
        d="M14.6 2.4L3.8 21.6h5.8l2.9-5.4h5.6l-1.8 5.4h5.7L25.6 2.4H14.6zm3.3 9.4h-2.6l2.8-5.3 1.5 5.3h-1.7z"
        fill="#0C2340"
      />
      <path d="M2.2 21.6L12.9 2.4H7.1L0 15l2.2 6.6z" fill="#3395FF" />
      <text x="28" y="17" fill="#0C2340" fontSize="15" fontWeight="900" fontFamily="sans-serif">
        Razor<tspan fill="#3395FF">pay</tspan>
      </text>
    </svg>
  );
}

export function PaystackLogo({ className }: IconProps) {
  return (
    <svg className={cn("h-5 w-auto", className)} viewBox="0 0 100 24" fill="none">
      <rect x="0" y="2" width="20" height="4" rx="2" fill="#0BA4DB" />
      <rect x="0" y="8" width="15" height="4" rx="2" fill="#0BA4DB" />
      <rect x="0" y="14" width="20" height="4" rx="2" fill="#0BA4DB" />
      <rect x="0" y="20" width="11" height="4" rx="2" fill="#0BA4DB" />
      <text x="25" y="17" fill="#001B3A" fontSize="15" fontWeight="900" fontFamily="sans-serif">
        pay<tspan fill="#0BA4DB">stack</tspan>
      </text>
    </svg>
  );
}

export function ApplePayBadge({ className }: IconProps) {
  return (
    <span className={cn("inline-flex items-center justify-center px-2 py-1 rounded-md bg-black text-white font-bold text-[10px] tracking-tight", className)}>
      <svg className="h-3 w-auto mr-1" viewBox="0 0 170 170" fill="currentColor">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.93-12.04-14.54-6.3-9.61-11.28-20.9-14.94-33.86-3.66-12.96-5.49-24.96-5.49-36 0-14.36 3.63-26.27 10.89-35.73s16.64-14.28 28.14-14.47c4.68 0 10.2 1.34 16.55 4.02 6.35 2.68 10.22 4.09 11.62 4.23 1.63-.35 5.75-1.84 12.37-4.47 6.62-2.63 12.18-3.82 16.67-3.57 12.63.63 22.47 5.25 29.53 13.87-11.08 6.74-16.51 16.03-16.3 27.87.21 9.4 3.86 17.18 10.95 23.33 4.29 3.73 9.22 6.43 14.8 8.1-2.3 6.9-5.11 13.97-8.43 21.2zm-28.52-111.45c0 6.6-2.52 12.87-7.56 17.81-5.65 5.54-12.56 8.94-20.73 8.24-.1-1.12-.15-2.18-.15-3.17 0-6.64 2.65-13.3 7.95-18.01 5.3-4.71 12.1-7.46 20.4-7.87.06 1 .09 2 .09 3z" />
      </svg>
      Pay
    </span>
  );
}

export function GooglePayBadge({ className }: IconProps) {
  return (
    <span className={cn("inline-flex items-center justify-center px-2 py-1 rounded-md bg-white border border-slate-300 text-slate-800 font-bold text-[10px] tracking-tight shadow-2xs", className)}>
      <span className="text-blue-500 font-extrabold">G</span>
      <span className="ml-1 text-slate-700">Pay</span>
    </span>
  );
}

export function VisaBadge({ className }: IconProps) {
  return (
    <span className={cn("inline-flex items-center justify-center px-2 py-0.5 rounded bg-blue-900 text-white font-black italic text-[11px] tracking-wider", className)}>
      VISA
    </span>
  );
}

export function MastercardBadge({ className }: IconProps) {
  return (
    <span className={cn("inline-flex items-center justify-center gap-0 px-1.5 py-0.5 rounded bg-slate-900", className)}>
      <span className="h-3 w-3 rounded-full bg-red-600 inline-block opacity-90" />
      <span className="h-3 w-3 rounded-full bg-amber-500 inline-block -ml-1.5 opacity-90" />
    </span>
  );
}

/**
 * Trust & Security Badge Banner for Customer Viewers
 */
export function PaymentSecurityBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-4 flex-wrap text-[11px] text-slate-500 py-2", className)}>
      <div className="flex items-center gap-1">
        <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
        </svg>
        <span className="font-semibold text-slate-700">256-Bit SSL Encrypted</span>
      </div>
      <div className="flex items-center gap-1">
        <svg className="w-3.5 h-3.5 text-brand" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="font-semibold text-slate-700">PCI-DSS Level 1 Compliant</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-slate-700">Instant Escrow Release</span>
      </div>
    </div>
  );
}

/**
 * Unified gateway brand renderer
 */
export function GatewayLogo({
  gateway,
  className,
}: {
  gateway?: string;
  className?: string;
}) {
  const gw = (gateway || "stripe").toLowerCase();
  switch (gw) {
    case "stripe":
      return <StripeLogo className={className} />;
    case "paypal":
      return <PayPalLogo className={className} />;
    case "razorpay":
      return <RazorpayLogo className={className} />;
    case "paystack":
      return <PaystackLogo className={className} />;
    default:
      return (
        <span className={cn("text-xs font-bold text-slate-700 uppercase tracking-wide", className)}>
          {gateway || "CARD"}
        </span>
      );
  }
}
