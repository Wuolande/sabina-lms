"use client";

import * as React from "react";
import Link from "next/link";
import { TutorProfile } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { BookingCalendar } from "./BookingCalendar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { bookingService } from "@/services/bookingService";
import {
  CheckCircle2,
  CreditCard,
  Lock,
  ArrowRight,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Video,
} from "lucide-react";

interface BookingModalProps {
  tutor: TutorProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (bookingId: string) => void;
  initialDate?: string;
  initialTime?: string;
}

export function BookingModal({
  tutor,
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialTime,
}: BookingModalProps) {
  const [step, setStep] = React.useState<"duration" | "calendar" | "goals" | "payment" | "confirmed">("duration");
  const [selectedDuration, setSelectedDuration] = React.useState<number>(50);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<string>("");
  const [selectedTime, setSelectedTime] = React.useState<string>("");
  const [lessonGoals, setLessonGoals] = React.useState("");
  const [selectedTopicTag, setSelectedTopicTag] = React.useState<string>("Exam Prep");
  const [paymentMethod, setPaymentMethod] = React.useState<"card" | "apple" | "google">("card");
  const [cardNumber, setCardNumber] = React.useState("•••• •••• •••• 4242");
  const [isLoading, setIsLoading] = React.useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = React.useState<string>("");
  const [confirmedLessonId, setConfirmedLessonId] = React.useState<string>("");

  const tutorName = (tutor as any)?.user?.displayName || (tutor as any)?.displayName || "Instructor";
  const tutorAvatar = (tutor as any)?.user?.avatarUrl || (tutor as any)?.avatarUrl;
  const tutorHeadline = (tutor as any)?.headline || "Verified Educator";
  const hourlyRate = Number((tutor as any)?.hourlyRate) || 45;
  const currency = (tutor as any)?.currency || "USD";

  const tutorSubjects: any[] = React.useMemo(() => {
    if (tutor && Array.isArray((tutor as any).subjects) && (tutor as any).subjects.length > 0) {
      return (tutor as any).subjects;
    }
    return [
      {
        id: "sub-general",
        subjectId: "sub-general",
        isPrimary: true,
        levels: ["All Levels"],
        subject: { id: "sub-general", name: "1-on-1 Tutoring Session" },
      },
    ];
  }, [tutor]);

  React.useEffect(() => {
    if (tutorSubjects.length > 0) {
      setSelectedSubjectId(tutorSubjects[0].subjectId);
    }
    // Default to tomorrow or initial props
    if (initialDate) {
      setSelectedDate(initialDate);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split("T")[0]);
    }
    setSelectedTime(initialTime || "14:00");
    setStep("duration");
  }, [tutor, isOpen, initialDate, initialTime, tutorSubjects]);

  const [trialDiscountPercent, setTrialDiscountPercent] = React.useState<number>(0);

  React.useEffect(() => {
    fetch('/api/policies')
      .then((res) => res.json())
      .then((data) => {
        if (data.trialLessonDiscountPercent !== undefined) {
          setTrialDiscountPercent(data.trialLessonDiscountPercent);
        }
      })
      .catch((err) => console.error('Failed to fetch policies', err));
  }, []);

  if (!tutor) return null;

  const basePrice25 = hourlyRate / 2;
  const trialPrice = Math.round(basePrice25 * (1 - trialDiscountPercent / 100));

  const calculatedPrice =
    selectedDuration === 25
      ? trialPrice
      : selectedDuration === 80
      ? Math.round((hourlyRate * 8) / 5)
      : hourlyRate;

  const selectedSubject =
    tutorSubjects.find((s) => s.subjectId === selectedSubjectId)?.subject ||
    tutorSubjects[0]?.subject;

  const handleConfirmPayment = async () => {
    setIsLoading(true);
    try {
      const booking = await bookingService.createBooking({
        tutorId: tutor.id,
        subjectId: selectedSubjectId || tutorSubjects[0]?.subjectId,
        subjectName: selectedSubject?.name || "General Tutoring",
        startTime: `${selectedDate}T${selectedTime.length === 5 ? selectedTime + ":00" : selectedTime}Z`,
        durationMinutes: selectedDuration,
        price: calculatedPrice,
        currency: currency,
        paymentMethod,
        studentNotes: lessonGoals || selectedTopicTag,
      });

      const bId = booking.bookingId || (booking as any).id;
      const lId = booking.lessonId || booking.bookingId || (booking as any).id;
      setConfirmedBookingId(bId);
      setConfirmedLessonId(lId);
      setStep("confirmed");
      onSuccess?.(bId);
    } catch (err) {
      console.error("Booking error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const stepsList = [
    { key: "duration", label: "1. Subject & Plan" },
    { key: "calendar", label: "2. Schedule & Time" },
    { key: "goals", label: "3. Learning Goals" },
    { key: "payment", label: "4. Checkout" },
  ];

  const currentStepIndex =
    step === "duration" ? 0 : step === "calendar" ? 1 : step === "goals" ? 2 : step === "payment" ? 3 : 4;

  const handleCalendarSlotSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const goalChips = [
    "Exam Prep",
    "Homework Assistance",
    "Conversational Practice",
    "Coding & Algorithms",
    "Interview Coaching",
    "Grammar & Writing",
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        step === "confirmed" ? (
          <span className="text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6" /> Lesson Confirmed!
          </span>
        ) : (
          `Book Lesson with ${tutorName}`
        )
      }
      description={
        step === "confirmed"
          ? "Your 1-on-1 live classroom session has been scheduled and added to your calendar."
          : `Step ${currentStepIndex + 1} of 4 • 100% Satisfaction Guarantee`
      }
    >
      {/* ── Visual Stepper Bar ── */}
      {step !== "confirmed" && (
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2">
            {stepsList.map((s, idx) => (
              <div key={s.key} className="space-y-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx <= currentStepIndex ? "bg-slate-950" : "bg-slate-200"
                  }`}
                />
                <span
                  className={`text-[10px] sm:text-[11px] font-bold block truncate ${
                    idx === currentStepIndex
                      ? "text-slate-900"
                      : idx < currentStepIndex
                      ? "text-slate-500"
                      : "text-slate-300"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 1: DURATION & SUBJECT
      ───────────────────────────────────────────────────────────── */}
      {step === "duration" && (
        <div className="space-y-6 animate-fade-in">
          {/* Tutor Mini Card */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <Avatar
              src={tutorAvatar}
              fallbackName={tutorName}
              size="md"
              statusIndicator="online"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-slate-900 text-sm truncate">
                  {tutorName}
                </h4>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              </div>
              <p className="text-xs text-slate-500 truncate">
                {tutorHeadline}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-black text-slate-950 text-base font-heading">
                {formatCurrency(hourlyRate, currency)}
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">/ 50 min</span>
            </div>
          </div>

          {/* Subject Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              1. Choose Subject
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tutorSubjects.map((s) => {
                const isSelected = selectedSubjectId === s.subjectId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(s.subjectId)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-slate-950 bg-slate-950 text-white shadow-md font-bold"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-800 hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">
                        {s.subject?.name || s.name || "1-on-1 Lesson"}
                      </p>
                      {s.isPrimary && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isSelected ? "bg-emerald-500 text-slate-950" : "bg-slate-100 text-slate-600"}`}>
                          Primary
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-1 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      Levels: {(s.levels || ["All Levels"]).slice(0, 2).join(", ")}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lesson Duration Plan */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              2. Select Lesson Duration
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* 25 Min Trial */}
              <button
                type="button"
                onClick={() => setSelectedDuration(25)}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  selectedDuration === 25
                    ? "border-slate-950 bg-slate-50 ring-2 ring-slate-950 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {trialDiscountPercent > 0 ? `Trial ${trialDiscountPercent}% Off` : 'Trial Lesson'}
                </span>
                <h5 className="font-black text-slate-900 text-base mt-2 font-heading">
                  25 Minutes
                </h5>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Targeted question solving & concept check.
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 font-extrabold text-slate-950 text-sm flex items-center gap-1.5">
                  {trialDiscountPercent > 0 && trialDiscountPercent < 100 && (
                    <span className="text-slate-400 line-through text-xs font-normal">
                      {formatCurrency(basePrice25, currency)}
                    </span>
                  )}
                  <span>
                    {trialDiscountPercent === 100
                      ? "Free ($0)"
                      : formatCurrency(trialPrice, currency)}
                  </span>
                </div>
              </button>

              {/* 50 Min Standard */}
              <button
                type="button"
                onClick={() => setSelectedDuration(50)}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  selectedDuration === 50
                    ? "border-slate-950 bg-slate-50 ring-2 ring-slate-950 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                  Most Popular
                </span>
                <h5 className="font-black text-slate-900 text-base mt-2 font-heading">
                  50 Minutes
                </h5>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Full deep-dive, exercises & live whiteboard.
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 font-extrabold text-slate-950 text-sm">
                  {formatCurrency(hourlyRate, tutor.currency)}
                </div>
              </button>

              {/* 80 Min Intensive */}
              <button
                type="button"
                onClick={() => setSelectedDuration(80)}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  selectedDuration === 80
                    ? "border-slate-950 bg-slate-50 ring-2 ring-slate-950 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <span className="text-[10px] font-extrabold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-full">
                  Intensive Prep
                </span>
                <h5 className="font-black text-slate-900 text-base mt-2 font-heading">
                  80 Minutes
                </h5>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Mock exam simulation & comprehensive review.
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 font-extrabold text-slate-950 text-sm">
                  {formatCurrency(Math.round((hourlyRate * 8) / 5), tutor.currency)}
                </div>
              </button>

            </div>
          </div>

          {/* Action */}
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button
              variant="default"
              size="lg"
              className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs"
              onClick={() => setStep("calendar")}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Choose Date & Schedule
            </Button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 2: CALENDAR & TIME SLOTS
      ───────────────────────────────────────────────────────────── */}
      {step === "calendar" && (
        <div className="space-y-5 animate-fade-in">
          <BookingCalendar
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectSlot={handleCalendarSlotSelect}
            durationMinutes={selectedDuration}
          />

          {/* Nav Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200"
              onClick={() => setStep("duration")}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>

            <Button
              variant="default"
              size="lg"
              className="font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs"
              onClick={() => setStep("goals")}
              disabled={!selectedDate || !selectedTime}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Add Lesson Goals
            </Button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 3: LEARNING GOALS & NOTES
      ───────────────────────────────────────────────────────────── */}
      {step === "goals" && (
        <div className="space-y-6 animate-fade-in">
          {/* Goal Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              What is your primary goal for this lesson?
            </label>
            <div className="flex flex-wrap gap-2">
              {goalChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSelectedTopicTag(chip)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedTopicTag === chip
                      ? "bg-slate-950 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Notes to Tutor */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Specific topics or materials you would like to cover:
            </label>
            <textarea
              rows={4}
              value={lessonGoals}
              onChange={(e) => setLessonGoals(e.target.value)}
              placeholder="e.g. I need help with calculus integral calculus questions for an exam next Thursday. I will share a PDF worksheet."
              className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Your tutor will receive this note to prepare tailored materials for your session.
            </p>
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200"
              onClick={() => setStep("calendar")}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Calendar
            </Button>

            <Button
              variant="default"
              size="lg"
              className="font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs"
              onClick={() => setStep("payment")}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Proceed to Review & Pay
            </Button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 4: REVIEW & INSTANT CHECKOUT
      ───────────────────────────────────────────────────────────── */}
      {step === "payment" && (
        <div className="space-y-5 animate-fade-in">
          {/* Order Breakdown Box */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 sm:p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Booking Summary
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 font-medium">
                {selectedDuration} min {selectedSubject?.name} with {tutorName}
              </span>
              <span className="font-bold text-slate-900">
                {formatCurrency(calculatedPrice, currency)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Schedule: {formatDate(selectedDate)} at {selectedTime} (Local Time)</span>
              <span className="font-semibold text-slate-700">{selectedTopicTag}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-200/60">
              <span className="text-slate-600">Platform Infrastructure & HD Video</span>
              <span className="font-bold text-emerald-600">FREE</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-lg font-black text-slate-950 font-heading">
              <span>Total Due</span>
              <span>{formatCurrency(calculatedPrice, currency)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                  paymentMethod === "card"
                    ? "border-slate-950 bg-slate-950 text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Credit / Debit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("apple")}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                  paymentMethod === "apple"
                    ? "border-slate-950 bg-slate-950 text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Apple Pay
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("google")}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                  paymentMethod === "google"
                    ? "border-slate-950 bg-slate-950 text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Google Pay
              </button>
            </div>

            {paymentMethod === "card" && (
              <div className="space-y-3 p-4 rounded-2xl border border-slate-200 bg-white">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      defaultValue="08/28"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="text"
                      defaultValue="888"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>256-Bit SSL Encrypted & Protected by 100% Satisfaction Guarantee</span>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200"
              onClick={() => setStep("goals")}
              disabled={isLoading}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <Button
              variant="default"
              size="lg"
              className="font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs"
              onClick={handleConfirmPayment}
              isLoading={isLoading}
              rightIcon={<ShieldCheck className="h-4 w-4" />}
            >
              Confirm & Book Lesson ({formatCurrency(calculatedPrice, currency)})
            </Button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 5: CONFIRMED & CALENDAR SYNC
      ───────────────────────────────────────────────────────────── */}
      {step === "confirmed" && (
        <div className="space-y-6 py-2 text-center animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto shadow-sm">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 font-heading">
              You&apos;re Scheduled!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Your {selectedDuration}-minute session with <strong>{tutorName}</strong> is booked for{" "}
              <strong>{formatDate(selectedDate)} at {selectedTime}</strong>.
            </p>
          </div>

          {/* Calendar Export & Details Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3 max-w-lg mx-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Booking ID</span>
              <span className="font-mono font-bold text-slate-800">{confirmedBookingId || "bk-1029"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Subject</span>
              <span className="font-bold text-slate-900">{selectedSubject?.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Classroom Link</span>
              <span className="font-bold text-emerald-700">LiveKit Classroom Active</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/lessons/${confirmedLessonId || confirmedBookingId || "room-sabina-lesson-101"}/classroom`}
              className="w-full sm:w-auto"
            >
              <Button
                variant="default"
                size="lg"
                className="w-full font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs"
                leftIcon={<Video className="h-4 w-4" />}
              >
                Go to Live Classroom
              </Button>
            </Link>

            <Link href="/student/calendar" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full font-bold rounded-xl border-slate-200"
                leftIcon={<Calendar className="h-4 w-4" />}
              >
                View My Schedule
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Modal>
  );
}
