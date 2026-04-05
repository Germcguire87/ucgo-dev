import type { UcgoServerName } from "./serverPorts";
import type { PacketDirection, ParsedPacket } from "./types";

export interface PacketDumpContext {
  packetNumber: number;
  timestamp?: string;
  connection: string;
  direction: PacketDirection;
  serverName?: UcgoServerName | null;
  streamOffset?: number;
}

export interface PacketJsonRecord {
  packetNumber: number;
  timestamp: string | null;
  connection: string;
  direction: PacketDirection;
  directionLabel?: string;
  serverName?: UcgoServerName | null;
  streamOffset: number | null;
  opcode: string;
  sequence: number;
  sysMessage: string;
  xorSize: number;
  blowfishSize: number;
  totalLength: number;
  packetHex: string;
  headerHex: string;
  payloadHex: string;
}

function hex32(value: number): string {
  return `0x${value.toString(16).toUpperCase().padStart(8, "0")}`;
}

function isPrintable(byte: number): boolean {
  return byte >= 0x20 && byte <= 0x7e;
}

export function formatDirectionLabel(
  direction: PacketDirection,
  serverName?: UcgoServerName | null,
): string {
  if (!serverName) {
    return direction;
  }

  if (direction === "clientToServer") {
    return `clientTo${serverName}`;
  }

  if (direction === "serverToClient") {
    return `${serverName}ToClient`;
  }

  return direction;
}

export function formatHexDump(buffer: Buffer, bytesPerLine = 16): string {
  const lines: string[] = [];

  for (let offset = 0; offset < buffer.length; offset += bytesPerLine) {
    const slice = buffer.subarray(offset, offset + bytesPerLine);
    const hexBytes = Array.from(slice, (value) =>
      value.toString(16).toUpperCase().padStart(2, "0"),
    );
    const hexPart = hexBytes.join(" ").padEnd(bytesPerLine * 3 - 1, " ");
    const asciiPart = Array.from(slice, (value) => (isPrintable(value) ? String.fromCharCode(value) : ".")).join("");
    const offsetHex = offset.toString(16).toUpperCase().padStart(4, "0");

    lines.push(`${offsetHex}:   ${hexPart}   ${asciiPart}`);
  }

  return lines.join("\n");
}

export function formatPacketHexDump(packet: ParsedPacket, context: PacketDumpContext): string {
  const header = packet.header;
  const timestamp = context.timestamp ?? "unknown";
  const directionLabel = formatDirectionLabel(context.direction, context.serverName);

  const lines = [
    `Packet: ${context.packetNumber}`,
    `Time: ${timestamp}`,
    `${context.connection}`,
    `Direction: ${directionLabel}`,
    `Offset: ${context.streamOffset ?? -1}`,
    `Opcode: ${hex32(header.opcodeCandidate)}`,
    `Sequence: ${header.sequence}`,
    `SysMessage: ${hex32(header.sysMessage)}`,
    `XORSize: ${header.xorSize}`,
    `BlowfishSize: ${header.blowfishSize}`,
    `Total length: ${packet.bytes.length}`,
    "",
    formatHexDump(packet.bytes),
  ];

  return lines.join("\n");
}

export function buildPacketJsonRecord(
  packet: ParsedPacket,
  context: PacketDumpContext,
): PacketJsonRecord {
  const header = packet.header;
  const headerEnd = Math.min(64, packet.bytes.length);
  const directionLabel = formatDirectionLabel(context.direction, context.serverName);

  return {
    packetNumber: context.packetNumber,
    timestamp: context.timestamp ?? null,
    connection: context.connection,
    direction: context.direction,
    directionLabel,
    serverName: context.serverName ?? null,
    streamOffset: context.streamOffset ?? null,
    opcode: hex32(header.opcodeCandidate),
    sequence: header.sequence,
    sysMessage: hex32(header.sysMessage),
    xorSize: header.xorSize,
    blowfishSize: header.blowfishSize,
    totalLength: packet.bytes.length,
    packetHex: packet.bytes.toString("hex"),
    headerHex: packet.bytes.subarray(0, headerEnd).toString("hex"),
    payloadHex: packet.bytes.subarray(headerEnd).toString("hex"),
  };
}
