import { supabaseAdmin } from '../config/supabase';

export class AuditService {
  async log(params: {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: params.userId || null,
        action: params.action,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        details: params.details || {},
      });
    } catch (err) {
      console.warn('Audit log failed:', err);
    }
  }
}

export const auditService = new AuditService();
