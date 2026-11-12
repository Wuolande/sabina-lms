import type { GlobalConfig } from "payload";
import { anyone, isAdmin } from "../access";

export const PLATFORM_DEFAULTS = {
  currency: "USD",
  platformFeePercent: 18,
  tutorMinHourlyRate: 10,
  tutorMaxHourlyRate: 250,
  trialLessonMinutes: 30,
  trialLessonDiscountPercent: 30,
  cancellationRefundHours: 24,
  classroomEarlyJoinMinutes: 15,
  instantBookingEnabled: true,
  maxSubjectsPerTutor: 5,
  bookingWindowDays: 42,
  regularLessonMinutes: [30, 60, 90] as number[],
  paymentHoldMinutes: 15,
  lateCancellationRefundPercent: 0,
  earningsHoldDays: 2,
  minimumPayout: 20,
} as const;

/** Fees, price limits and booking policies. Read by the tutor application, marketplace and checkout. */
export const PlatformSettings: GlobalConfig = {
  slug: "platform-settings",
  label: "Fees & policies",
  admin: { group: "Settings" },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      type: "row",
      fields: [
        { name: "currency", type: "select", defaultValue: PLATFORM_DEFAULTS.currency, options: ["USD", "KES", "EUR", "GBP"].map((c) => ({ label: c, value: c })), admin: { width: "33%" } },
        { name: "platformFeePercent", type: "number", min: 0, max: 60, defaultValue: PLATFORM_DEFAULTS.platformFeePercent, label: "Platform fee (%)", admin: { width: "33%", description: "Taken from each lesson payment." } },
        { name: "maxSubjectsPerTutor", type: "number", min: 1, max: 15, defaultValue: PLATFORM_DEFAULTS.maxSubjectsPerTutor, admin: { width: "33%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "tutorMinHourlyRate", type: "number", min: 1, defaultValue: PLATFORM_DEFAULTS.tutorMinHourlyRate, label: "Minimum hourly rate", admin: { width: "50%" } },
        { name: "tutorMaxHourlyRate", type: "number", min: 1, defaultValue: PLATFORM_DEFAULTS.tutorMaxHourlyRate, label: "Maximum hourly rate", admin: { width: "50%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "trialLessonMinutes", type: "number", min: 15, max: 60, defaultValue: PLATFORM_DEFAULTS.trialLessonMinutes, label: "Trial lesson length (min)", admin: { width: "50%" } },
        { name: "trialLessonDiscountPercent", type: "number", min: 0, max: 100, defaultValue: PLATFORM_DEFAULTS.trialLessonDiscountPercent, label: "Trial lesson discount (%)", admin: { width: "50%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "cancellationRefundHours", type: "number", min: 0, defaultValue: PLATFORM_DEFAULTS.cancellationRefundHours, label: "Free cancellation up to (hours before)", admin: { width: "50%" } },
        { name: "classroomEarlyJoinMinutes", type: "number", min: 0, max: 60, defaultValue: PLATFORM_DEFAULTS.classroomEarlyJoinMinutes, label: "Classroom opens (minutes before)", admin: { width: "50%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "bookingWindowDays", type: "number", min: 7, max: 180, defaultValue: PLATFORM_DEFAULTS.bookingWindowDays, label: "Students can book up to (days ahead)", admin: { width: "50%" } },
        { name: "instantBookingEnabled", type: "checkbox", defaultValue: PLATFORM_DEFAULTS.instantBookingEnabled, label: "Allow instant booking", admin: { width: "50%", description: "Off: every booking is a request the tutor accepts." } },
      ],
    },
    {
      type: "collapsible",
      label: "Payments & payouts",
      fields: [
        {
          type: "row",
          fields: [
            { name: "paymentHoldMinutes", type: "number", min: 5, max: 60, defaultValue: PLATFORM_DEFAULTS.paymentHoldMinutes, label: "Hold a time while paying (min)", admin: { width: "50%" } },
            { name: "lateCancellationRefundPercent", type: "number", min: 0, max: 100, defaultValue: PLATFORM_DEFAULTS.lateCancellationRefundPercent, label: "Refund for late cancellations (%)", admin: { width: "50%", description: "When a student cancels inside the free-cancellation window." } },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "earningsHoldDays", type: "number", min: 0, max: 30, defaultValue: PLATFORM_DEFAULTS.earningsHoldDays, label: "Earnings available after (days)", admin: { width: "50%", description: "Days after a lesson ends before the tutor can withdraw it." } },
            { name: "minimumPayout", type: "number", min: 0, defaultValue: PLATFORM_DEFAULTS.minimumPayout, label: "Minimum payout", admin: { width: "50%" } },
          ],
        },
      ],
    },
  ],
};

export type Policies = { -readonly [K in keyof typeof PLATFORM_DEFAULTS]: (typeof PLATFORM_DEFAULTS)[K] extends string ? string : (typeof PLATFORM_DEFAULTS)[K] extends boolean ? boolean : number };
