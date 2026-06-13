import crypto from "crypto";

// Base32 Alphabet
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// Decodes a base32 string to a Buffer
function base32Decode(base32: string): Buffer {
  const cleanBase32 = base32.toUpperCase().replace(/=+$/, "");
  const length = cleanBase32.length;
  const buffer = Buffer.alloc(Math.floor((length * 5) / 8));
  
  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < length; i++) {
    const char = cleanBase32.charAt(i);
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) throw new Error("Invalid base32 character");
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      buffer[index++] = (value >> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return buffer;
}

// Generates a random Base32 secret
export function generateTwoFactorSecret(): string {
  const bytes = crypto.randomBytes(16); // 16 characters = 80 bits of entropy
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    const val = bytes[i];
    if (val === undefined) continue;
    const char = BASE32_CHARS.charAt(val % 32);
    result += char;
  }
  return result;
}

// Generates the 6-digit TOTP token
export function generateTOTP(secret: string, timeStep = 30): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);

  // Convert counter to 8-byte buffer (upper 4 bytes are 0, lower 4 bytes are the big-endian counter)
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(0, 0);
  buffer.writeUInt32BE(counter, 4);

  // HMAC-SHA1
  const hmac = crypto.createHmac("sha1", key);
  hmac.update(buffer);
  const hmacResult = hmac.digest();

  // Dynamic truncation
  const lastByte = hmacResult[hmacResult.length - 1];
  if (lastByte === undefined) {
    throw new Error("Invalid HMAC result length");
  }
  const offset = lastByte & 0xf;
  const b0 = hmacResult[offset] ?? 0;
  const b1 = hmacResult[offset + 1] ?? 0;
  const b2 = hmacResult[offset + 2] ?? 0;
  const b3 = hmacResult[offset + 3] ?? 0;

  const code =
    ((b0 & 0x7f) << 24) |
    ((b1 & 0xff) << 16) |
    ((b2 & 0xff) << 8) |
    (b3 & 0xff);

  const otp = code % 1_000_000;
  return otp.toString().padStart(6, "0");
}

// Verifies the TOTP token (with +/- 1 step drift window)
export function verifyTOTP(token: string, secret: string, timeStep = 30): boolean {
  if (!token || token.length !== 6) return false;
  
  let key: Buffer;
  try {
    key = base32Decode(secret);
  } catch {
    return false;
  }
  const epoch = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(epoch / timeStep);

  // Check current, previous, and next window
  for (let drift = -1; drift <= 1; drift++) {
    const counter = currentCounter + drift;
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(0, 0);
    buffer.writeUInt32BE(counter, 4);

    const hmac = crypto.createHmac("sha1", key);
    hmac.update(buffer);
    const hmacResult = hmac.digest();

    const lastByte = hmacResult[hmacResult.length - 1];
    if (lastByte === undefined) continue;

    const offset = lastByte & 0xf;
    const b0 = hmacResult[offset] ?? 0;
    const b1 = hmacResult[offset + 1] ?? 0;
    const b2 = hmacResult[offset + 2] ?? 0;
    const b3 = hmacResult[offset + 3] ?? 0;

    const code =
      ((b0 & 0x7f) << 24) |
      ((b1 & 0xff) << 16) |
      ((b2 & 0xff) << 8) |
      (b3 & 0xff);

    const otp = code % 1_000_000;
    if (otp.toString().padStart(6, "0") === token) {
      return true;
    }
  }
  return false;
}
