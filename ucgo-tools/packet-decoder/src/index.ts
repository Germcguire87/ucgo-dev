import * as fs from "node:fs";
import * as path from "node:path";
import { parseCaptureText } from "./parseCaptureText";
import { parsePcapFile } from "./parsePcapFile";
import { extractTcpSegmentFromFrame } from "./extractTcpSegmentFromFrame";
import { groupTcpSegmentsByStream, reassembleTcpStream } from "./reassembleTcpStream";
import { extractUcgoPacketsFromTcpStream } from "./extractUcgoPacketsFromTcpStream";
import { UcgoCrypto } from "./ucgoCrypto";
import { buildPacketJsonRecord, formatDirectionLabel, formatPacketHexDump } from "./formatPacketHexDump";
import type { CapturedFrame, ParsedPacket, TcpSegment } from "./types";
import { getServerNameForConnection } from "./serverPorts";

function hex32(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(8, "0")}`;
}

function previewHex(bytes: Buffer, count = 32): string {
  return bytes.subarray(0, count).toString("hex");
}

function summarizePacket(packet: ParsedPacket, directionLabel?: string): string {
  const header = packet.header;
  const offset = packet.meta.streamOffset ?? -1;
  const directionLine = directionLabel ?? packet.meta.direction;

  return [
    `Offset: ${offset}`,
    `  Direction: ${directionLine}`,
    `  Header valid: ${header.headerValid}`,
    `  Head/Tail: ${header.magicHead} / ${header.magicTail}`,
    `  KeyOffset: ${hex32(header.keyOffset)}`,
    `  SysMessage: ${hex32(header.sysMessage)}`,
    `  Sequence: ${header.sequence}`,
    `  XORSize: ${header.xorSize}`,
    `  BlowfishSize: ${header.blowfishSize}`,
    `  Opcode?: ${hex32(header.opcodeCandidate)}`,
    `  Total length: ${packet.bytes.length}`,
    `  First 32 bytes: ${previewHex(packet.bytes, 32)}`,
  ].join("\n");
}

interface DecodeOptions {
  xorKeyArg?: string | undefined;
  crypto?: UcgoCrypto | undefined;
  legacyXor: boolean;
  dumpFilePath?: string | undefined;
  jsonFilePath?: string | undefined;
}

interface DecodeResult {
  totalPackets: number;
  dumpFilePath?: string | undefined;
  jsonFilePath?: string | undefined;
}

function decodeCapture(absolutePath: string, options: DecodeOptions): DecodeResult {
  const ext = path.extname(absolutePath).toLowerCase();

  let frames: CapturedFrame[];
  let xorKey: Buffer | undefined;

  try {
    if (ext === ".pcap") {
      const buffer = fs.readFileSync(absolutePath);
      const parsed = parsePcapFile(buffer);
      frames = parsed.frames;
      console.log(`PCAP link type: ${parsed.linkType}`);
    } else {
      const input = fs.readFileSync(absolutePath, "utf8");
      const keyMatch = input.match(/^\s*Key:\s*(\S+)/m);
      xorKey = keyMatch ? Buffer.from(keyMatch[1], "ascii") : undefined;
      if (xorKey) {
        console.log(`Using XOR key from capture: ${keyMatch?.[1]}`);
      }
      frames = parseCaptureText(input);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse capture "${absolutePath}": ${message}`);
  }

  if (options.xorKeyArg) {
    xorKey = Buffer.from(options.xorKeyArg, "ascii");
    console.log(`Using XOR key from CLI: ${options.xorKeyArg}`);
  }

  console.log(`Frames parsed: ${frames.length}`);

  const segments = frames
    .map(extractTcpSegmentFromFrame)
    .filter((segment): segment is TcpSegment => segment !== null);

  console.log(`TCP segments parsed: ${segments.length}`);

  const payloadSegments = segments.filter((segment) => segment.payload.length > 0);
  console.log(`TCP segments with payload: ${payloadSegments.length}`);

  const byStream = groupTcpSegmentsByStream(payloadSegments);
  console.log(`Directional streams: ${byStream.size}`);
  console.log("");

  let totalPackets = 0;
  let packetNumber = 0;
  const packetDumps: string[] = [];
  const packetJson: ReturnType<typeof buildPacketJsonRecord>[] = [];
  const wantsExport = Boolean(options.dumpFilePath || options.jsonFilePath);

  for (const [streamKey, streamSegments] of byStream) {
    const reassembled = reassembleTcpStream(streamKey, streamSegments);
    const serverName = getServerNameForConnection(
      streamSegments[0]?.srcPort,
      streamSegments[0]?.dstPort,
    );
    const packets = extractUcgoPacketsFromTcpStream(reassembled.data, {
      xorKey,
      crypto: options.crypto,
      legacyXor: options.legacyXor,
    }).map((packet) => ({
      ...packet,
      meta: {
        ...packet.meta,
        direction: streamSegments[0]?.meta.direction ?? "unknown",
        transport: "TCP",
      },
    }));

    totalPackets += packets.length;

    const firstHeadOffset = reassembled.data.indexOf(Buffer.from("head", "ascii"));
    const firstTailOffset = reassembled.data.indexOf(Buffer.from("tail", "ascii"));

    console.log(`Stream: ${streamKey}`);
    console.log(`  Segments: ${streamSegments.length}`);
    console.log(`  Reassembled bytes: ${reassembled.data.length}`);
    console.log(`  First "head" offset: ${firstHeadOffset}`);
    console.log(`  First "tail" offset: ${firstTailOffset}`);
    console.log(`  Parsed packets: ${packets.length}`);
    console.log("");

    for (const packet of packets) {
      const directionLabel = formatDirectionLabel(packet.meta.direction, serverName);
      console.log(summarizePacket(packet, directionLabel));
      console.log("");

      if (wantsExport) {
        packetNumber += 1;

        const connection = `${streamKey.replace("->", " -> ")} [TCP]`;
        const streamTimestamp =
          streamSegments.find((segment) => segment.meta.timestamp)?.meta.timestamp;

        const context = {
          packetNumber,
          timestamp: streamTimestamp,
          connection,
          direction: packet.meta.direction,
          serverName,
          streamOffset: packet.meta.streamOffset,
        };

        if (options.dumpFilePath) {
          packetDumps.push(formatPacketHexDump(packet, context));
        }

        if (options.jsonFilePath) {
          packetJson.push(buildPacketJsonRecord(packet, context));
        }
      }
    }
  }

  if (options.dumpFilePath) {
    const resolvedDump = path.resolve(options.dumpFilePath);
    fs.writeFileSync(resolvedDump, packetDumps.join("\n\n"), "utf8");
    console.log(`Packet dump written: ${resolvedDump}`);
  }

  if (options.jsonFilePath) {
    const resolvedJson = path.resolve(options.jsonFilePath);
    fs.writeFileSync(resolvedJson, JSON.stringify(packetJson, null, 2), "utf8");
    console.log(`Packet JSON written: ${resolvedJson}`);
  }

  if (totalPackets === 0) {
    console.error("No UCGO packets found.");
  }

  return {
    totalPackets,
    dumpFilePath: options.dumpFilePath,
    jsonFilePath: options.jsonFilePath,
  };
}

