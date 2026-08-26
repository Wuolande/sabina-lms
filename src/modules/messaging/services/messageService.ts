/**
 * Message Service — Business Logic for Conversations & Messaging
 * -----------------------------------------------------------------------
 */

import { messageRepository } from '../repositories/messageRepository';
import { ConversationItem, ChatMessageItem } from '../domain/types';
import { ValidationError } from '@/src/shared/errors';

export class MessageService {
  async getUserConversations(userId: string): Promise<ConversationItem[]> {
    return messageRepository.getUserConversations(userId);
  }

  async getConversationMessages(conversationId: string, userId: string): Promise<ChatMessageItem[]> {
    return messageRepository.getConversationMessages(conversationId, userId);
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachments?: any[]
  ): Promise<ChatMessageItem> {
    if (!content || !content.trim()) {
      throw new ValidationError('Message content cannot be empty.');
    }
    return messageRepository.sendMessage(conversationId, senderId, content, attachments);
  }

  async findOrCreateConversation(studentId: string, tutorProfileId: string, initialMessage?: string) {
    const convId = await messageRepository.findOrCreateConversation(studentId, tutorProfileId);
    if (initialMessage && initialMessage.trim()) {
      await messageRepository.sendMessage(convId, studentId, initialMessage);
    }
    return convId;
  }
}

export const domainMessageService = new MessageService();
