// GET /api/order?tx=<transactionId> — payment status for the return page.
// transaction ids are random UUIDs, so only the buyer who started the order knows theirs.
import { json } from './_lib/config.js';
import { getOrder } from './_lib/db.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request): Promise<Response> {
  const tx = new URL(request.url).searchParams.get('tx') ?? '';
  if (!UUID.test(tx)) return json({ error: 'not found' }, 404);
  try {
    const order = await getOrder(tx);
    if (!order) return json({ error: 'not found' }, 404);
    // A pending order whose hold has run out is effectively expired.
    const status = order.status === 'pending' && new Date(order.expires_at).getTime() < Date.now() ? 'expired' : order.status;
    return json({ seat: order.seat, status, name: order.buyer_name, amount: order.amount });
  } catch (error) {
    console.error('order lookup error', error);
    return json({ error: 'unavailable' }, 503);
  }
}
