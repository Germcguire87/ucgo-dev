import { parseHexDumpLines } from "./parseHexDump";
import { isServerPort } from "./serverPorts";
import type { CapturePacketMeta, CapturedFrame, PacketDirection } from "./types";

function inferDirection(srcPort?: number, dstPort?: number): PacketDirection {
  if (srcPort === undefined || dstPort === undefined) {
    return "unknown";
  }

  if (isServerPort(dstPort)) return "clientToServer";
  if (isServerPort(srcPort)) return "serverToClient";

  return "unknown";
}

function parseIpv4Line(line: string): { srcIp?: string | undefined; dstIp?: string | undefined } {
  const match = line.match(
    /Internet Protocol Version 4,\s*Src:\s*([0-9.]+),\s*Dst:\s*([0-9.]+)/,
  );

  return {
    srcIp: match?.[1],
    dstIp: match?.[2],
  };
}

function parseTcpLine(line: string): {
  srcPort?: number | undefined;
  dstPort?: number | undefined;
  seq?: number | undefined;
  ack?: number | undefined;
  len?: number | undefined;
} {
  const srcPort = line.match(/Src Port:\s*(\d+)/)?.[1];
  const dstPort = line.match(/Dst Port:\s*(\d+)/)?.[1];
  const seq = line.match(/Seq:\s*(\d+)/)?.[1];
  const ack = line.match(/Ack:\s*(\d+)/)?.[1];
  const len = line.match(/Len:\s*(\d+)/)?.[1];

  return {
    srcPort: srcPort !== undefined ? Number(srcPort) : undefined,
    dstPort: dstPort !== undefined ? Number(dstPort) : undefined,
    seq: seq !== undefined ? Number(seq) : undefined,
    ack: ack !== undefined ? Number(ack) : undefined,
    len: len !== undefined ? Number(len) : undefined,
  };
}

export function parseCaptureText(input: string): CapturedFrame[] {
  const lines = input.split(/\r?\n/);
  const frames: CapturedFrame[] = [];

  let i = 0;
  while (i < lines.length) {
    const frameMatch = lines[i]?.match(/^Frame\s+(\d+):\s+Packet,/);
    if (!frameMatch) {
      i += 1;
      continue;
    }

    const frameNumber = Number(frameMatch[1]);

    let srcIp: string | undefined;
    let dstIp: string | undefined;
    let srcPort: number | undefined;
    let dstPort: number | undefined;
    let tcpSeq: number | undefined;
    let tcpAck: number | undefined;
    let tcpPayloadLength: number | undefined;
    let transport: string | undefined;
    const hexLines: string[] = [];

    i += 1;

    while (i < lines.length && !lines[i]?.match(/^Frame\s+\d+:\s+Packet,/)) {
      const line = lines[i] ?? "";

      if (line.startsWith("Internet Protocol Version 4,")) {
        const parsed = parseIpv4Line(line);
        srcIp = parsed.srcIp;
        dstIp = parsed.dstIp;
      } else if (line.startsWith("Transmission Control Protocol,")) {
        transport = "TCP";
        const parsed = parseTcpLine(line);
        srcPort = parsed.srcPort;
        dstPort = parsed.dstPort;
        tcpSeq = parsed.seq;
        tcpAck = parsed.ack;
        tcpPayloadLength = parsed.len;
      } else if (/^[0-9A-Fa-f]{4}\s{2}/.test(line)) {
        hexLines.push(line);
      }

      i += 1;
    }

    const direction = inferDirection(srcPort, dstPort);
    const frameBytes = parseHexDumpLines(hexLines);

    const meta: CapturePacketMeta = {
      frameNumber,
      transport,
      direction,
    };

    frames.push({
      meta,
      frameBytes,
      srcIp,
      dstIp,
      srcPort,
      dstPort,
      tcpSeq,
      tcpAck,
      tcpPayloadLength,
    });
  }

  return frames;
}
