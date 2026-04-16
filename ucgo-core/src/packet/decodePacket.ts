import { decryptTransportPacket, type TransportCryptoOptions } from "../crypto/transportCrypto.js";
import { parseHeader, validateHeader } from "./PacketHeader.js";
import type { PacketEnvelope } from "./PacketEnvelope.js";

export interface DecodeContext extends TransportCryptoOptions {}

/**
 * Decode a single UCGO packet from raw wire bytes.
 *
 * 1. Decrypt transport layer (Blowfish → XOR)
 * 2. Parse + validate the 64-byte header
 * 3. Return typed envelope with decrypted body
 */
export function decodeUcgoPacket(rawWireBytes: Buffer, ctx: DecodeContext): PacketEnvelope {
  const decrypted = decryptTransportPacket(rawWireBytes, 0, ctx);
  const header    = parseHeader(decrypted.header);
  validateHeader(header);

  return { header, body: decrypted.body };
}
