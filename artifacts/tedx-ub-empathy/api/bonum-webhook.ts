// POST /api/bonum-webhook — register this URL with Bonum as the merchant webhook.
import { json } from './_lib/config.js';
import { handleBonumWebhook } from './_lib/webhook.js';

export async function POST(request: Request): Promise<Response> {
  try {
    return await handleBonumWebhook(request);
  } catch (error) {
    console.error('Bonum webhook error', error);
    // Non-2xx so Bonum retries later.
    return json({ ok: false }, 500);
  }
}
