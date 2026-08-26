"use client";

import * as React from "react";
import { Mail, MessageSquare, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <Badge variant="subtle" size="sm" className="bg-brand-50 text-brand-800 font-bold">
          Get in Touch
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          How can our support team help you?
        </h1>
        <p className="text-base text-slate-600">
          Have a question about booking, tutor onboarding, payments, or live video classrooms? We respond within 2 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Contact Info */}
        <div className="rounded-3xl bg-slate-900 p-8 text-white space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Support Channels</h3>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-accent-400" />
                <span>support@sabinaedge.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-accent-400" />
                <span>Live Chat: 24/7 in dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-accent-400" />
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
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Message Received!</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Thank you for reaching out. A Sabina Edge support specialist will reply to your email shortly.
              </p>
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <Input required placeholder="Alex Rivera" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <Input type="email" required placeholder="alex@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <Input required placeholder="Question about booking / lesson" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Message
                </label>
                <Textarea required rows={4} placeholder="Describe how we can assist you..." />
              </div>

              <Button type="submit" variant="default" size="lg" className="w-full font-bold bg-brand-700 hover:bg-brand-800">
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
