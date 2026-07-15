import { getSupabaseUrl, getSupabaseServiceRoleKey } from './env.ts';

/**
 * Ask process-email-queue to send a specific just-queued row right away,
 * instead of leaving it for the periodic cron to pick up. Mirrors the
 * frontend's assessmentNotificationService.triggerImmediateEmailProcessing —
 * server-side notification queuers must call this too, otherwise the email
 * silently sits as "pending" until something else processes the queue.
 * Failures are logged but never thrown — the row stays queued either way.
 */
export async function triggerImmediateEmailProcessing(emailQueueId?: string): Promise<void> {
  if (!emailQueueId) return;
  try {
    const url = `${getSupabaseUrl()}/functions/v1/process-email-queue`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSupabaseServiceRoleKey()}`,
        'apikey': getSupabaseServiceRoleKey(),
      },
      body: JSON.stringify({ emailQueueId }),
    });
    if (!res.ok) {
      console.error('process-email-queue returned non-OK status:', res.status, await res.text());
    }
  } catch (error) {
    console.error('Error triggering immediate email queue processing:', error);
  }
}
