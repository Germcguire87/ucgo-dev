/**
 * Inner login password encryption — used only for the encrypted payload
 * inside packet 0x00030000 (CLIENT_LOGIN_REQUEST).
 *
 * Key:       username.encode('UTF-16LE') + '\x00\x00'
 * Plaintext: password.encode('UTF-16LE'), padded to next 8-byte boundary
 * Cipher:    UCGOblowfish ECB, no IV
 *
 * Verified test vectors (from CRYPTO_REFERENCE.md):
 *   testuser / a         → F1 72 3D 76 FD C3 3C 4A
 *   testuser / password  → 13 77 98 C4 1D 8E D6 E0
 *   testuser / ZZZZZZZZ  → 4F 1F BE 62 9A 9D 91 C0
 *   testuser / 1234567   → 16 3F 79 55 B1 42 2A B5
 *   anewaccount / abc123 → 9D 72 FD 8A 71 D4 8A 44
 */

import { UcgoBlowfish } from "./UcgoBlowfish.js";

function deriveLoginKey(username: string): Buffer {
  // key = UTF-16LE encoded username + 2-byte null terminator
  const userBuf = Buffer.from(username, "utf16le");
  const key = Buffer.alloc(userBuf.length + 2);
  userBuf.copy(key);
  // last 2 bytes remain 0x00 (null terminator)
  return key;
}

function padToBlock(buf: Buffer): Buffer {
  const remainder = buf.length % 8;
  if (remainder === 0) return buf;
  const padded = Buffer.alloc(buf.length + (8 - remainder));
  buf.copy(padded);
  return padded;
}

/** Encrypt a plaintext password for inclusion in 0x00030000. */
export function encryptLoginPassword(password: string, username: string): Buffer {
  const key       = deriveLoginKey(username);
  const plaintext = padToBlock(Buffer.from(password, "utf16le"));
  const bf        = new UcgoBlowfish(key);
  return bf.encrypt(plaintext);
}

/** Decrypt the ciphertext payload from a received 0x00030000 body. */
export function decryptLoginPassword(ciphertext: Buffer, username: string): string {
  const key   = deriveLoginKey(username);
  const bf    = new UcgoBlowfish(key);
  const plain = bf.decrypt(ciphertext);
  // The client may send extra Blowfish blocks beyond the password content
  // (uninitialized padding bytes beyond the null terminator). Truncate at
  // the first character that is not printable ASCII (0x20–0x7E) or is NUL.
  const decoded = plain.toString("utf16le");
  let end = decoded.length;
  for (let i = 0; i < decoded.length; i++) {
    const c = decoded.charCodeAt(i);
    if (c < 0x20 || c > 0x7e) {
      end = i;
      break;
    }
  }
  return decoded.slice(0, end);
}
