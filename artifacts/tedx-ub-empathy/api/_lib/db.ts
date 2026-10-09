// Minimal Supabase access over its REST API using the service-role key.
// The tedx_seat_orders table has RLS on and no public policies, so only this
// server code can read or write it.
import { config } from './config.js';

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${config.supabaseUrl()}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseServiceKey(),
      Authorization: `Bearer ${config.supabaseServiceKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Supabase rpc ${fn} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${config.supabaseUrl()}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.supabaseServiceKey(),
      Authorization: `Bearer ${config.supabaseServiceKey()}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${init.method || 'GET'} ${path} failed: ${res.status} ${await res.text()}`);
  return res;
}

export interface NewOrder {
  transactionId: string;
  seat: number;
  name: string;
  phone: string;
  email: string;
  school: string;
  amount: number;
  holdSeconds: number;
}

/** Returns the order id, or null if the seat is already sold or held. */
export function reserveSeat(o: NewOrder): Promise<string | null> {
  return rpc<string | null>('tedx_reserve_seat', {
    p_transaction_id: o.transactionId,
    p_seat: o.seat,
    p_name: o.name,
    p_phone: o.phone,
    p_email: o.email,
    p_school: o.school,
    p_amount: o.amount,
    p_hold_seconds: o.holdSeconds,
  });
}

export async function takenSeats(): Promise<number[]> {
  const rows = await rpc<Array<number | { tedx_taken_seats: number }>>('tedx_taken_seats', {});
  return rows.map((r) => (typeof r === 'number' ? r : r.tedx_taken_seats));
}

export type MarkPaidResult = 'paid' | 'already_paid' | 'conflict' | 'amount_mismatch' | 'not_found';

export function markPaid(transactionId: string, amount: number, vendor: string | null, payload: unknown): Promise<MarkPaidResult> {
  return rpc<MarkPaidResult>('tedx_mark_paid', {
    p_transaction_id: transactionId,
    p_amount: amount,
    p_vendor: vendor,
    p_payload: payload,
  });
}

const enc = encodeURIComponent;

/** Marks a still-pending order as failed/expired, which frees its seat. */
export async function markUnpaid(transactionId: string, status: 'failed' | 'expired', payload?: unknown): Promise<void> {
  await rest(`tedx_seat_orders?transaction_id=eq.${enc(transactionId)}&status=eq.pending`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(payload === undefined ? {} : { last_webhook: payload }) }),
  });
}

export async function setInvoiceId(transactionId: string, invoiceId: string): Promise<void> {
  await rest(`tedx_seat_orders?transaction_id=eq.${enc(transactionId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ invoice_id: invoiceId }),
  });
}

export interface OrderSummary {
  seat: number;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'conflict';
  buyer_name: string;
  amount: number;
  expires_at: string;
}

export async function getOrder(transactionId: string): Promise<OrderSummary | null> {
  const res = await rest(
    `tedx_seat_orders?transaction_id=eq.${enc(transactionId)}&select=seat,status,buyer_name,amount,expires_at&limit=1`,
  );
  const rows = (await res.json()) as OrderSummary[];
  return rows[0] ?? null;
}
