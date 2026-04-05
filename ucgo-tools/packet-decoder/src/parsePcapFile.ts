import type { CapturedFrame } from "./types";

const PCAP_MAGIC = 0xa1b2c3d4;
const PCAP_NS_MAGIC = 0xa1b23c4d;
const PCAPNG_MAGIC = 0x0a0d0d0a;

type Endian = "LE" | "BE";

function detectEndian(buffer: Buffer): { endian: Endian; nanosecond: boolean } {
  const le = buffer.readUInt32LE(0);
  const be = buffer.readUInt32BE(0);

  if (le === PCAP_MAGIC) {
    return { endian: "LE", nanosecond: false };
  }
  if (le === PCAP_NS_MAGIC) {
    return { endian: "LE", nanosecond: true };
  }
  if (be === PCAP_MAGIC) {
    return { endian: "BE", nanosecond: false };
  }
  if (be === PCAP_NS_MAGIC) {
    return { endian: "BE", nanosecond: true };
  }

  if (le === PCAPNG_MAGIC || be === PCAPNG_MAGIC) {
    throw new Error("pcapng is not supported yet.");
  }

  throw new Error("Unrecognized pcap file header.");
}

function readUInt32(buffer: Buffer, offset: number, endian: Endian): number {
  return endian === "LE" ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);
}

export interface PcapParseResult {
  frames: CapturedFrame[];
  linkType: number;
  nanosecond: boolean;
}

export function parsePcapFile(buffer: Buffer): PcapParseResult {
  if (buffer.length < 24) {
    throw new Error("pcap file too small.");
  }

  const { endian, nanosecond } = detectEndian(buffer);

  const linkType = readUInt32(buffer, 20, endian);

  const frames: CapturedFrame[] = [];
  let offset = 24;
  let frameNumber = 1;

  while (offset + 16 <= buffer.length) {
    const tsSec = readUInt32(buffer, offset, endian);
    const tsSub = readUInt32(buffer, offset + 4, endian);
    const inclLen = readUInt32(buffer, offset + 8, endian);
    const origLen = readUInt32(buffer, offset + 12, endian);

    const packetStart = offset + 16;
    const packetEnd = packetStart + inclLen;

    if (packetEnd > buffer.length) {
      break;
    }

    const frameBytes = buffer.subarray(packetStart, packetEnd);

    frames.push({
      meta: {
        frameNumber,
        transport: "TCP",
        direction: "unknown",
        timestamp: nanosecond
          ? `${tsSec}.${tsSub.toString().padStart(9, "0")}`
          : `${tsSec}.${tsSub.toString().padStart(6, "0")}`,
      },
      frameBytes,
      tcpPayloadLength: origLen,
    });

    frameNumber += 1;
    offset = packetEnd;
  }

  return { frames, linkType, nanosecond };
}
