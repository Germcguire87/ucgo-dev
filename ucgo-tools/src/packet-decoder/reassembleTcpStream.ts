import type { ReassembledTcpStream, TcpSegment } from "./types";

export function makeDirectionalStreamKey(segment: TcpSegment): string {
  return `${segment.srcIp}:${segment.srcPort}->${segment.dstIp}:${segment.dstPort}`;
}

export function groupTcpSegmentsByStream(
  segments: TcpSegment[],
): Map<string, TcpSegment[]> {
  const map = new Map<string, TcpSegment[]>();

  for (const segment of segments) {
    const key = makeDirectionalStreamKey(segment);
    const existing = map.get(key) ?? [];
    existing.push(segment);
    map.set(key, existing);
  }

  return map;
}

/**
 * Simple first-pass TCP reassembly:
 * - sorts by sequence
 * - skips exact duplicate starting sequence numbers
 * - trims overlapping retransmits
 */
export function reassembleTcpStream(
  streamKey: string,
  segments: TcpSegment[],
): ReassembledTcpStream {
  const ordered = [...segments].sort((a, b) => a.sequence - b.sequence);

  const payloads: Buffer[] = [];
  let nextSequence: number | undefined;

  for (const segment of ordered) {
    if (segment.payload.length === 0) {
      continue;
    }

    if (nextSequence === undefined) {
      payloads.push(segment.payload);
      nextSequence = segment.sequence + segment.payload.length;
      continue;
    }

    const segStart = segment.sequence;
    const segEnd = segment.sequence + segment.payload.length;

    if (segEnd <= nextSequence) {
      continue; // fully duplicated / retransmitted
    }

    if (segStart < nextSequence) {
      const overlap = nextSequence - segStart;
      payloads.push(segment.payload.subarray(overlap));
      nextSequence = segEnd;
      continue;
    }

    // Gap: append what we have anyway.
    payloads.push(segment.payload);
    nextSequence = segEnd;
  }

  return {
    streamKey,
    segments: ordered,
    data: Buffer.concat(payloads),
  };
}