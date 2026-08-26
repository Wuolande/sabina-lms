/**
 * Audit Repository — Immutable Event Log
 * -----------------------------------------------------------------------
 * Records every admin action to Supabase audit_logs table.
 * The table has RLS INSERT-only policy — no updates or deletes allowed.
 *
 * Key design decisions:
 *  - Uses adminSupabase (service role) to bypass RLS for writes
 *  - Idempotency: each entry has a unique id generated before insert
 *  - Fails silently on DB errors (audit should never block business logic)
 *  - queryByEntity() is used by the Tutor 360° audit trail tab
 *
 * Migration note: Queries table public.audit_logs (migration 002).
 * -----------------------------------------------------------------------
 */

import { adminSupabase } from '../database/supabase';

export interface AuditLogEntry {
  /** Optional idempotency key — prevents duplicate entries on retries */
  idempotencyKey?: string;
  actorUserId?: string;
  actorName: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
}

export interface AuditLogRecord {
  id: string;
  actorName: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  createdAt: string;
}

export class AuditRepository {
  /**
   * Record an immutable admin action to audit_logs.
   * Never throws — audit failures must never block the main operation.
   */
  async record(entry: AuditLogEntry): Promise<void> {
    const id = entry.idempotencyKey
      || `aud-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const { error } = await adminSupabase.from('audit_logs').insert({
        id,
        actor_user_id: entry.actorUserId || null,
        actor_name: entry.actorName,
        actor_role: entry.actorRole || null,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        details: entry.details || null,
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent || null,
        request_id: entry.requestId || null,
        metadata: entry.metadata || {},
        before_state: entry.beforeState || null,
        after_state: entry.afterState || null,
      });

      if (error) {
        // Do not rethrow — audit failures are logged but non-blocking
        console.warn('[AuditRepository] Failed to write audit log:', error.message);
      }
    } catch (err) {
      console.warn('[AuditRepository] Unexpected error writing audit log:', err);
    }
  }

  /**
   * Query audit logs with pagination and optional filters.
   * Used by the admin audit logs page.
   */
  async query(options: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
    actorUserId?: string;
  }): Promise<{ data: AuditLogRecord[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const offset = (page - 1) * limit;

    let query = adminSupabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (options.entityType) query = query.eq('entity_type', options.entityType);
    if (options.action) query = query.ilike('action', `%${options.action}%`);
    if (options.actorUserId) query = query.eq('actor_user_id', options.actorUserId);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`[AuditRepository] Failed to query audit logs: ${error.message}`);
    }

    return {
      data: (data || []).map((d: any) => this.mapRecord(d)),
      total: count || 0,
      page,
      limit,
    };
  }

  /**
   * Fetch all audit log entries for a specific entity.
   * Used by Tutor 360° audit trail tab to show per-tutor admin history.
   */
  async queryByEntity(
    entityType: string,
    entityId: string,
    limit = 50
  ): Promise<AuditLogRecord[]> {
    const { data, error } = await adminSupabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn(`[AuditRepository] queryByEntity error: ${error.message}`);
      return [];
    }

    return (data || []).map((d: any) => this.mapRecord(d));
  }

  private mapRecord(d: any): AuditLogRecord {
    return {
      id: d.id,
      actorName: d.actor_name || 'Administrator',
      actorRole: d.actor_role,
      action: d.action,
      entityType: d.entity_type,
      entityId: d.entity_id,
      details: d.details,
      ipAddress: d.ip_address,
      beforeState: d.before_state,
      afterState: d.after_state,
      createdAt: d.created_at,
    };
  }
}

export const auditRepository = new AuditRepository();
