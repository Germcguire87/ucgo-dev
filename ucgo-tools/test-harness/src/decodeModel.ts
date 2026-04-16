/**
 * Opcode routing — decode each PacketEnvelope body into a typed model
 * and print a human-readable summary.
 */

import {
  Opcode,
  ClientLoginRequest30000Codec,
  ClientAccountEcho30001Codec,
  ClientRequestCharacterData30002Codec,
  ServerLoginResponse38000Codec,
  ServerCharacterSlotList38001Codec,
  ServerCharacterData38002Codec,
  ServerGameServerInfo38005Codec,
  decryptLoginPassword,
  LoginResultCode,
  decodeSkillValue,
  type PacketEnvelope,
} from "ucgo-core";

import {
  printField,
  printFieldHex,
  printBytes,
  printBodyHex,
  c,
} from "./print.js";

// ── Direction labels ─────────────────────────────────────────────────────────

const LOGIN_SERVER_PORT = 24018;
const INFO_SERVER_PORT  = 24012;

export function directionLabel(srcPort: number | undefined, dstPort: number | undefined): string {
  if (dstPort === LOGIN_SERVER_PORT || dstPort === INFO_SERVER_PORT) return "Client → Server";
  if (srcPort === LOGIN_SERVER_PORT || srcPort === INFO_SERVER_PORT) return "Server → Client";
  return "Unknown";
}

export function opcodeName(opcode: number): string {
  const names: Record<number, string> = {
    [Opcode.CLIENT_LOGIN_REQUEST]:              "CLIENT_LOGIN_REQUEST",
    [Opcode.CLIENT_ACCOUNT_ECHO]:               "CLIENT_ACCOUNT_ECHO",
    [Opcode.CLIENT_REQUEST_CHARACTER_DATA]:     "CLIENT_REQUEST_CHARACTER_DATA",
    [Opcode.CLIENT_CREATE_CHARACTER]:           "CLIENT_CREATE_CHARACTER",
    [Opcode.CLIENT_DELETE_CHARACTER]:           "CLIENT_DELETE_CHARACTER",
    [Opcode.CLIENT_GAME_SERVER_REQUEST]:        "CLIENT_GAME_SERVER_REQUEST",
    [Opcode.SERVER_LOGIN_RESPONSE]:             "SERVER_LOGIN_RESPONSE",
    [Opcode.SERVER_CHARACTER_SLOT_LIST]:        "SERVER_CHARACTER_SLOT_LIST",
    [Opcode.SERVER_CHARACTER_DATA]:             "SERVER_CHARACTER_DATA",
    [Opcode.SERVER_CREATE_CHARACTER_RESPONSE]:  "SERVER_CREATE_CHARACTER_RESPONSE",
    [Opcode.SERVER_DELETE_CHARACTER_RESPONSE]:  "SERVER_DELETE_CHARACTER_RESPONSE",
    [Opcode.SERVER_GAME_SERVER_INFO]:           "SERVER_GAME_SERVER_INFO",
  };
  return names[opcode] ?? `UNKNOWN(0x${opcode.toString(16).toUpperCase().padStart(8, "0")})`;
}

// ── Result code labels ────────────────────────────────────────────────────────

function loginResultLabel(code: number): string {
  const labels: Record<number, string> = {
    [LoginResultCode.SUCCESS]:           "SUCCESS",
    [LoginResultCode.BAD_CREDENTIALS]:   "BAD_CREDENTIALS",
    [LoginResultCode.MAINTENANCE]:       "MAINTENANCE",
    [LoginResultCode.WRONG_VERSION]:     "WRONG_VERSION",
    [LoginResultCode.ALREADY_LOGGED_IN]: "ALREADY_LOGGED_IN",
  };
  return labels[code] ?? `UNKNOWN(0x${code.toString(16).toUpperCase()})`;
}

// ── Main dispatch ─────────────────────────────────────────────────────────────

