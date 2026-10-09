// Server-only configuration. Everything here comes from Vercel environment
// variables and is never shipped to the browser.

export const TOTAL_SEATS = 100;
// How long a seat is held for someone while they pay, in seconds.
export const HOLD_SECONDS = 15 * 60;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const config = {
  // Sandbox by default; set BONUM_API_BASE=https://apis.bonum.mn for real payments.
  bonumBase: () => (process.env.BONUM_API_BASE || 'https://testapi.bonum.mn').trim().replace(/\/$/, ''),
  // Accept either name; the Vercel project uses BONUM_APP_SECRET_KEY.
  bonumAppSecret: () => (process.env.BONUM_APP_SECRET_KEY || required('BONUM_APP_SECRET')).trim(),
  bonumTerminalId: () => required('BONUM_TERMINAL_ID').trim(),
  bonumChecksumKey: () => required('BONUM_CHECKSUM_KEY').trim(),
  // Optional comma-separated list, e.g. "QPAY". Empty = every provider on your contract.
  bonumProviders: () =>
    (process.env.BONUM_PROVIDERS || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
  supabaseUrl: () => required('SUPABASE_URL').trim().replace(/\/$/, ''),
  supabaseServiceKey: () => required('SUPABASE_SERVICE_ROLE_KEY').trim(),
  // Public site URL used to build the return link, e.g. https://www.tedxulaanbaatarempathyschoolyouth.com
  siteUrl: () => required('SITE_URL').trim().replace(/\/$/, ''),
  ticketPrice: () => {
    const price = Number(process.env.TICKET_PRICE_MNT || 30000);
    if (!Number.isInteger(price) || price <= 0) throw new Error('TICKET_PRICE_MNT must be a positive integer');
    return price;
  },
};

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}
