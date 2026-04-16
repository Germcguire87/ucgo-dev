/**
 * Formatting helpers for test harness output.
 */

import { hexDump, type PacketEnvelope } from "ucgo-core";

const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m";
const RED    = "\x1b[31m";
const BLUE   = "\x1b[34m";

export const c = { RESET, BOLD, DIM, GREEN, YELLOW, CYAN, RED, BLUE };

function hex32(n: number): string {
  return `0x${n.toString(16).toUpperCase().padStart(8, "0")}`;
}

export function printRule(char = "─", width = 72): void {
  console.log(DIM + char.repeat(width) + RESET);
}

export function printSectionHeader(label: string): void {
  console.log();
  console.log(BOLD + CYAN + `▶ ${label}` + RESET);
  printRule();
}

export function printPacketBanner(
  packetNumber: number,
  direction: string,
  opcodeName: string,
  streamOffset: number,
): void {
  console.log();
  printRule("═");
  console.log(
    BOLD + `Packet #${packetNumber}` + RESET +
    `  ${YELLOW}${direction}${RESET}` +
    `  ${CYAN}${opcodeName}${RESET}` +
    `  ${DIM}@stream+${streamOffset}${RESET}`,
  );
  printRule("═");
}

export function printHeaderFields(envelope: PacketEnvelope): void {
  const h = envelope.header;
  console.log(`  ${DIM}Opcode      ${RESET}${hex32(h.opcode)}`);
  console.log(`  ${DIM}Sequence    ${RESET}${h.sequence}`);
  console.log(`  ${DIM}XORSize     ${RESET}${h.xorSize}`);
  console.log(`  ${DIM}BFSize      ${RESET}${h.blowfishSize}`);
  console.log(`  ${DIM}XORIndex    ${RESET}0x${h.xorIndex.toString(16).padStart(4, "0")}`);
  console.log(`  ${DIM}SysMessage  ${RESET}${hex32(h.sysMessage)}`);
}

export function printBodyHex(body: Buffer): void {
  if (body.length === 0) {
    console.log(`  ${DIM}(empty body)${RESET}`);
    return;
  }
  const dump = hexDump(body)
    .split("\n")
    .map(line => "  " + DIM + line + RESET)
    .join("\n");
  console.log(dump);
}

export function printField(label: string, value: string | number, note?: string): void {
  const valueStr = typeof value === "number" ? value.toString() : value;
  const noteStr  = note !== undefined ? `  ${DIM}(${note})${RESET}` : "";
  console.log(`  ${label.padEnd(22)} ${BOLD}${valueStr}${RESET}${noteStr}`);
}

export function printFieldHex(label: string, value: number, note?: string): void {
  printField(label, `0x${value.toString(16).toUpperCase().padStart(8, "0")}`, note);
}

export function printBytes(label: string, buf: Buffer): void {
  const hex = buf.toString("hex").toUpperCase().match(/.{1,2}/g)?.join(" ") ?? "";
  console.log(`  ${label.padEnd(22)} ${BOLD}${hex}${RESET}`);
}

export function printPass(label: string): void {
  console.log(`  ${GREEN}✓ PASS${RESET}  ${label}`);
}

export function printFail(label: string, got: string, want: string): void {
  console.log(`  ${RED}✗ FAIL${RESET}  ${label}`);
  console.log(`         got  ${RED}${got}${RESET}`);
  console.log(`         want ${GREEN}${want}${RESET}`);
}
