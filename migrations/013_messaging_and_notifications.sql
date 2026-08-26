-- ====================================================================
-- MIGRATION 013: Cross-Portal Messaging & Notification System
-- ====================================================================

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tutor_profile_id UUID NOT NULL REFERENCES public.tutor_profiles(id) ON DELETE CASCADE,
    tutor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_conversations_student_tutor UNIQUE (student_id, tutor_profile_id)
);

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('STUDENT', 'TUTOR', 'ADMIN', 'SYSTEM')),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- 3. Create general notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'NEW_MESSAGE', 'LESSON_BOOKED', 'LESSON_REMINDER', 'REVIEW_RECEIVED', 'SYSTEM'
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read_at);

-- 4. Stored Procedure: send_message_atomic
CREATE OR REPLACE FUNCTION public.send_message_atomic(
    p_conversation_id UUID,
    p_sender_id UUID,
    p_content TEXT,
    p_attachments JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conv RECORD;
    v_sender RECORD;
    v_recipient_id UUID;
    v_sender_role TEXT;
    v_msg RECORD;
BEGIN
    -- Fetch conversation
    SELECT * INTO v_conv
    FROM public.conversations
    WHERE id = p_conversation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conversation % not found', p_conversation_id;
    END IF;

    -- Fetch sender
    SELECT id, display_name, avatar_url INTO v_sender
    FROM public.users
    WHERE id = p_sender_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sender % not found', p_sender_id;
    END IF;

    -- Determine recipient and sender role
    IF p_sender_id = v_conv.student_id THEN
        v_recipient_id := v_conv.tutor_user_id;
        v_sender_role := 'STUDENT';
    ELSIF p_sender_id = v_conv.tutor_user_id THEN
        v_recipient_id := v_conv.student_id;
        v_sender_role := 'TUTOR';
    ELSE
        v_recipient_id := v_conv.student_id;
        v_sender_role := 'ADMIN';
    END IF;

    -- Insert message
    INSERT INTO public.messages (conversation_id, sender_id, sender_role, content, attachments, created_at)
    VALUES (p_conversation_id, p_sender_id, v_sender_role, p_content, COALESCE(p_attachments, '[]'::jsonb), now())
    RETURNING * INTO v_msg;

    -- Update conversation last message timestamp & text
    UPDATE public.conversations
    SET last_message_text = p_content,
        last_message_at = now(),
        updated_at = now()
    WHERE id = p_conversation_id;

    -- Create notification for recipient
    INSERT INTO public.notifications (user_id, type, title, body, action_url, metadata)
    VALUES (
        v_recipient_id,
        'NEW_MESSAGE',
        'New message from ' || v_sender.display_name,
        p_content,
        CASE
            WHEN v_sender_role = 'STUDENT' THEN '/tutor/messages?conv=' || p_conversation_id
            ELSE '/student/messages?conv=' || p_conversation_id
        END,
        jsonb_build_object(
            'conversationId', p_conversation_id,
            'messageId', v_msg.id,
            'senderId', p_sender_id,
            'senderName', v_sender.display_name,
            'senderAvatar', v_sender.avatar_url
        )
    );

    RETURN jsonb_build_object(
        'id', v_msg.id,
        'conversationId', v_msg.conversation_id,
        'senderId', v_msg.sender_id,
        'senderRole', v_msg.sender_role,
        'senderName', v_sender.display_name,
        'senderAvatar', v_sender.avatar_url,
        'content', v_msg.content,
        'attachments', v_msg.attachments,
        'readAt', v_msg.read_at,
        'createdAt', v_msg.created_at
    );
END;
$$;

-- 5. Stored Procedure: get_user_conversations
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'studentId', c.student_id,
        'tutorProfileId', c.tutor_profile_id,
        'tutorUserId', c.tutor_user_id,
        'lastMessageText', c.last_message_text,
        'lastMessageAt', c.last_message_at,
        'createdAt', c.created_at,
        'student', jsonb_build_object(
            'id', u_stu.id,
            'displayName', u_stu.display_name,
            'avatarUrl', u_stu.avatar_url,
            'country', u_stu.country,
            'timezone', u_stu.timezone
        ),
        'tutor', jsonb_build_object(
            'id', u_tut.id,
            'tutorProfileId', tp.id,
            'displayName', u_tut.display_name,
            'avatarUrl', u_tut.avatar_url,
            'headline', tp.headline,
            'hourlyRate', tp.hourly_rate,
            'currency', tp.currency
        ),
        'unreadCount', (
            SELECT COUNT(*)
            FROM public.messages m
            WHERE m.conversation_id = c.id
              AND m.sender_id != p_user_id
              AND m.read_at IS NULL
        )
    ) ORDER BY c.last_message_at DESC), '[]'::jsonb)
    INTO result
    FROM public.conversations c
    JOIN public.users u_stu ON u_stu.id = c.student_id
    JOIN public.tutor_profiles tp ON tp.id = c.tutor_profile_id
    JOIN public.users u_tut ON u_tut.id = c.tutor_user_id
    WHERE c.student_id = p_user_id OR c.tutor_user_id = p_user_id;

    RETURN result;
END;
$$;

-- 6. Stored Procedure: get_conversation_messages
CREATE OR REPLACE FUNCTION public.get_conversation_messages(p_conversation_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Mark unread incoming messages as read
    UPDATE public.messages
    SET read_at = now()
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND read_at IS NULL;

    -- Also mark any associated notifications as read
    UPDATE public.notifications
    SET read_at = now()
    WHERE user_id = p_user_id
      AND type = 'NEW_MESSAGE'
      AND (metadata->>'conversationId')::uuid = p_conversation_id
      AND read_at IS NULL;

    -- Fetch messages
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', m.id,
        'conversationId', m.conversation_id,
        'senderId', m.sender_id,
        'senderRole', m.sender_role,
        'senderName', u.display_name,
        'senderAvatar', u.avatar_url,
        'content', m.content,
        'attachments', m.attachments,
        'readAt', m.read_at,
        'createdAt', m.created_at
    ) ORDER BY m.created_at ASC), '[]'::jsonb)
    INTO result
    FROM public.messages m
    JOIN public.users u ON u.id = m.sender_id
    WHERE m.conversation_id = p_conversation_id;

    RETURN result;
END;
$$;

-- 7. Stored Procedure: get_user_notifications
CREATE OR REPLACE FUNCTION public.get_user_notifications(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notifs JSONB;
    v_unread_count INT;
    result JSONB;
BEGIN
    SELECT COUNT(*) INTO v_unread_count
    FROM public.notifications
    WHERE user_id = p_user_id AND read_at IS NULL;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', n.id,
        'userId', n.user_id,
        'type', n.type,
        'title', n.title,
        'body', n.body,
        'actionUrl', n.action_url,
        'metadata', n.metadata,
        'readAt', n.read_at,
        'createdAt', n.created_at
    ) ORDER BY n.created_at DESC), '[]'::jsonb)
    INTO v_notifs
    FROM (
        SELECT *
        FROM public.notifications
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 30
    ) n;

    SELECT jsonb_build_object(
        'unreadCount', v_unread_count,
        'notifications', v_notifs
    ) INTO result;

    RETURN result;
END;
$$;
