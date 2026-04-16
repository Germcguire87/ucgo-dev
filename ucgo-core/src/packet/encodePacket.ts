import { encryptTransportPacket, type TransportCryptoOptions } from "../crypto/transportCrypto.js";
import { writeHeader } from "./PacketHeader.js";
import type { PacketEnvelope } from "./PacketEnvelope.js";

export interface EncodeContext extends TransportCryptoOptions {}

/**
 * Encode a typed UCGO packet to raw wire bytes.
 *
 * The envelope's header must already have opcode, sequence, xorSize, and
 * blowfishSize populated by the caller. encryptTransportPacket will overwrite
 * xorIndex with a fresh random value on every call.
 *
 * 1. Serialise the 64-byte header
 * 2. Encrypt transport layer (XOR → Blowfish)
 */
export function encodeUcgoPacket(envelope: PacketEnvelope, ctx: EncodeContext): Buffer {
  // Compute sizes from the body — enforce them in the header
  const xorSize      = envelope.body.length;
  const blowfishSize = Math.ceil(xorSize / 8) * 8;

  const header = {
    ...envelope.header,
    xorSize,
    blowfishSize,
    // xorIndex is a placeholder; encryptTransportPacket overwrites it with random
    xorIndex: 0,
  };

  const headerBuf = writeHeader(header);
  return encryptTransportPacket(headerBuf, envelope.body, ctx);
}
