"use client";

import * as React from "react";
import Link from "next/link";
import {
  Menu,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-amber-200/80 bg-amber-50/40 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Badge variant="warning" size="sm" className="bg-amber-100 text-amber-900 font-bold border-amber-300">
            <Lock className="mr-1 h-3 w-3" />
            Super Administrator Mode
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/find-tutors" target="_blank" className="hidden sm:flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-brand-700">
          <span>Live Site Preview</span>
          <ExternalLink className="h-3 w-3" />
        </Link>

        <div className="flex items-center gap-2.5 pl-3 border-l border-amber-200">
          <Avatar
            fallbackName="Super Admin"
            size="sm"
            className="bg-amber-800 text-white"
          />
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              Platform Admin
            </p>
            <p className="text-[10px] text-amber-800 font-medium">Ops & Finance</p>
          </div>
        </div>
      </div>
    </header>
  );
}
