/**
 * Accumulates raw TCP byte chunks and extracts complete UCGO packets.
 *
 * TCP is a stream protocol — a single data event can contain a partial
 * packet, exactly one packet, or multiple packets concatenated. This
 * assembler buffers bytes until a full encrypted packet is available,
 * then decodes and yields it.
 *
 * Strategy:
 *   1. Buffer incoming chunks.
 *   2. Once we have >= 64 bytes, decrypt the header to peek at blowfishSize.
 *   3. Wait until we have 64 + blowfishSize bytes.
 *   4. Slice and decode that packet; leave the remainder buffered.
 *   5. Repeat.
 */

import {
  UcgoBlowfish,
  deriveXorKey,
  decodeUcgoPacket,
  HEADER_SIZE,
  type TransportCryptoOptions,
  type PacketEnvelope,
} from "ucgo-core";

export class PacketStreamAssembler {
  private buffer: Buffer = Buffer.alloc(0);
  /** Cached blowfishSize for the packet currently at the front of the buffer. */
  private expectedBodySize: number | null = null;

  constructor(private readonly opts: TransportCryptoOptions) {}

  /**
   * Feed a raw TCP data chunk. Returns zero or more fully decoded packets.
   * Throws on unrecoverable crypto errors — caller should destroy the socket.
   */
  feed(chunk: Buffer): PacketEnvelope[] {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const packets: PacketEnvelope[] = [];

    while (true) {
      // Not enough for a header yet — wait for more data
      if (this.buffer.length < HEADER_SIZE) break;

      // Peek blowfishSize if we haven't yet for this packet
      if (this.expectedBodySize === null) {
        this.expectedBodySize = this.peekBlowfishSize();
      }

      const needed = HEADER_SIZE + this.expectedBodySize;
      if (this.buffer.length < needed) break;

      // Slice exactly one packet and advance the buffer
      const packetBuf       = this.buffer.subarray(0, needed);
      this.buffer           = this.buffer.subarray(needed);
      this.expectedBodySize = null;

      packets.push(decodeUcgoPacket(packetBuf, this.opts));
    }

    return packets;
  }

  /**
   * Decrypt just the first 64 header bytes to read blowfishSize
   * (LE uint32 at plaintext offset 20).
   *
   * Mirrors the first half of decryptTransportPacket without requiring
   * the body bytes to already be present.
   *
   * Must only be called when this.buffer.length >= HEADER_SIZE.
   */
  private peekBlowfishSize(): number {
    const bf       = new UcgoBlowfish(this.opts.blowfishKey);
    const headerBf = bf.decrypt(this.buffer.subarray(0, HEADER_SIZE));

    const xorIndex = headerBf[4]! | (headerBf[5]! << 8);
    const xorKey   = deriveXorKey(xorIndex, this.opts.xorTable);

    // XOR-decrypt the header (HEADER_SIZE = 64, a multiple of 4 — no tail bytes)
    const plain = Buffer.from(headerBf);
    for (let i = 0; i < HEADER_SIZE; i++) {
      plain[i] = plain[i]! ^ xorKey[i % 4]!;
    }

    return plain.readUInt32LE(20); // blowfishSize field
  }
}
