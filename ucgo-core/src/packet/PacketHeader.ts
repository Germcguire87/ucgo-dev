import { BinaryReader } from "../binary/BinaryReader.js";
import { BinaryWriter } from "../binary/BinaryWriter.js";
import { HEADER_SIZE, MAGIC_HEAD, MAGIC_TAIL, MAX_PACKET_BODY_SIZE } from "../protocol/headerConstants.js";
import { UcgoDecodeError } from "../utils/errors.js";

export interface PacketHeader {
  /** uint16 LE @ 0x04 — index into xortable.dat */
  xorIndex: number;
  /** uint32 LE @ 0x08 — always 0x00000000 observed */
  sysMessage: number;
  /** uint32 LE @ 0x0C — 1-indexed per session */
  sequence: number;
  /** uint32 LE @ 0x10 — bytes of body covered by XOR */
  xorSize: number;
  /** uint32 LE @ 0x14 — xorSize rounded up to 8-byte boundary */
  blowfishSize: number;
  /** uint32 LE @ 0x18 */
  opcode: number;
}

export function parseHeader(buf: Buffer): PacketHeader {
  if (buf.length < HEADER_SIZE) {
    throw new UcgoDecodeError(`header too short: ${buf.length} bytes (need ${HEADER_SIZE})`);
  }

  const r = new BinaryReader(buf);
  const magicHead    = r.readAscii(4);       // 0x00
  const xorIndex     = r.readUInt16LE();     // 0x04
  r.skip(2);                                  // 0x06 reserved
  const sysMessage   = r.readUInt32LE();     // 0x08
  const sequence     = r.readUInt32LE();     // 0x0C
  const xorSize      = r.readUInt32LE();     // 0x10
  const blowfishSize = r.readUInt32LE();     // 0x14
  const opcode       = r.readUInt32LE();     // 0x18
  r.skip(32);                                 // 0x1C–0x3B padding
  const magicTail    = r.readAscii(4);       // 0x3C

  if (magicHead !== MAGIC_HEAD) {
    throw new UcgoDecodeError(`invalid magic head: "${magicHead}"`);
  }
  if (magicTail !== MAGIC_TAIL) {
    throw new UcgoDecodeError(`invalid magic tail: "${magicTail}"`);
  }

  return { xorIndex, sysMessage, sequence, xorSize, blowfishSize, opcode };
}

export function writeHeader(header: PacketHeader): Buffer {
  const w = new BinaryWriter();
  w.writeAscii(MAGIC_HEAD);          // 0x00  4 bytes
  w.writeUInt16LE(header.xorIndex);  // 0x04  2 bytes
  w.writePadding(2);                  // 0x06  2 bytes reserved
  w.writeUInt32LE(header.sysMessage);// 0x08  4 bytes
  w.writeUInt32LE(header.sequence);  // 0x0C  4 bytes
  w.writeUInt32LE(header.xorSize);   // 0x10  4 bytes
  w.writeUInt32LE(header.blowfishSize); // 0x14  4 bytes
  w.writeUInt32LE(header.opcode);    // 0x18  4 bytes
  w.writePadding(32);                 // 0x1C  32 bytes
  w.writeAscii(MAGIC_TAIL);          // 0x3C  4 bytes
  // total: 64 bytes
  return w.toBuffer();
}

export function validateHeader(header: PacketHeader): void {
  if (header.blowfishSize % 8 !== 0) {
    throw new UcgoDecodeError(
      `blowfishSize must be a multiple of 8, got ${header.blowfishSize}`,
    );
  }
  if (header.xorSize > header.blowfishSize) {
    throw new UcgoDecodeError(
      `xorSize (${header.xorSize}) exceeds blowfishSize (${header.blowfishSize})`,
    );
  }
  if (header.blowfishSize > MAX_PACKET_BODY_SIZE) {
    throw new UcgoDecodeError(
      `blowfishSize (${header.blowfishSize}) exceeds max (${MAX_PACKET_BODY_SIZE})`,
    );
  }
}
