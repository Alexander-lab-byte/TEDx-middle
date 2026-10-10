// POST /api/checkout — hold a seat and create a Bonum (QPay) invoice.
// Body: { seat, name, phone, email, school, agree: true, lang? }  (agree = accepted the ticket terms)
// Returns: { followUpLink, transactionId } — the browser is sent to followUpLink to pay.
import { randomUUID } from 'node:crypto';
import { createInvoice } from './_lib/bonum.js';
import { config, HOLD_SECONDS, isVipSeat, json, priceForSeat, TOTAL_SEATS } from './_lib/config.js';
import { markUnpaid, reserveSeat, setInvoiceId } from './_lib/db.js';

type Field = 'seat' | 'name' | 'phone' | 'email' | 'school' | 'terms';

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}

export async function POST(request: Request): Promise<Response> {
  let input: Record<string, unknown>;
  try {
    input = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }

  const seat = Number(input.seat);
  const name = clean(input.name, 120);
  const phone = clean(input.phone, 30);
  const email = clean(input.email, 200);
  const school = clean(input.school, 160);
  const lang = input.lang === 'en' ? 'en' : 'mn';

  const invalid: Field[] = [];
  if (!Number.isInteger(seat) || seat < 1 || seat > TOTAL_SEATS) invalid.push('seat');
  if (!name) invalid.push('name');
  if (!/^\+?[0-9 ()-]{8,20}$/.test(phone)) invalid.push('phone');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid.push('email');
  if (!school) invalid.push('school');
  // Buyers must accept the ticket terms (non-refundable) before paying.
  if (input.agree !== true) invalid.push('terms');
  if (invalid.length) return json({ error: 'invalid_fields', fields: invalid }, 400);

  const transactionId = randomUUID();
  // Price is set on the server from the seat: VIP balcony seats cost more.
  const amount = priceForSeat(seat);

  try {
    const orderId = await reserveSeat({ transactionId, seat, name, phone, email, school, amount, holdSeconds: HOLD_SECONDS });
    if (!orderId) return json({ error: 'seat_taken' }, 409);
  } catch (error) {
    console.error('reserve seat failed', error);
    return json({ error: 'unavailable' }, 503);
  }

  try {
    const invoice = await createInvoice({
      amount,
      transactionId,
      callback: `${config.siteUrl()}/api/payment-return?tx=${transactionId}`,
      expiresIn: HOLD_SECONDS,
      title: `TEDxUlaanbaatar Empathy School Youth 2026 — ${isVipSeat(seat) ? 'VIP balcony seat' : 'Seat'} #${seat}`,
      lang,
    });
    await setInvoiceId(transactionId, invoice.invoiceId);
    return json({ followUpLink: invoice.followUpLink, transactionId });
  } catch (error) {
    console.error('create invoice failed', error);
    // Release the seat so someone else can pick it.
    await markUnpaid(transactionId, 'failed').catch(() => undefined);
    return json({ error: 'payment_unavailable' }, 502);
  }
}
