"use client";

import * as React from "react";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { StudentHeader } from "@/components/layout/StudentHeader";

export default function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <StudentSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <StudentHeader onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
