// GET /api/seats — seats that are sold or currently held, plus ticket prices.
import { config, json, TOTAL_SEATS, VIP_FIRST_SEAT } from './_lib/config.js';
import { takenSeats } from './_lib/db.js';

export async function GET(): Promise<Response> {
  try {
    const taken = await takenSeats();
    return json({ taken, total: TOTAL_SEATS, price: config.ticketPrice(), vipPrice: config.vipPrice(), vipFirstSeat: VIP_FIRST_SEAT });
  } catch (error) {
    console.error('seats error', error);
    return json({ error: 'unavailable' }, 503);
  }
}
