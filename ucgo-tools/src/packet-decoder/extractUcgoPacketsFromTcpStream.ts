import { parsePacket } from "./parsePacket";
import { probeUcgoHeader } from "./probeUcgoHeader";
import { UcgoCrypto } from "./ucgoCrypto";
import type { CapturePacketMeta, ParsedHeader, ParsedPacket } from "./types";

const HEADER_SIZE = 64;
const MAX_PACKET_SIZE = 65535;
const MAX_SCAN_WINDOW = HEADER_SIZE + MAX_PACKET_SIZE;
const HEAD_MAGIC = Buffer.from("head", "ascii");
const TAIL_MAGIC = Buffer.from("tail", "ascii");

const DEFAULT_META: CapturePacketMeta = {
  frameNumber: -1,
  direction: "unknown",
  transport: "TCP",
};

function isHeaderSane(header: ParsedHeader): boolean {
  if (!header.headerValid) {
    return false;
  }

  if (header.xorSize <= 0 || header.xorSize > MAX_PACKET_SIZE) {
    return false;
  }

  if (header.blowfishSize < 0 || header.blowfishSize > MAX_PACKET_SIZE) {
    return false;
  }

  if (header.sequence < 0 || header.sequence > 0xffffffff) {
    return false;
  }

  const largeFieldThreshold = 0x00ff_ffff;
  const largeFields = [
    header.keyOffset,
    header.sysMessage,
    header.opcodeCandidate,
  ].filter((value) => value > largeFieldThreshold);

  if (
    header.keyOffset === 0xffffffff ||
    header.sysMessage === 0xffffffff ||
    header.opcodeCandidate === 0xffffffff
  ) {
    return false;
  }

  if (largeFields.length === 3) {
    return false;
  }

  return true;
}

function computePacketLength(header: ParsedHeader): number {
  const payloadSize = Math.max(header.xorSize, header.blowfishSize, 0);
  return HEADER_SIZE + payloadSize;
}

function xorWithByte(buffer: Buffer, key: number, length: number): Buffer {
  const out = Buffer.allocUnsafe(length);
  for (let i = 0; i < length; i++) {
    out[i] = buffer[i]! ^ key;
  }
  return out;
}

function xorRolling(buffer: Buffer, key: number, length: number): Buffer {
  const out = Buffer.allocUnsafe(length);
  let k = key;

  for (let i = 0; i < length; i++) {
    out[i] = buffer[i]! ^ k;
    k = (k + 1) & 0xff;
  }

  return out;
}

function xorRepeat(buffer: Buffer, key: Buffer, length: number): Buffer {
  const out = Buffer.allocUnsafe(length);
  const keyLength = key.length;
  for (let i = 0; i < length; i++) {
    out[i] = buffer[i]! ^ key[i % keyLength]!;
  }
  return out;
}

function xorRepeatStreamAligned(
  buffer: Buffer,
  offset: number,
  key: Buffer,
  length: number,
): Buffer {
  const out = Buffer.allocUnsafe(length);
  const keyLength = key.length;
  for (let i = 0; i < length; i++) {
    out[i] = buffer[offset + i]! ^ key[(offset + i) % keyLength]!;
  }
  return out;
}

function tryParseXorRepeatWithKey(
  buffer: Buffer,
  offset: number,
  key: Buffer,
): ParsedPacket | null {
  if (offset + HEADER_SIZE > buffer.length) {
    return null;
  }

  const decodedHeader = xorRepeatStreamAligned(buffer, offset, key, HEADER_SIZE);
  const header = probeUcgoHeader(decodedHeader);
  if (!header.headerValid) {
    return null;
  }

  if (!isHeaderSane(header)) {
    return null;
  }

  const totalLength = computePacketLength(header);
  if (totalLength <= 0 || offset + totalLength > buffer.length) {
    return null;
  }

  const decodedPacket = xorRepeatStreamAligned(buffer, offset, key, totalLength);
  return parsePacket(DEFAULT_META, decodedPacket);
}

function tryBuildPacket(buffer: Buffer, header: ParsedHeader): ParsedPacket | null {
  if (!isHeaderSane(header)) {
    return null;
  }

  const totalLength = computePacketLength(header);
  if (totalLength <= 0 || totalLength > buffer.length) {
    return null;
  }

  const packetBytes = buffer.subarray(0, totalLength);
  return parsePacket(DEFAULT_META, packetBytes);
}

function tryParseRaw(buffer: Buffer): ParsedPacket | null {
  const header = probeUcgoHeader(buffer);
  if (!header.headerValid) {
    return null;
  }

  return tryBuildPacket(buffer, header);
}

