import type { ParsedHeader } from "./types";

const HEADER_SIZE = 64;

function readAscii(buffer: Buffer, start: number, end: number): string {
  return buffer.subarray(start, end).toString("ascii");
}

export function probeUcgoHeader(bytes: Buffer): ParsedHeader {
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