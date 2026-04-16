import { randomBytes } from "node:crypto";
import { UcgoBlowfish } from "./UcgoBlowfish.js";
import { deriveXorKey, type XorTable } from "./xorTable.js";
import { UcgoCryptoError } from "../utils/errors.js";
import { HEADER_SIZE, MAX_PACKET_BODY_SIZE } from "../protocol/headerConstants.js";

export interface TransportCryptoOptions {
  xorTable: XorTable;
  blowfishKey: Buffer | string;
}

export interface DecryptedTransportResult {
  /** Fully decrypted 64-byte header. */
  header: Buffer;
  /** Fully decrypted body — xorSize bytes. */
  body: Buffer;
  xorSize: number;
  blowfishSize: number;
}

/**
 * Decrypt a single UCGO packet from a raw wire buffer.
 *
 * Decrypt order: Blowfish → XOR
 *
 * @param input  Buffer containing at least one packet starting at `offset`.
 * @param offset Byte offset into `input` where the packet starts.
 */
export function decryptTransportPacket(
  input: Buffer,
  offset: number,
  opts: TransportCryptoOptions,
): DecryptedTransportResult {
  const bf = new UcgoBlowfish(opts.blowfishKey);

  if (offset + HEADER_SIZE > input.length) {
    throw new UcgoCryptoError(
      `packet too short for header: need ${HEADER_SIZE} bytes at offset ${offset}, ` +
        `have ${input.length - offset}`,
    );
  }

  // 1. Blowfish-decrypt the header
  const headerEncrypted = input.subarray(offset, offset + HEADER_SIZE);
  const headerBf = bf.decrypt(headerEncrypted);

  // 2. Read XOR index from decrypted header bytes [4:6] (LE uint16)
  const xorIndex = headerBf[4]! | (headerBf[5]! << 8);
  const xorKey = deriveXorKey(xorIndex, opts.xorTable);

  // 3. XOR-decrypt the header
  const header = xorApply(headerBf, xorKey, HEADER_SIZE);

  // 4. Read sizes from decrypted header
  const xorSize      = header.readUInt32LE(16);
  const blowfishSize = header.readUInt32LE(20);

  if (xorSize > MAX_PACKET_BODY_SIZE || blowfishSize > MAX_PACKET_BODY_SIZE) {
    throw new UcgoCryptoError(
      `packet body size out of range: xorSize=${xorSize} blowfishSize=${blowfishSize}`,
    );
  }
  if (xorSize > blowfishSize) {
    throw new UcgoCryptoError(`xorSize (${xorSize}) > blowfishSize (${blowfishSize})`);
  }
  if (blowfishSize % 8 !== 0) {
    throw new UcgoCryptoError(`blowfishSize (${blowfishSize}) is not a multiple of 8`);
  }
  if (offset + HEADER_SIZE + blowfishSize > input.length) {
    throw new UcgoCryptoError(
      `packet truncated: need ${HEADER_SIZE + blowfishSize} bytes, ` +
        `have ${input.length - offset}`,
    );
  }

  // 5. Blowfish-decrypt the body (blowfishSize bytes)
  const bodyEncrypted = input.subarray(offset + HEADER_SIZE, offset + HEADER_SIZE + blowfishSize);
  const bodyBf = bf.decrypt(bodyEncrypted);

  // 6. XOR-decrypt body — only xorSize bytes
  const body = xorApply(bodyBf, xorKey, xorSize).subarray(0, xorSize);

  return { header, body, xorSize, blowfishSize };
}

/**
 * Encrypt a UCGO packet for transmission.
 *
 * Encrypt order: XOR → write xorIndex → Blowfish
 *
 * Generates a fresh random XOR index on every call.
 *
 * @param headerBuf  Pre-built 64-byte plaintext header (xorIndex field will be overwritten).
 * @param body       Plaintext body.
 */
export function encryptTransportPacket(
  headerBuf: Buffer,
  body: Buffer,
  opts: TransportCryptoOptions,
): Buffer {
  if (headerBuf.length !== HEADER_SIZE) {
    throw new UcgoCryptoError(
      `header must be exactly ${HEADER_SIZE} bytes, got ${headerBuf.length}`,
    );
  }

  const bf = new UcgoBlowfish(opts.blowfishKey);

  // 1. Generate random 16-bit XOR index
  const xorIndex = randomBytes(2).readUInt16LE(0);
  const xorKey   = deriveXorKey(xorIndex, opts.xorTable);

  // 2. Copy header (xorIndex must remain zero until after XOR)
  const headerPlain = Buffer.from(headerBuf);

  // 3. Compute blowfishSize = body length rounded up to 8-byte boundary
  const blowfishSize = Math.ceil(body.length / 8) * 8;

  // 4. Pad body to blowfishSize with zeros
  const bodyPadded = Buffer.alloc(blowfishSize);
  body.copy(bodyPadded);

  // 5. XOR-encrypt header and body
  const headerXored = xorApply(headerPlain, xorKey, HEADER_SIZE);
  const bodyXored   = xorApply(bodyPadded,  xorKey, body.length);

  // 6. Combine, then write XOR index after XOR (matches UCGO reference)
  const combined = Buffer.concat([headerXored, bodyXored]);
  combined.writeUInt16LE(xorIndex, 4);
  combined.writeUInt16LE(0, 6); // reserved bytes must remain 0

  // 7. Blowfish-encrypt combined buffer
  return bf.encrypt(combined);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Apply a repeating 4-byte XOR key to `length` bytes of `data`.
 * Mirrors the exact algorithm from ucgo-tools/packet-decoder/src/ucgoCrypto.ts.
 */
function xorApply(data: Buffer, key: Buffer, length: number): Buffer {
  const result = Buffer.from(data);
  const blockEnd = Math.floor(length / 4) * 4;

  for (let i = 0; i < blockEnd; i++) {
    result[i] = result[i]! ^ key[i % 4]!;
  }

  // Handle 1–3 remaining bytes (fallthrough is intentional)
  switch (length % 4) {
    // eslint-disable-next-line no-fallthrough
    case 3: result[blockEnd + 2] = result[blockEnd + 2]! ^ key[2]!;
    // eslint-disable-next-line no-fallthrough
    case 2: result[blockEnd + 1] = result[blockEnd + 1]! ^ key[1]!;
    // eslint-disable-next-line no-fallthrough
    case 1: result[blockEnd]     = result[blockEnd]!     ^ key[0]!;
  }

  return result;
}
