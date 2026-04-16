/**
 * Run a single PCAP or Wireshark-text capture through the full ucgo-core pipeline.
 *
 * Pipeline:
 *   1. Parse PCAP → CapturedFrame[]
 *   2. Extract TCP segments
 *   3. Group by directional stream and reassemble
 *   4. Slide ucgo-core's decryptTransportPacket over each stream byte-by-byte
 *   5. Decode each found packet's body into typed models
 *   6. Print everything
 */

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { loadXorTable, type TransportCryptoOptions } from "ucgo-core";

// Packet-decoder imports — relative from test-harness to packet-decoder/src/
import { parsePcapFile }                    from "../../packet-decoder/src/parsePcapFile.js";
import { extractTcpSegmentFromFrame }       from "../../packet-decoder/src/extractTcpSegmentFromFrame.js";
import { groupTcpSegmentsByStream, reassembleTcpStream } from "../../packet-decoder/src/reassembleTcpStream.js";
import type { TcpSegment }                  from "../../packet-decoder/src/types.js";

import { scanStreamForPackets }   from "./scanStream.js";
import { decodeAndPrint, opcodeName } from "./decodeModel.js";
import {
  printPacketBanner, printHeaderFields, printBodyHex,
  printSectionHeader, printRule, c,
} from "./print.js";

// ── Blowfish keys ─────────────────────────────────────────────────────────────
export const BF_KEY_UCGOHOST = "QQzXzQnpzTpnXz";
export const BF_KEY_ORIGINAL = "chrTCPPassword";

// ── XOR table path (relative to this file's directory at runtime) ─────────────
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const XOR_TABLE_PATH = resolve(
  __dirname,
  "../../packet-decoder/data/xortable.dat",
);

// ── Stream direction ──────────────────────────────────────────────────────────

const LOGIN_SERVER_PORT = 24018;
const INFO_SERVER_PORT  = 24012;

function streamDirection(streamKey: string): string {
  // streamKey is "srcIp:srcPort->dstIp:dstPort"
  const m = streamKey.match(/:(\d+)->.*:(\d+)$/);
  if (!m) return "?→?";
  const srcPort = parseInt(m[1]!);
  const dstPort = parseInt(m[2]!);
  if (dstPort === LOGIN_SERVER_PORT || dstPort === INFO_SERVER_PORT) return "Client→Server";
  if (srcPort === LOGIN_SERVER_PORT || srcPort === INFO_SERVER_PORT) return "Server→Client";
  return "?→?";
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function runCapture(
  filePath: string,
  blowfishKey = BF_KEY_UCGOHOST,
  verbose = false,
): Promise<void> {
  console.log();
  console.log(c.BOLD + `Capture: ${basename(filePath)}` + c.RESET);
  console.log(`  Blowfish key: ${c.YELLOW}${blowfishKey}${c.RESET}`);
  printRule("─");

  // 1. Load XOR table
  const xorTable = await loadXorTable(XOR_TABLE_PATH);

  const opts: TransportCryptoOptions = {
    xorTable,
    blowfishKey,
  };

  // 2. Parse PCAP
  const raw = readFileSync(filePath);
  const { frames } = parsePcapFile(raw);
  console.log(`  Frames:       ${frames.length}`);

  // 3. TCP segments
  const segments = frames
    .map(extractTcpSegmentFromFrame)
    .filter((s): s is TcpSegment => s !== null)
    .filter(s => s.payload.length > 0);
  console.log(`  Segments:     ${segments.length} (with payload)`);

  // 4. Group + reassemble streams
  const byStream = groupTcpSegmentsByStream(segments);
  console.log(`  Streams:      ${byStream.size}`);

  let totalPackets = 0;
  let packetNumber = 0;

  for (const [streamKey, streamSegments] of byStream) {
    const { data } = reassembleTcpStream(streamKey, streamSegments);
    const direction = streamDirection(streamKey);
    const packets   = scanStreamForPackets(data, opts);

    if (packets.length === 0) continue;

    totalPackets += packets.length;

    printSectionHeader(`${direction}  [${streamKey}]  ${packets.length} packet(s)`);

    for (const { envelope, streamOffset } of packets) {
      packetNumber += 1;
      const name = opcodeName(envelope.header.opcode);

      printPacketBanner(packetNumber, direction, name, streamOffset);

      // Header fields
      console.log();
      console.log(`  ${c.DIM}── Header ─────────────────────────────────────────${c.RESET}`);
      printHeaderFields(envelope);

      // Body
      console.log();
      console.log(`  ${c.DIM}── Body (${envelope.body.length} bytes) ─────────────────────────────────${c.RESET}`);

      if (verbose) {
        printBodyHex(envelope.body);
        console.log();
      }

      // Decoded model
      console.log(`  ${c.DIM}── Decoded model ────────────────────────────────────${c.RESET}`);
      decodeAndPrint(envelope);
    }
  }

  console.log();
  printRule("═");
  console.log(c.BOLD + `Total packets decoded: ${totalPackets}` + c.RESET);
  printRule("═");
}
