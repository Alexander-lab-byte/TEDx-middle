// Bonum payment gateway (QPay) client.
// Docs: https://psp.bonum.mn/bonum-gateway-apis.html
import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { loadBonumToken, saveBonumToken } from './db.js';

interface TokenResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}

// Bonum rate-limits token creation ("Use previous token. Do not get token too
// frequently."). Tokens are kept in memory for this instance and in Supabase so
// every instance shares one; a new token is only requested when both are stale.
type Cached = { access: string; accessUntil: number; refresh: string; refreshUntil: number };
let memory: Cached | null = null;

const SAFETY_MS = 60_000;

function fromResponse(t: TokenResponse): Cached {
  const now = Date.now();
  return {
    access: t.accessToken,
    accessUntil: now + t.expiresIn * 1000 - SAFETY_MS,
    refresh: t.refreshToken,
    refreshUntil: now + t.refreshExpiresIn * 1000 - SAFETY_MS,
  };
}

async function loadShared(): Promise<Cached | null> {
  try {
    const row = await loadBonumToken();
    if (!row) return null;
    return {
      access: row.access_token,
      accessUntil: new Date(row.access_expires_at).getTime(),
      refresh: row.refresh_token,
      refreshUntil: new Date(row.refresh_expires_at).getTime(),
    };
  } catch (error) {
    console.warn('Could not read shared Bonum token', error);
    return null;
  }
}

async function store(c: Cached): Promise<string> {
  memory = c;
  await saveBonumToken({
    access_token: c.access,
    access_expires_at: new Date(c.accessUntil).toISOString(),
    refresh_token: c.refresh,
    refresh_expires_at: new Date(c.refreshUntil).toISOString(),
  }).catch((error) => console.warn('Could not save shared Bonum token', error));
  return c.access;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getAccessToken(): Promise<string> {
  if (memory && memory.accessUntil > Date.now()) return memory.access;

  const shared = await loadShared();
  if (shared && shared.accessUntil > Date.now()) {
    memory = shared;
    return shared.access;
  }

  const base = config.bonumBase();
  const known = shared ?? memory;
  if (known && known.refreshUntil > Date.now()) {
    const res = await fetch(`${base}/bonum-gateway/ecommerce/auth/refresh`, {
      headers: { Authorization: `Bearer ${known.refresh}` },
    });
    if (res.ok) return store(fromResponse((await res.json()) as TokenResponse));
  }

  const res = await fetch(`${base}/bonum-gateway/ecommerce/auth/create`, {
    headers: {
      Authorization: `AppSecret ${config.bonumAppSecret()}`,
      'X-TERMINAL-ID': config.bonumTerminalId(),
    },
  });
  if (res.ok) return store(fromResponse((await res.json()) as TokenResponse));

  if (res.status === 429) {
    // Another instance probably just got a token; wait briefly and use theirs.
    await sleep(1500);
    const again = await loadShared();
    if (again && again.accessUntil > Date.now()) {
      memory = again;
      return again.access;
    }
  }
  throw new Error(`Bonum auth failed: ${res.status} ${await res.text()}`);
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
