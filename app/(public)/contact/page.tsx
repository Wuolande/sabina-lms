import type { Metadata } from "next";
import { Mail, MessageSquare, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ContactFormClient } from "@/components/contact/ContactFormClient";

export const metadata: Metadata = {
  title: "Contact Us & Support Helpdesk",
  description:
    "Get in touch with the Sabina support team for inquiries about lesson bookings, tutor applications, institutional accounts, or technical assistance.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-3 sm:space-y-4 w-full min-w-0">
        <Badge variant="subtle" size="sm" className="bg-brand-50 text-brand-800 font-bold">
          Get in Touch
        </Badge>
        <h1 className="text-2xl sm:text-5xl font-black text-slate-900 tracking-tight font-heading">
          How can our support team help you?
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Have a question about booking, tutor onboarding, payments, or live video classrooms? We respond within 2 hours.
        </p>
      </div>

      <div className="w-full max-w-5xl min-w-0 mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Contact Info */}
        <div className="w-full max-w-full min-w-0 rounded-2xl sm:rounded-3xl bg-slate-900 p-6 sm:p-8 text-white space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-heading">Support Channels</h3>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-accent-400 shrink-0" />
                <span className="truncate">support@sabinaedge.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-accent-400 shrink-0" />
                <span>Live Chat: 24/7 in dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-accent-400 shrink-0" />
                <span>London • New York • Singapore</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 text-xs text-slate-300 space-y-1 border border-white/10">
            <strong className="text-white block font-bold">Response Guarantee</strong>
            <span>All student and tutor tickets answered by human specialists within 2 business hours.</span>
          </div>
        </div>

        {/* Contact Form */}
        <ContactFormClient />
      </div>
    </div>
  );
}
