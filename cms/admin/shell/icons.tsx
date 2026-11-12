"use client";
import {
  ArrowRight, BarChart3, Banknote, Bell, BookOpen, CalendarCheck, ClipboardList, Clock, Landmark, CornerDownLeft, CornerDownRight, ExternalLink, FilePlus2, Folder,
  GraduationCap, House, Image, Languages, Layers, LayoutDashboard, ListChecks, Mail, MailCheck, MessageSquare, MessagesSquare, Moon, Newspaper, Percent,
  Plug, Plus, Radio, Receipt, Repeat, ScrollText, Search, Settings, ShieldAlert, Star, Sun, Tags, Users, UsersRound, Video, Wallet,
  type LucideIcon,
} from "lucide-react";

/** Icons are referenced by name so server components can pass them to the client. */
export const ICONS: Record<string, LucideIcon> = {
  ArrowRight, BarChart3, Banknote, Bell, BookOpen, CalendarCheck, ClipboardList, Clock, Landmark, CornerDownLeft, CornerDownRight, ExternalLink, FilePlus2, Folder,
  GraduationCap, House, Image, Languages, Layers, LayoutDashboard, ListChecks, Mail, MailCheck, MessageSquare, MessagesSquare, Moon, Newspaper, Percent,
  Plug, Plus, Radio, Receipt, Repeat, ScrollText, Search, Settings, ShieldAlert, Star, Sun, Tags, Users, UsersRound, Video, Wallet,
};

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const C = ICONS[name] ?? Folder;
  return <C size={size} strokeWidth={1.9} aria-hidden="true" />;
}
