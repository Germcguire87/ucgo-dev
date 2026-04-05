import type { ParsedHeader, ParsedPacket, CapturePacketMeta } from "./types";

const HEADER_SIZE = 64;

function readAscii(buffer: Buffer, start: number, end: number): string {
  return buffer.subarray(start, end).toString("ascii");
}

function parseHeader(bytes: Buffer): ParsedHeader {
  if (bytes.length < HEADER_SIZE) {
    return {
      rawLength: bytes.length,
      magicHead: "",
      keyOffset: 0,
      sysMessage: 0,
      sequence: 0,
      xorSize: 0,
      blowfishSize: 0,
      opcodeCandidate: 0,
      unknownInts: [],
      magicTail: "",
      headerValid: false,
    };
  }

  const magicHead = readAscii(bytes, 0, 4);
  const keyOffset = bytes.readUInt32LE(4);
  const sysMessage = bytes.readUInt32LE(8);
  const sequence = bytes.readUInt32LE(12);
  const xorSize = bytes.readUInt32LE(16);
  const blowfishSize = bytes.readUInt32LE(20);
  const opcodeCandidate = bytes.readUInt32LE(24);

  const unknownInts: number[] = [];
  for (let offset = 28; offset < 60; offset += 4) {
    unknownInts.push(bytes.readUInt32LE(offset));
  }

  const magicTail = readAscii(bytes, 60, 64);
  const headerValid = magicHead === "head" && magicTail === "tail";

  return {
    rawLength: bytes.length,
    magicHead,
    keyOffset,
    sysMessage,
    sequence,
    xorSize,
    blowfishSize,
    opcodeCandidate,
    unknownInts,
    magicTail,
    headerValid,
  };
}

export function parsePacket(meta: CapturePacketMeta, bytes: Buffer): ParsedPacket {
  const header = parseHeader(bytes);
  const payload = bytes.subarray(HEADER_SIZE);

  const safeRelevantLength = Math.min(header.xorSize, payload.length);
  const payloadRelevant = payload.subarray(0, safeRelevantLength);
  const payloadPadding = payload.subarray(safeRelevantLength);

  return {
    meta,
    bytes,
    header,
    payload,
    payloadRelevant,
    payloadPadding,
  };
}