function listParseTargets(targetDir: string): string[] {
  if (!fs.existsSync(targetDir)) {
    return [];
  }

  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(targetDir, entry.name))
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".txt" || ext === ".pcap";
    })
    .sort((a, b) => a.localeCompare(b));
}

function main(): void {
  const args = process.argv.slice(2);
  let filePath: string | undefined;

  let xorKeyArg: string | undefined;
  let xorTablePath: string | undefined;
  let bfKey = "QQzXzQnpzTpnXz" ; // This password should be used when parsing captures from UCGOHost server.
  // let bfKey = "chrTCPPassword" ; This password should be used when parsing captures from the titans server.
  let legacyXor = false;
  let dumpFilePath: string | undefined;
  let jsonFilePath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg === "--xorKey" && i + 1 < args.length) {
      xorKeyArg = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === "--xorTable" && i + 1 < args.length) {
      xorTablePath = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === "--bfKey" && i + 1 < args.length) {
      bfKey = args[i + 1] ?? bfKey;
      i += 1;
      continue;
    }

    if (arg === "--legacyXor") {
      legacyXor = true;
      continue;
    }

    if (arg === "--dumpFile" && i + 1 < args.length) {
      dumpFilePath = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === "--jsonFile" && i + 1 < args.length) {
      jsonFilePath = args[i + 1];
      i += 1;
      continue;
    }

    if (!arg.startsWith("--")) {
      if (!filePath) {
        filePath = arg;
      } else if (xorKeyArg === undefined) {
        xorKeyArg = arg;
      }
    }
  }

  let ucgoCrypto: UcgoCrypto | undefined;

  if (!xorTablePath) {
    const localCandidates = [
      path.resolve("data", "xortable.dat"),
      path.resolve("data", "XORTable.dat"),
      path.resolve("xortable.dat"),
      path.resolve("XORTable.dat"),
      path.resolve("XORTABLE.dat"),
    ];
    for (const candidatePath of localCandidates) {
      if (fs.existsSync(candidatePath)) {
        xorTablePath = candidatePath;
        break;
      }
    }
  }

  if (xorTablePath) {
    const resolvedTable = path.resolve(xorTablePath);
    try {
      const table = fs.readFileSync(resolvedTable);
      if (table.length !== 131072) {
        console.error(
          `Invalid XOR table size (${table.length}). Expected 131072 bytes; crypto disabled.`,
        );
      } else {
        ucgoCrypto = new UcgoCrypto({
          xorTable: table,
          blowfishKey: Buffer.from(bfKey, "ascii"),
        });
        console.log(`Using XOR table: ${resolvedTable}`);
        console.log(`Using Blowfish key: ${bfKey}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to load XOR table: ${message}`);
    }
  } else {
    console.log("No XOR table provided; encrypted packets will not be decrypted.");
  }

  const batchMode = !filePath;
  const parseTargetDir = path.resolve("parse-target");
  const parsedOutputDir = path.resolve("parsed-output");
  let targets: string[] = [];

  if (batchMode) {
    targets = listParseTargets(parseTargetDir);
    if (targets.length === 0) {
      console.error(
        "No captures found. Add .txt or .pcap files to parse-target or pass a capture path.",
      );
      console.error(
        "Usage: npm run decode:packet -- <capture.txt|capture.pcap> [--xorKey key] [--xorTable path] [--bfKey key] [--legacyXor] [--dumpFile path] [--jsonFile path]",
      );
      process.exit(1);
    }
    fs.mkdirSync(parsedOutputDir, { recursive: true });
  } else {
    targets = [path.resolve(filePath!)];
  }

  let totalPackets = 0;
  let processedFiles = 0;
  let failedFiles = 0;

  for (const targetPath of targets) {
    if (batchMode) {
      console.log(`Capture: ${targetPath}`);
    }

    const baseName = path.parse(targetPath).name;
    const perFileDump = batchMode ? path.join(parsedOutputDir, `${baseName}.txt`) : dumpFilePath;
    const perFileJson = batchMode ? undefined : jsonFilePath;

    try {
      const result = decodeCapture(targetPath, {
        xorKeyArg,
        crypto: ucgoCrypto,
        legacyXor,
        dumpFilePath: perFileDump,
        jsonFilePath: perFileJson,
      });
      totalPackets += result.totalPackets;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      failedFiles += 1;
    }

    processedFiles += 1;
    if (batchMode) {
      console.log("");
    }
  }

  if (failedFiles > 0) {
    console.error(`Failed captures: ${failedFiles}/${processedFiles}`);
  }

  if (totalPackets === 0) {
    process.exit(2);
  }
}

main();
