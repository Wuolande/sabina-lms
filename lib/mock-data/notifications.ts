import { Notification } from "@/types";
import { mockCurrentUser } from "./students";

export const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    userId: mockCurrentUser.id,
    type: "LESSON_REMINDER",
    title: "Lesson starts in 25 minutes",
    body: "Your IELTS & TOEFL Prep lesson with Sarah Jenkins starts at 05:05 AM.",
    linkUrl: "/lessons/les-1/classroom",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-2",
    userId: mockCurrentUser.id,
    type: "NEW_MESSAGE",
    title: "New message from Sarah Jenkins",
    body: "Fantastic! We'll do a mock test under strict 2-minute timing conditions...",
    linkUrl: "/student/messages?conv=conv-1",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-3",
    userId: mockCurrentUser.id,
    type: "BOOKING_CONFIRMED",
    title: "Lesson Confirmed with Dr. Elena Rostova",
    body: "Mathematics lesson scheduled for Wednesday at 02:00 PM.",
    linkUrl: "/student/lessons/les-2",
    readAt: "2026-08-21T15:00:00Z",
    createdAt: "2026-08-21T14:05:00Z",
  },
  {
    id: "notif-4",
    userId: mockCurrentUser.id,
    type: "PAYMENT_SUCCESS",
    title: "Payment of $65.00 Successful",
    body: "Invoice #INV-2026-0882 generated for booking with Dr. Elena Rostova.",
    linkUrl: "/student/payments",
    readAt: "2026-08-21T15:00:00Z",
    createdAt: "2026-08-21T14:05:00Z",
  },
  {
    id: "notif-5",
    userId: mockCurrentUser.id,
    type: "NEW_REVIEW",
    title: "Tutor responded to your review",
    body: "Marcus Thorne replied to your review on Python & Data Science.",
    linkUrl: "/tutors/marcus-thorne",
    readAt: "2026-08-19T10:00:00Z",
    createdAt: "2026-08-19T09:30:00Z",
  },
];
