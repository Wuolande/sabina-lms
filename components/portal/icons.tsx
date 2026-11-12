"use client";
import {
  Bell, BookOpen, CalendarDays, Clock, CreditCard, Folder, GraduationCap, Heart, LayoutDashboard, MessageSquare, Receipt, Settings, Star,
  Target,
  TrendingUp, User, Users, Wallet, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Bell, BookOpen, CalendarDays, Clock, CreditCard, GraduationCap, Heart, LayoutDashboard, MessageSquare, Receipt, Settings, Star, Target, TrendingUp, User, Users, Wallet,
};
export function NavIcon({ name, size = 19, className }: { name: string; size?: number; className?: string }) {
  const C = ICONS[name] ?? Folder;
  return <C size={size} strokeWidth={1.9} aria-hidden="true" className={className} />;
}
