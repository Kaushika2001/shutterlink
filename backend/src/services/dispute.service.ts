import { supabaseAdmin } from '../config/supabase';
import { NotFoundError, ValidationError } from '../utils/errors';
import { auditService } from './audit.service';

export class DisputeService {
  async getDisputes(status?: string) {
    let query = supabaseAdmin
      .from('disputes')
      .select('*, bookings(booking_number, service_date)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new ValidationError('Failed to fetch disputes');
    return data || [];
  }

  async getActiveDisputes(limit = 10) {
    const { data, error } = await supabaseAdmin
      .from('disputes')
      .select('*')
      .in('status', ['open', 'investigating'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      status: d.status,
      reason: d.reason,
      customer_name: d.customer_name || 'Customer',
      provider_name: d.provider_name || 'Provider',
    }));
  }

  async updateDisputeStatus(
    disputeId: string,
    status: string,
    resolutionNotes?: string,
    adminUserId?: string
  ) {
    const { data, error } = await supabaseAdmin
      .from('disputes')
      .update({
        status,
        resolution_notes: resolutionNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeId)
      .select()
      .single();

    if (error || !data) throw new NotFoundError('Dispute not found');

    await auditService.log({
      userId: adminUserId,
      action: 'dispute_status_updated',
      entityType: 'dispute',
      entityId: disputeId,
      details: { status },
    });

    return data;
  }
}

export const disputeService = new DisputeService();
