/**
 * Slide a window across a raw TCP stream buffer and extract UCGO packets
 * using ucgo-core's full crypto pipeline (Blowfish → XOR).
 *
 * This is the core of the test harness: it proves that ucgo-core can decrypt
 * and parse real wire bytes from captured sessions.
 */

import {
  decryptTransportPacket,
  parseHeader,
  validateHeader,
  type TransportCryptoOptions,
  type PacketEnvelope,
} from "ucgo-core";

export interface ScannedPacket {
  envelope: PacketEnvelope;
  /** Byte offset within the reassembled TCP stream where this packet starts. */
  streamOffset: number;
  /** Bytes consumed from the stream (header + blowfishSize padding). */
  bytesConsumed: number;
}

/**
 * Scan a reassembled TCP stream for UCGO packets.
 * Uses a one-byte-at-a-time sliding window — any offset where decryption
 * succeeds AND the header is valid is treated as a packet start.
 */
export function scanStreamForPackets(
  streamData: Buffer,
  opts: TransportCryptoOptions,
): ScannedPacket[] {
  const HEADER_SIZE = 64;
  const results: ScannedPacket[] = [];
  let offset = 0;

  while (offset + HEADER_SIZE <= streamData.length) {
    try {
      const decrypted = decryptTransportPacket(streamData, offset, opts);
      const header    = parseHeader(decrypted.header);
      validateHeader(header);

      const envelope: PacketEnvelope = { header, body: decrypted.body };
      const bytesConsumed = HEADER_SIZE + decrypted.blowfishSize;

      results.push({ envelope, streamOffset: offset, bytesConsumed });
      offset += bytesConsumed;
    } catch {
      offset += 1;
    }
  }

  return results;
}
