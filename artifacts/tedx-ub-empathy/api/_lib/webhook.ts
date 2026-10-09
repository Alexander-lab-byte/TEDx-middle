import { verifyChecksum, type BonumWebhook } from './bonum.js';
import { json } from './config.js';
import { markPaid, markUnpaid } from './db.js';

/** Shared handler for Bonum's payment notifications. */
export async function handleBonumWebhook(request: Request): Promise<Response> {
  const raw = await request.text();
  if (!verifyChecksum(raw, request.headers.get('x-checksum-v2'))) {
    console.warn('Bonum webhook rejected: bad or missing x-checksum-v2');
    return json({ ok: false, error: 'invalid checksum' }, 401);
  }

  let event: BonumWebhook;
  try {
    event = JSON.parse(raw) as BonumWebhook;
  } catch {
    return json({ ok: false, error: 'invalid json' }, 400);
  }

  if (event.type && event.type !== 'PAYMENT') return json({ ok: true, ignored: event.type });

  const body = event.body ?? {};
  const transactionId = body.transactionId;
  if (!transactionId) return json({ ok: false, error: 'missing transactionId' }, 400);

  if (event.status === 'SUCCESS' && body.status === 'PAID') {
    const result = await markPaid(transactionId, Number(body.amount), body.paymentVendor ?? null, event);
    if (result === 'conflict' || result === 'amount_mismatch' || result === 'not_found') {
      // Money arrived but can't be matched to a free seat — needs a manual refund/check.
      console.error(`Bonum payment needs attention: ${result}`, { transactionId, invoiceId: body.invoiceId });
    }
    return json({ ok: true, result });
  }

  if (event.status === 'FAILED') {
    await markUnpaid(transactionId, body.invoiceStatus === 'EXPIRED' ? 'expired' : 'failed', event);
    return json({ ok: true, result: 'released' });
  }

  return json({ ok: true, ignored: event.status ?? 'unknown' });
}
