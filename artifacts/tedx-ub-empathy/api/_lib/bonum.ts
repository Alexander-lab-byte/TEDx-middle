// Bonum payment gateway (QPay) client.
// Docs: https://psp.bonum.mn/bonum-gateway-apis.html
import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';

interface TokenResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}

// Bonum rate-limits token creation ("Use previous token"), so keep the token
// for as long as this server instance stays warm.
let cached: { access: string; accessUntil: number; refresh: string; refreshUntil: number } | null = null;

function remember(t: TokenResponse) {
  const now = Date.now();
  cached = {
    access: t.accessToken,
    accessUntil: now + (t.expiresIn - 60) * 1000,
    refresh: t.refreshToken,
    refreshUntil: now + (t.refreshExpiresIn - 60) * 1000,
  };
  return t.accessToken;
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.accessUntil > now) return cached.access;
  const base = config.bonumBase();
  if (cached && cached.refreshUntil > now) {
    const res = await fetch(`${base}/bonum-gateway/ecommerce/auth/refresh`, {
      headers: { Authorization: `Bearer ${cached.refresh}` },
    });
    if (res.ok) return remember((await res.json()) as TokenResponse);
  }
  const res = await fetch(`${base}/bonum-gateway/ecommerce/auth/create`, {
    headers: {
      Authorization: `AppSecret ${config.bonumAppSecret()}`,
      'X-TERMINAL-ID': config.bonumTerminalId(),
    },
  });
  if (!res.ok) throw new Error(`Bonum auth failed: ${res.status} ${await res.text()}`);
  return remember((await res.json()) as TokenResponse);
}

export interface CreateInvoiceInput {
  amount: number;
  transactionId: string;
  callback: string;
  expiresIn: number;
  title: string;
  lang: 'mn' | 'en';
}

export async function createInvoice(input: CreateInvoiceInput): Promise<{ invoiceId: string; followUpLink: string }> {
  const providers = config.bonumProviders();
  const body = {
    amount: input.amount,
    callback: input.callback,
    transactionId: input.transactionId,
    expiresIn: input.expiresIn,
    ...(providers.length ? { providers } : {}),
    items: [{ title: input.title, remark: input.title, amount: input.amount, count: 1 }],
  };
  const res = await fetch(`${config.bonumBase()}/bonum-gateway/ecommerce/invoices`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      'Accept-Language': input.lang,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Bonum create invoice failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { invoiceId?: string; followUpLink?: string };
  if (!data.invoiceId || !data.followUpLink) throw new Error(`Bonum create invoice: unexpected response ${JSON.stringify(data)}`);
  return { invoiceId: data.invoiceId, followUpLink: data.followUpLink };
}

function hmacHex(text: string, key: string): string {
  return createHmac('sha256', key).update(text, 'utf8').digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a.toLowerCase(), 'utf8');
  const y = Buffer.from(b.toLowerCase(), 'utf8');
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Checks Bonum's `x-checksum-v2` header: hex HMAC-SHA256 of the compact JSON
 * body, keyed with the merchant checksum key. We try the raw body exactly as
 * sent first, then a compact re-serialization (what Bonum's own example does).
 */
export function verifyChecksum(rawBody: string, header: string | null, key = config.bonumChecksumKey()): boolean {
  if (!header) return false;
  const candidates = [rawBody];
  try {
    candidates.push(JSON.stringify(JSON.parse(rawBody)));
  } catch {
    return false;
  }
  return candidates.some((text) => safeEqualHex(hmacHex(text, key), header.trim()));
}

export interface BonumWebhook {
  type?: string;
  status?: string;
  message?: string;
  body?: {
    invoiceId?: string;
    transactionId?: string;
    amount?: number | string;
    currency?: string;
    status?: string;
    invoiceStatus?: string;
    paymentVendor?: string;
    completedAt?: string;
  };
}
