import { Conversation, Message } from "@/types";
import { mockCurrentUser } from "./students";
import { mockTutors } from "./tutors";

export const mockMessages: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "msg-1-1",
      conversationId: "conv-1",
      senderId: mockTutors[4].user.id, // Sarah Jenkins
      senderName: mockTutors[4].user.displayName,
      senderAvatar: mockTutors[4].user.avatarUrl,
      senderRole: "TUTOR",
      content: "Hi Alex! Looking forward to our upcoming IELTS prep session today. Have you had a chance to look over the Part 2 speaking cards?",
      createdAt: "2026-08-24T03:30:00Z",
    },
    {
      id: "msg-1-2",
      conversationId: "conv-1",
      senderId: mockCurrentUser.id,
      senderName: mockCurrentUser.displayName,
      senderAvatar: mockCurrentUser.avatarUrl,
      senderRole: "STUDENT",
      content: "Hello Sarah! Yes, I reviewed the cards on describing a memorable journey and a book that influenced me.",
      createdAt: "2026-08-24T03:45:00Z",
    },
    {
      id: "msg-1-3",
      conversationId: "conv-1",
      senderId: mockTutors[4].user.id,
      senderName: mockTutors[4].user.displayName,
      senderAvatar: mockTutors[4].user.avatarUrl,
      senderRole: "TUTOR",
      content: "Fantastic! We'll do a mock test under strict 2-minute timing conditions, then dissect vocabulary choices. See you in the classroom in 20 minutes!",
      createdAt: "2026-08-24T04:10:00Z",
    },
  ],
  "conv-2": [
    {
      id: "msg-2-1",
      conversationId: "conv-2",
      senderId: mockTutors[0].user.id, // Elena Rostova
      senderName: mockTutors[0].user.displayName,
      senderAvatar: mockTutors[0].user.avatarUrl,
      senderRole: "TUTOR",
      content: "Hello Alex, I've uploaded the Vector Fields cheat sheet for our Wednesday math lesson. Feel free to preview the gradient examples.",
      createdAt: "2026-08-23T15:20:00Z",
    },
    {
      id: "msg-2-2",
      conversationId: "conv-2",
      senderId: mockCurrentUser.id,
      senderName: mockCurrentUser.displayName,
      senderAvatar: mockCurrentUser.avatarUrl,
      senderRole: "STUDENT",
      content: "Thank you Dr. Elena! Downloaded and will review before class.",
      createdAt: "2026-08-23T16:00:00Z",
    },
  ],
  "conv-3": [
    {
      id: "msg-3-1",
      conversationId: "conv-3",
      senderId: mockTutors[1].user.id, // Marcus Thorne
      senderName: mockTutors[1].user.displayName,
      senderAvatar: mockTutors[1].user.avatarUrl,
      senderRole: "TUTOR",
      content: "Great job in our Python session on decorators! Here's the code snippet we wrote during class for your reference.",
      attachments: [
        {
          id: "att-1",
          name: "decorators_sample.py",
          sizeBytes: 4096,
          type: "code",
          url: "/mock-files/decorators.py",
        },
      ],
      createdAt: "2026-08-18T19:05:00Z",
    },
    {
      id: "msg-3-2",
      conversationId: "conv-3",
      senderId: mockCurrentUser.id,
      senderName: mockCurrentUser.displayName,
      senderAvatar: mockCurrentUser.avatarUrl,
      senderRole: "STUDENT",
      content: "Thanks Marcus! Left a 5-star review as well. Appreciate the great mentorship!",
      createdAt: "2026-08-18T20:20:00Z",
    },
  ],
};

export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    participants: [mockCurrentUser, mockTutors[4].user],
    lastMessage: mockMessages["conv-1"][mockMessages["conv-1"].length - 1],
    unreadCount: 1,
    updatedAt: "2026-08-24T04:10:00Z",
  },
  {
    id: "conv-2",
    participants: [mockCurrentUser, mockTutors[0].user],
    lastMessage: mockMessages["conv-2"][mockMessages["conv-2"].length - 1],
    unreadCount: 0,
    updatedAt: "2026-08-23T16:00:00Z",
  },
  {
    id: "conv-3",
    participants: [mockCurrentUser, mockTutors[1].user],
    lastMessage: mockMessages["conv-3"][mockMessages["conv-3"].length - 1],
    unreadCount: 0,
    updatedAt: "2026-08-18T20:20:00Z",
  },
];
