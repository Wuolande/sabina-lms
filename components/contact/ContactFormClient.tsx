"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export function ContactFormClient() {
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-full min-w-0 lg:col-span-2 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-card">
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

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="w-full font-bold bg-brand hover:brightness-90 text-white shadow-subtle h-12 min-h-[44px]"
          >
            Send Message
          </Button>
        </form>
      )}
    </div>
  );
}
