import type { Role } from "@prisma/client";

/**
 * Tiny signed-token helper for DEMO sessions, using Web Crypto (HMAC-SHA256) so
 * it runs in both the edge middleware and the Node runtime. Demo sessions are
 * deliberately low-stakes (read-write against demo org data only), but we still
 * sign them so the cookie can't be trivially forged to escalate role.
 */

export interface DemoPayload {
  userId: string;
  role: Role;
  name: string;
  exp: number; // epoch ms
}

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const norm = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(norm);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret) as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// Web Crypto's BufferSource type in the DOM lib is stricter than the Uint8Array
// we produce; this coercion keeps the edge/Node runtimes happy.
const buf = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

export async function signDemo(payload: DemoPayload, secret: string): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(secret), buf(enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export async function verifyDemo(token: string, secret: string): Promise<DemoPayload | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const ok = await crypto.subtle.verify(
    "HMAC",
    await key(secret),
    buf(fromB64url(sig)),
    buf(enc.encode(body)),
  );
  if (!ok) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as DemoPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
