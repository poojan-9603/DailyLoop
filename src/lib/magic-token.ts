// Parent magic-link token using Web Crypto (edge-safe), same pattern as demo-token.ts

export interface MagicPayload {
  userId: string;
  role: "PARENT";
  name: string;
  exp: number;
}

async function magicKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signMagic(payload: MagicPayload, secret: string): Promise<string> {
  const data = JSON.stringify(payload);
  const key = await magicKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return btoa(data) + "." + sigB64;
}

export async function verifyMagic(token: string, secret: string): Promise<MagicPayload | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const dataB64 = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    const data = atob(dataB64);
    const expected = new Uint8Array(
      atob(sigB64)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );
    const key = await magicKey(secret);
    const valid = await crypto.subtle.verify("HMAC", key, expected, new TextEncoder().encode(data));
    if (!valid) return null;
    const payload = JSON.parse(data) as MagicPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