function tryParseXorByte(buffer: Buffer): ParsedPacket | null {
  const key = buffer[0]! ^ 0x68; // 'h'
  if ((buffer[1]! ^ key) !== 0x65) return null; // 'e'
  if ((buffer[2]! ^ key) !== 0x61) return null; // 'a'
  if ((buffer[3]! ^ key) !== 0x64) return null; // 'd'

  if ((buffer[60]! ^ key) !== 0x74) return null; // 't'
  if ((buffer[61]! ^ key) !== 0x61) return null; // 'a'
  if ((buffer[62]! ^ key) !== 0x69) return null; // 'i'
  if ((buffer[63]! ^ key) !== 0x6c) return null; // 'l'

  const decodedHeader = xorWithByte(buffer, key, HEADER_SIZE);
  const header = probeUcgoHeader(decodedHeader);
  if (!header.headerValid) {
    return null;
  }

  if (!isHeaderSane(header)) {
    return null;
  }

  const totalLength = computePacketLength(header);
  if (totalLength <= 0 || totalLength > buffer.length) {
    return null;
  }

  const decodedPacket = xorWithByte(buffer, key, totalLength);
  return parsePacket(DEFAULT_META, decodedPacket);
}

function tryParseXorRolling(buffer: Buffer): ParsedPacket | null {
  const baseKey = buffer[0]! ^ 0x68; // 'h'
  if ((buffer[1]! ^ ((baseKey + 1) & 0xff)) !== 0x65) return null; // 'e'
  if ((buffer[2]! ^ ((baseKey + 2) & 0xff)) !== 0x61) return null; // 'a'
  if ((buffer[3]! ^ ((baseKey + 3) & 0xff)) !== 0x64) return null; // 'd'

  if ((buffer[60]! ^ ((baseKey + 60) & 0xff)) !== 0x74) return null; // 't'
  if ((buffer[61]! ^ ((baseKey + 61) & 0xff)) !== 0x61) return null; // 'a'
  if ((buffer[62]! ^ ((baseKey + 62) & 0xff)) !== 0x69) return null; // 'i'
  if ((buffer[63]! ^ ((baseKey + 63) & 0xff)) !== 0x6c) return null; // 'l'

  const decodedHeader = xorRolling(buffer, baseKey, HEADER_SIZE);
  const header = probeUcgoHeader(decodedHeader);
  if (!header.headerValid) {
    return null;
  }

  if (!isHeaderSane(header)) {
    return null;
  }

  const totalLength = computePacketLength(header);
  if (totalLength <= 0 || totalLength > buffer.length) {
    return null;
  }

  const decodedPacket = xorRolling(buffer, baseKey, totalLength);
  return parsePacket(DEFAULT_META, decodedPacket);
}

function tryParseXorRepeat(buffer: Buffer, keyLength: number): ParsedPacket | null {
  if (keyLength <= 0 || keyLength > HEAD_MAGIC.length) {
    return null;
  }

  const key = Buffer.allocUnsafe(keyLength);
  for (let i = 0; i < keyLength; i++) {
    key[i] = buffer[i]! ^ HEAD_MAGIC[i]!;
  }

  for (let i = 0; i < HEAD_MAGIC.length; i++) {
    if ((buffer[i]! ^ key[i % keyLength]!) !== HEAD_MAGIC[i]!) {
      return null;
    }
  }

  for (let i = 0; i < TAIL_MAGIC.length; i++) {
    const pos = 60 + i;
    if ((buffer[pos]! ^ key[pos % keyLength]!) !== TAIL_MAGIC[i]!) {
      return null;
    }
  }

  const decodedHeader = xorRepeat(buffer, key, HEADER_SIZE);
  const header = probeUcgoHeader(decodedHeader);
  if (!header.headerValid) {
    return null;
  }

  if (!isHeaderSane(header)) {
    return null;
  }

  const totalLength = computePacketLength(header);
  if (totalLength <= 0 || totalLength > buffer.length) {
    return null;
  }

  const decodedPacket = xorRepeat(buffer, key, totalLength);
  return parsePacket(DEFAULT_META, decodedPacket);
}

function deriveStreamAlignedRepeatKey(
  buffer: Buffer,
  offset: number,
  keyLength: number,
): Buffer | null {
  const key = new Array<number>(keyLength).fill(-1);

  for (let i = 0; i < HEAD_MAGIC.length; i++) {
    const idx = (offset + i) % keyLength;
    const value = buffer[offset + i]! ^ HEAD_MAGIC[i]!;
    if (key[idx] !== -1 && key[idx] !== value) {
      return null;
    }
    key[idx] = value;
  }

  for (let i = 0; i < TAIL_MAGIC.length; i++) {
    const pos = offset + 60 + i;
    const idx = pos % keyLength;
    const value = buffer[pos]! ^ TAIL_MAGIC[i]!;
    if (key[idx] !== -1 && key[idx] !== value) {
      return null;
    }
    key[idx] = value;
  }

  if (key.some((value) => value === -1)) {
    return null;
  }

  return Buffer.from(key.map((value) => value & 0xff));
}

