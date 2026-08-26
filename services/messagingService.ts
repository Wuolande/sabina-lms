/**
 * Client Messaging Service — Connected to Supabase DB API
 * -----------------------------------------------------------------------
 */

import { ConversationItem, ChatMessageItem } from "@/src/modules/messaging/domain/types";

export const messagingService = {
  /**
   * Get all active conversations for the current user.
   */
  async getConversations(): Promise<ConversationItem[]> {
    try {
      const res = await fetch('/api/messages/conversations');
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  /**
   * Get messages for a specific conversation.
   */
  async getMessages(conversationId: string): Promise<ChatMessageItem[]> {
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  /**
   * Send a new message to a conversation.
   */
  async sendMessage(
    conversationId: string,
    content: string,
    attachments?: any[]
  ): Promise<ChatMessageItem | null> {
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content, attachments }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.message;
    } catch {
      return null;
    }
  },

  /**
   * Start or retrieve a conversation with a tutor/student.
   */
  async startConversation(payload: {
    studentId?: string;
    tutorProfileId?: string;
    initialMessage?: string;
  }): Promise<string | null> {
    try {
      const res = await fetch('/api/messages/conversations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.conversationId;
    } catch {
      return null;
    }
  },
};
