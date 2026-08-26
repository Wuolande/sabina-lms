import { Booking } from "@/types";
import { mockCurrentUser } from "./students";
import { mockTutors } from "./tutors";
import { mockSubjects } from "./subjects";

export const mockBookings: Booking[] = [
  {
    id: "bk-1",
    studentId: mockCurrentUser.id,
    student: mockCurrentUser,
    tutorId: mockTutors[4].id, // Sarah Jenkins (English)
    tutor: mockTutors[4],
    subjectId: "sub-15",
    subject: mockSubjects[14], // IELTS
    startTime: new Date(Date.now() + 25 * 60 * 1000).toISOString(), // 25 mins from now
    endTime: new Date(Date.now() + 75 * 60 * 1000).toISOString(),
    durationMinutes: 50,
    price: 50,
    currency: "USD",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    videoRoomId: "room-sabina-lesson-101",
    createdAt: "2026-08-20T10:00:00Z",
    updatedAt: "2026-08-20T10:05:00Z",
  },
  {
    id: "bk-2",
    studentId: mockCurrentUser.id,
    student: mockCurrentUser,
    tutorId: mockTutors[0].id, // Elena Rostova (Math)
    tutor: mockTutors[0],
    subjectId: "sub-2",
    subject: mockSubjects[1], // Mathematics
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
    endTime: new Date(Date.now() + (2 * 24 * 60 + 50) * 60 * 1000).toISOString(),
    durationMinutes: 50,
    price: 65,
    currency: "USD",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    videoRoomId: "room-sabina-lesson-102",
    createdAt: "2026-08-21T14:00:00Z",
    updatedAt: "2026-08-21T14:05:00Z",
  },
  {
    id: "bk-3",
    studentId: mockCurrentUser.id,
    student: mockCurrentUser,
    tutorId: mockTutors[3].id, // Gabriel Morales (Spanish)
    tutor: mockTutors[3],
    subjectId: "sub-3",
    subject: mockSubjects[2], // Spanish
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
    endTime: new Date(Date.now() + (5 * 24 * 60 + 50) * 60 * 1000).toISOString(),
    durationMinutes: 50,
    price: 38,
    currency: "USD",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    videoRoomId: "room-sabina-lesson-103",
    createdAt: "2026-08-22T09:00:00Z",
    updatedAt: "2026-08-22T09:05:00Z",
  },
  {
    id: "bk-4",
    studentId: mockCurrentUser.id,
    student: mockCurrentUser,
    tutorId: mockTutors[1].id, // Marcus Thorne (Python)
    tutor: mockTutors[1],
    subjectId: "sub-4",
    subject: mockSubjects[3], // Python
    startTime: "2026-08-18T18:00:00Z",
    endTime: "2026-08-18T18:50:00Z",
    durationMinutes: 50,
    price: 85,
    currency: "USD",
    status: "COMPLETED",
    paymentStatus: "PAID",
    videoRoomId: "room-sabina-lesson-098",
    createdAt: "2026-08-14T11:00:00Z",
    updatedAt: "2026-08-18T19:00:00Z",
  },
  {
    id: "bk-5",
    studentId: mockCurrentUser.id,
    student: mockCurrentUser,
    tutorId: mockTutors[4].id, // Sarah Jenkins
    tutor: mockTutors[4],
    subjectId: "sub-1",
    subject: mockSubjects[0], // English
    startTime: "2026-08-12T15:00:00Z",
    endTime: "2026-08-12T15:50:00Z",
    durationMinutes: 50,
    price: 50,
    currency: "USD",
    status: "COMPLETED",
    paymentStatus: "PAID",
    videoRoomId: "room-sabina-lesson-092",
    createdAt: "2026-08-08T16:00:00Z",
    updatedAt: "2026-08-12T16:00:00Z",
  },
];
