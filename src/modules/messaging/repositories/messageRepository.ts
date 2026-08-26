/**
 * Message Repository — Supabase DB Access for Conversations & Messages
 * -----------------------------------------------------------------------
 */

import { adminSupabase } from '@/src/shared/database/supabase';
import { ConversationItem, ChatMessageItem } from '../domain/types';

export class MessageRepository {
  /**
   * Get all conversations for a user.
   */
  async getUserConversations(userId: string): Promise<ConversationItem[]> {
    const { data, error } = await adminSupabase.rpc('get_user_conversations', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`[MessageRepository.getUserConversations] ${error.message}`);
    }
    return data || [];
  }

  /**
   * Get messages for a conversation and mark as read.
   */
  async getConversationMessages(conversationId: string, userId: string): Promise<ChatMessageItem[]> {
    const { data, error } = await adminSupabase.rpc('get_conversation_messages', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`[MessageRepository.getConversationMessages] ${error.message}`);
    }
    return data || [];
  }

  /**
   * Send a message atomically.
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachments?: any[]
  ): Promise<ChatMessageItem> {
    const { data, error } = await adminSupabase.rpc('send_message_atomic', {
      p_conversation_id: conversationId,
      p_sender_id: senderId,
      p_content: content.trim(),
      p_attachments: attachments ? JSON.stringify(attachments) : '[]',
    });

    if (error) {
      throw new Error(`[MessageRepository.sendMessage] ${error.message}`);
    }
    return data;
  }

  /**
   * Find or create conversation between student and tutor.
   */
  async findOrCreateConversation(studentId: string, tutorProfileId: string): Promise<string> {
    // Check existing
    const { data: existing } = await adminSupabase
      .from('conversations')
      .select('id')
      .eq('student_id', studentId)
      .eq('tutor_profile_id', tutorProfileId)
      .single();

    if (existing) {
      return existing.id;
    }

    // Get tutor user id
    const { data: tutorProf, error: tutErr } = await adminSupabase
      .from('tutor_profiles')
      .select('user_id')
      .eq('id', tutorProfileId)
      .single();

    if (tutErr || !tutorProf) {
      throw new Error(`Tutor profile ${tutorProfileId} not found`);
    }

    const { data: newConv, error: insErr } = await adminSupabase
      .from('conversations')
      .insert({
        student_id: studentId,
        tutor_profile_id: tutorProfileId,
        tutor_user_id: tutorProf.user_id,
        last_message_text: 'Conversation started',
      })
      .select('id')
      .single();

    if (insErr || !newConv) {
      throw new Error(`Failed to create conversation: ${insErr?.message}`);
    }

    return newConv.id;
  }
}

export const messageRepository = new MessageRepository();
