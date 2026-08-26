import { Review } from "@/types";
import { mockCurrentUser, mockStudents } from "./students";
import { mockTutors } from "./tutors";

export const mockReviews: Review[] = [
  {
    id: "rev-1",
    lessonId: "les-3",
    studentId: mockCurrentUser.id,
    student: mockCurrentUser,
    tutorId: mockTutors[1].id, // Marcus Thorne
    rating: 5,
    reviewText: "Marcus is arguably the best programming mentor I've worked with. He broke down Python decorators and closures with clear memory diagrams. He also reviewed my code and showed me real-world architecture trade-offs. 10/10 recommendation!",
    tutorResponse: "Thank you Alex! You grasped the concept super fast. Excited for our next deep dive into asyncio!",
    tutorResponseAt: "2026-08-19T09:30:00Z",
    createdAt: "2026-08-18T20:15:00Z",
    updatedAt: "2026-08-18T20:15:00Z",
  },
  {
    id: "rev-2",
    lessonId: "les-old-1",
    studentId: mockStudents[1].id, // Clara Zhao
    student: mockStudents[1],
    tutorId: mockTutors[0].id, // Elena Rostova
    rating: 5,
    reviewText: "Dr. Elena made linear algebra feel intuitive rather than just rows of numbers. Her visual explanations of eigenvalues helped me ace my midterm exam!",
    tutorResponse: "So proud of your test result, Clara! Keep up the brilliant work.",
    tutorResponseAt: "2026-08-10T11:00:00Z",
    createdAt: "2026-08-09T18:00:00Z",
    updatedAt: "2026-08-09T18:00:00Z",
  },
  {
    id: "rev-3",
    lessonId: "les-old-2",
    studentId: mockStudents[2].id, // David Kim
    student: mockStudents[2],
    tutorId: mockTutors[4].id, // Sarah Jenkins
    rating: 5,
    reviewText: "Sarah is so patient and structured! Her IELTS speaking templates boosted my confidence immediately. I went from a 6.0 to a 7.5 in just 6 weeks of tutoring.",
    tutorResponse: "Congratulations David! It was an absolute pleasure teaching you.",
    tutorResponseAt: "2026-08-14T14:00:00Z",
    createdAt: "2026-08-13T16:20:00Z",
    updatedAt: "2026-08-13T16:20:00Z",
  },
  {
    id: "rev-4",
    lessonId: "les-old-3",
    studentId: mockStudents[3].id, // Fatima
    student: mockStudents[3],
    tutorId: mockTutors[2].id, // Sophie Dubois
    rating: 5,
    reviewText: "Sophie's French lessons are so enjoyable! We practice real conversational French and she provides great notes after every session.",
    createdAt: "2026-08-11T12:00:00Z",
    updatedAt: "2026-08-11T12:00:00Z",
  },
  {
    id: "rev-5",
    lessonId: "les-old-4",
    studentId: mockCurrentUser.id,
    student: mockCurrentUser,
    tutorId: mockTutors[3].id, // Gabriel Morales
    rating: 5,
    reviewText: "Gabriel is incredible at explaining subjunctive mood in Spanish. He uses contextual stories that stick. Highly recommended for intermediate learners.",
    tutorResponse: "¡Muchísimas gracias Alex! See you in class next week.",
    tutorResponseAt: "2026-08-06T15:00:00Z",
    createdAt: "2026-08-05T17:40:00Z",
    updatedAt: "2026-08-05T17:40:00Z",
  },
];
