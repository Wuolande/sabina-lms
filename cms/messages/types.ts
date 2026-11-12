export type Party = { name: string; avatar: string | null; href: string | null; subtitle: string | null };
export type ConversationView = { id: number; other: Party; preview: string; at: string | null; unread: boolean; mine: boolean; closed: boolean };
export type MessageView = { id: number; body: string; at: string; mine: boolean };
