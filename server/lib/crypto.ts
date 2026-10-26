import { JwtUserPayload } from '../env';

const encoder = new TextEncoder();

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function base64UrlEncode(str: string): string {
  const bytes = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bufferToHex(arr.buffer);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 50000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return bufferToHex(derivedBits);
}

export async function signJwt(payload: JwtUserPayload, secret: string): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const data = `${header}.${body}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const sig = base64UrlEncode(String.fromCharCode(...new Uint8Array(sigBuf)));
  return `${data}.${sig}`;
}

export async function verifyJwt(
  token: string,
  secret: string
): Promise<JwtUserPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const data = `${header}.${body}`;

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const expectedSigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const expectedSig = base64UrlEncode(
      String.fromCharCode(...new Uint8Array(expectedSigBuf))
    );
    if (sig !== expectedSig) return null;

    const payload = JSON.parse(base64UrlDecode(body)) as JwtUserPayload;
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
