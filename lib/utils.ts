import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null, currency: string = "USD"): string {
  const num = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  const validCurrency = (currency && typeof currency === "string" && currency.trim().length === 3)
    ? currency.trim().toUpperCase()
    : "USD";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: validCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `$${num.toLocaleString()}`;
  }
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function formatDate(
  dateString: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  timezone?: string
): string {
  if (!dateString) return "";
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "";
    const defaultOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: timezone || undefined,
      ...options,
    };
    return new Intl.DateTimeFormat("en-US", defaultOptions).format(date);
  } catch {
    return String(dateString);
  }
}

export function formatTime(timeString: string | Date | undefined | null, timezone?: string): string {
  if (!timeString) return "";
  try {
    const date = typeof timeString === "string" ? new Date(timeString) : timeString;
    if (isNaN(date.getTime())) return String(timeString);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return String(timeString);
  }
}

export function formatDateTime(
  dateString: string | Date | undefined | null,
  timezone?: string
): string {
  if (!dateString) return "";
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return String(dateString);
  }
}

export function getInitials(name: string | undefined | null): string {
  if (!name || typeof name !== "string") return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
