// The invoice `callback` URL. Bonum's docs describe it both as the page the
// buyer is sent back to and as a notification URL, so this handles both:
//   GET  -> redirect the buyer to the site's payment status page
//   POST -> treat as a signed payment notification (same as /api/bonum-webhook)
import { config, json } from './_lib/config.js';
import { handleBonumWebhook } from './_lib/webhook.js';

export function GET(request: Request): Response {
  const tx = new URL(request.url).searchParams.get('tx') ?? '';
  const target = `${config.siteUrl()}/payment?tx=${encodeURIComponent(tx)}`;
  return new Response(null, { status: 302, headers: { Location: target, 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request): Promise<Response> {
  try {
    return await handleBonumWebhook(request);
  } catch (error) {
    console.error('Bonum callback error', error);
    return json({ ok: false }, 500);
  }
}