export function decodeAndPrint(envelope: PacketEnvelope): void {
  const { opcode } = envelope.header;
  const body       = envelope.body;

  try {
    switch (opcode) {
      case Opcode.CLIENT_LOGIN_REQUEST:    return printClientLoginRequest(body);
      case Opcode.CLIENT_ACCOUNT_ECHO:     return printClientAccountEcho(body);
      case Opcode.CLIENT_REQUEST_CHARACTER_DATA: return printClientRequestCharData(body);
      case Opcode.SERVER_LOGIN_RESPONSE:   return printServerLoginResponse(body);
      case Opcode.SERVER_CHARACTER_SLOT_LIST: return printServerCharSlotList(body);
      case Opcode.SERVER_CHARACTER_DATA:   return printServerCharData(body);
      case Opcode.SERVER_GAME_SERVER_INFO: return printServerGameServerInfo(body);
      default:
        console.log(`  ${c.DIM}No model decoder for this opcode — raw body:${c.RESET}`);
        printBodyHex(body);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ${c.RED}Decode error: ${msg}${c.RESET}`);
    console.log(`  ${c.DIM}Raw body:${c.RESET}`);
    printBodyHex(body);
  }
}

// ── Per-opcode printers ───────────────────────────────────────────────────────

function printClientLoginRequest(body: Buffer): void {
  const m = ClientLoginRequest30000Codec.decode(body);
  printField("Username",        m.username);
  printField("Client version",  `0x${m.clientVersion.toString(16).toUpperCase().padStart(8, "0")}`);
  printField("Payload size",    m.encryptedPassword.length, "ciphertext bytes");
  printBytes("Encrypted pw",    m.encryptedPassword.subarray(0, Math.min(16, m.encryptedPassword.length)));

  // Decrypt the password
  try {
    const plaintext = decryptLoginPassword(m.encryptedPassword, m.username);
    printField("Decrypted pw",  plaintext, c.GREEN + "✓ decrypted" + c.RESET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    printField("Decrypted pw",  `FAILED: ${msg}`);
  }
}

function printClientAccountEcho(body: Buffer): void {
  const m = ClientAccountEcho30001Codec.decode(body);
  printFieldHex("Account ID",  m.accountId);
  printFieldHex("Unknown",     m.unknown);
}

function printClientRequestCharData(body: Buffer): void {
  const m = ClientRequestCharacterData30002Codec.decode(body);
  printFieldHex("Character ID", m.characterId);
}

function printServerLoginResponse(body: Buffer): void {
  const m = ServerLoginResponse38000Codec.decode(body);
  const resultLabel = loginResultLabel(m.resultCode);
  const resultColor = m.resultCode === LoginResultCode.SUCCESS ? c.GREEN : c.RED;
  printField("Result",          resultColor + resultLabel + c.RESET);
  printFieldHex("Security token", m.securityToken);
  printFieldHex("Account ID",     m.accountId);
  printFieldHex("UCGM tag",       m.ucgmTag, m.ucgmTag === 0x0a ? "normal account" : "");
}

function printServerCharSlotList(body: Buffer): void {
  const m = ServerCharacterSlotList38001Codec.decode(body);
  printFieldHex("Account ID",   m.accountId);
  printField("Char count",      m.slots.length.toString());
  for (let i = 0; i < m.slots.length; i++) {
    const s = m.slots[i]!;
    printFieldHex(`  Slot ${i} char ID`, s.characterId,
      s.characterId === 0xffffffff ? "empty" : undefined);
  }
}

function printServerCharData(body: Buffer): void {
  const m = ServerCharacterData38002Codec.decode(body);
  printFieldHex("Account ID",    m.accountId);
  printFieldHex("Character ID",  m.characterId);
  printField("Name",             m.name);
  printField("Gender",           m.gender === 0x01 ? "Female" : "Male");
  printField("Faction",          m.faction === 0x01 ? "Zeon" : "Earth Federation");
  printField("Rank",             m.rank.toString());

  const { level: strLvl } = decodeSkillValue(m.strength);
  const { level: sprLvl } = decodeSkillValue(m.spirit);
  const { level: lckLvl } = decodeSkillValue(m.luck);
  printField("Stats STR/SPR/LCK", `${strLvl} / ${sprLvl} / ${lckLvl}`);

  const pos = m.position;
  printField("Zone",             pos.zoneId.toString());
  printField("Position",         `${pos.x}, ${pos.y}, ${pos.z}`);
  printField("Face / hair",      `${m.faceIndex} / ${m.hairStyle} (color ${m.hairColor})`);
}

function printServerGameServerInfo(body: Buffer): void {
  const m = ServerGameServerInfo38005Codec.decode(body);
  printField("Result",           m.resultCode === 1 ? c.GREEN + "SUCCESS" + c.RESET : "FAILURE");
  printField("Game server IP",   m.gameServerIp);
  printField("Game server port", m.gameServerPort.toString());
}