function tryParseXorRepeatStreamAligned(
  buffer: Buffer,
  offset: number,
  keyLength: number,
): ParsedPacket | null {
  if (offset + HEADER_SIZE > buffer.length) {
    return null;
  }

  const key = deriveStreamAlignedRepeatKey(buffer, offset, keyLength);
  if (!key) {
    return null;
  }

  const decodedHeader = xorRepeatStreamAligned(buffer, offset, key, HEADER_SIZE);
  const header = probeUcgoHeader(decodedHeader);
  if (!header.headerValid) {
    return null;
  }

  if (!isHeaderSane(header)) {
    return null;
  }

  const totalLength = computePacketLength(header);
  if (totalLength <= 0 || offset + totalLength > buffer.length) {
    return null;
  }

  const decodedPacket = xorRepeatStreamAligned(buffer, offset, key, totalLength);
  return parsePacket(DEFAULT_META, decodedPacket);
}

function tryParseEncryptedPacket(
  buffer: Buffer,
  offset: number,
  crypto: UcgoCrypto,
): ParsedPacket | null {
  const decrypted = crypto.decryptPacketAtOffset(buffer, offset);
  if (!decrypted) {
    return null;
  }

  const headerProbe = probeUcgoHeader(decrypted.header);
  if (!isHeaderSane(headerProbe)) {
    return null;
  }

  const packetBytes = Buffer.concat([decrypted.header, decrypted.body]);
  const parsed = parsePacket(DEFAULT_META, packetBytes);

  return {
    ...parsed,
    meta: {
      ...parsed.meta,
      streamConsumed: HEADER_SIZE + decrypted.blowfishSize,
    },
  };
}

function scanBufferForPackets(
  buffer: Buffer,
  parser: (window: Buffer, offset: number, full: Buffer) => ParsedPacket | null,
): ParsedPacket[] {
  const packets: ParsedPacket[] = [];

  let offset = 0;
  while (offset + HEADER_SIZE <= buffer.length) {
    const remaining = buffer.length - offset;
    const windowSize = Math.min(remaining, MAX_SCAN_WINDOW);
    const window = buffer.subarray(offset, offset + windowSize);

    const parsed = parser(window, offset, buffer);
    if (parsed) {
      packets.push({
        ...parsed,
        meta: {
          ...parsed.meta,
          streamOffset: offset,
        },
      });

      const advance = Math.max(parsed.meta.streamConsumed ?? parsed.bytes.length, 1);
      offset += advance;
      continue;
    }

    offset += 1;
  }

  return packets;
}

function extractWithStreamXorTransforms(buffer: Buffer): ParsedPacket[] {
  let bestPackets: ParsedPacket[] = [];

  for (let key = 0; key < 256; key++) {
    const decoded = xorWithByte(buffer, key, buffer.length);
    if (decoded.indexOf(HEAD_MAGIC) === -1) {
      continue;
    }

    const packets = scanBufferForPackets(decoded, (window) => tryParseRaw(window));
    if (packets.length > bestPackets.length) {
      bestPackets = packets;
    }
  }

  for (let key = 0; key < 256; key++) {
    const decoded = xorRolling(buffer, key, buffer.length);
    if (decoded.indexOf(HEAD_MAGIC) === -1) {
      continue;
    }

    const packets = scanBufferForPackets(decoded, (window) => tryParseRaw(window));
    if (packets.length > bestPackets.length) {
      bestPackets = packets;
    }
  }

  return bestPackets;
}

export function extractUcgoPacketsFromTcpStream(
  buffer: Buffer,
  options?: { xorKey?: Buffer; crypto?: UcgoCrypto; legacyXor?: boolean },
): ParsedPacket[] {
  const directPackets = scanBufferForPackets(buffer, (window, offset, full) =>
    (options?.crypto ? tryParseEncryptedPacket(full, offset, options.crypto) : null) ??
    (options?.xorKey ? tryParseXorRepeatWithKey(full, offset, options.xorKey) : null) ??
    tryParseRaw(window) ??
    (options?.legacyXor
      ? tryParseXorByte(window) ??
        tryParseXorRolling(window) ??
        tryParseXorRepeat(window, 2) ??
        tryParseXorRepeat(window, 4) ??
        tryParseXorRepeatStreamAligned(full, offset, 2) ??
        tryParseXorRepeatStreamAligned(full, offset, 3) ??
        tryParseXorRepeatStreamAligned(full, offset, 4)
      : null),
  );
  if (directPackets.length > 0) {
    return directPackets;
  }

  if (options?.legacyXor) {
    return extractWithStreamXorTransforms(buffer);
  }

  return [];
}
