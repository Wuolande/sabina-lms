/**
 * Messaging Domain Types
 * -----------------------------------------------------------------------
 */

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  sizeBytes?: number;
  fileType?: string;
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'STUDENT' | 'TUTOR' | 'ADMIN' | 'SYSTEM';
  senderName: string;
  senderAvatar?: string;
  content: string;
  attachments?: MessageAttachment[];
  readAt?: string;
  createdAt: string;
}

export interface ConversationParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  country?: string;
  timezone?: string;
  headline?: string;
  hourlyRate?: number;
  currency?: string;
  tutorProfileId?: string;
  slug?: string;
}

export interface ConversationItem {
  id: string;
  studentId: string;
  tutorProfileId: string;
  tutorUserId: string;
  lastMessageText?: string;
  lastMessageAt: string;
  createdAt: string;
  student: ConversationParticipant;
  tutor: ConversationParticipant;
  unreadCount: number;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  attachments?: MessageAttachment[];
}

export interface StartConversationPayload {
  studentId: string;
  tutorProfileId: string;
  initialMessage?: string;
}
