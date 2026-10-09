// GET /api/seats — seats that are sold or currently held, plus the ticket price.
import { config, json, TOTAL_SEATS } from './_lib/config.js';
import { takenSeats } from './_lib/db.js';

export async function GET(): Promise<Response> {
  try {
    const taken = await takenSeats();
    return json({ taken, total: TOTAL_SEATS, price: config.ticketPrice() });
  } catch (error) {
    console.error('seats error', error);
    return json({ error: 'unavailable' }, 503);
  }
}
