/**
 * Crypto test vector validation + encode-a-response examples.
 *
 * This runs independently of any capture file. It verifies:
 *   1. encryptLoginPassword test vectors from CRYPTO_REFERENCE.md
 *   2. decryptLoginPassword round-trips
 *   3. Encode sample SERVER_LOGIN_RESPONSE and print hex
 *   4. Encode sample SERVER_GAME_SERVER_INFO and print hex
 */

import {
  encryptLoginPassword,
  decryptLoginPassword,
  ServerLoginResponse38000Codec,
  ServerGameServerInfo38005Codec,
  ServerCharacterSlotList38001Codec,
  hexDump,
  Opcode,
  LoginResultCode,
} from "ucgo-core";

import { printSectionHeader, printPass, printFail, printRule, c } from "./print.js";

// ── Test vectors from ucgo-protocol/docs/protocol/login/CRYPTO_REFERENCE.md ─

interface PasswordVector {
  username: string;
  password: string;
  expectedFirstBlock: string;  // first 8 bytes of ciphertext, hex uppercase
}

const PASSWORD_VECTORS: PasswordVector[] = [
  { username: "testuser",    password: "a",        expectedFirstBlock: "8132164993621AA1" },
  { username: "testuser",    password: "password",  expectedFirstBlock: "137798C41D8ED6E0" },
  { username: "testuser",    password: "ZZZZZZZZ",  expectedFirstBlock: "4F1FBE629A9D91C0" },
  { username: "testuser",    password: "1234567",   expectedFirstBlock: "163F7955B1422AB5" },
  { username: "anewaccount", password: "abc123",    expectedFirstBlock: "9D72FD8A71D48A44" },
];

// ── Sample response bodies for encode examples ────────────────────────────────

function buildLoginSuccessBody(): Buffer {
  return ServerLoginResponse38000Codec.encode({
    resultCode:    LoginResultCode.SUCCESS,
    securityToken: 0x12345678,
    accountId:     0x01d33c7e,
    ucgmTag:       0x0000000a,
  });
}

function buildLoginFailBody(): Buffer {
  return ServerLoginResponse38000Codec.encode({
    resultCode:    LoginResultCode.BAD_CREDENTIALS,
    securityToken: 0xffffffff,
    accountId:     0xffffffff,
    ucgmTag:       0x00000000,
  });
}

function buildCharSlotListBody(): Buffer {
  return ServerCharacterSlotList38001Codec.encode({
    accountId:   0x01d33c7e,
    unknown:     0x00,
    countMarker: 0x82, // 0x80 | 2 = two characters
    slots: [
      { accountId: 0x01d33c7e, characterId: 0x0000be2e, unknown1: 0xffffffff, unknown2: 0xffffffff },
      { accountId: 0x01d33c7e, characterId: 0x000097d6, unknown1: 0xffffffff, unknown2: 0xffffffff },
    ],
  });
}

function buildGameServerInfoBody(): Buffer {
  const ip = "127.0.0.1";
  return ServerGameServerInfo38005Codec.encode({
    resultCode:     0x00000001,
    ipLengthMarker: 0x80 | ip.length,
    gameServerIp:   ip,
    gameServerPort: 24010, // 0x5DCA
    unknown:        0x00000000,
  });
}

// ── Runner ────────────────────────────────────────────────────────────────────

export function runVectorValidation(): void {
  // ── 1. Password encryption vectors ──────────────────────────────────────────
  printSectionHeader("Password encryption vectors (encryptLoginPassword)");

  let passed = 0;
  let failed = 0;

  for (const v of PASSWORD_VECTORS) {
    const ciphertext = encryptLoginPassword(v.password, v.username);
    const got        = ciphertext.subarray(0, 8).toString("hex").toUpperCase();
    const label      = `${v.username} / "${v.password}"`;

    if (got === v.expectedFirstBlock) {
      printPass(label);
      passed++;
    } else {
      printFail(label, got, v.expectedFirstBlock);
      failed++;
    }
  }

  // ── 2. Password decryption round-trips ────────────────────────────────────
  printSectionHeader("Password decryption round-trips (decryptLoginPassword)");

  for (const v of PASSWORD_VECTORS) {
    const ciphertext = encryptLoginPassword(v.password, v.username);
    const decrypted  = decryptLoginPassword(ciphertext, v.username);
    const label      = `${v.username} / "${v.password}"`;

    if (decrypted === v.password) {
      printPass(label);
      passed++;
    } else {
      printFail(label, decrypted, v.password);
      failed++;
    }
  }

  // ── 3. Encode examples ─────────────────────────────────────────────────────
  printSectionHeader("SERVER_LOGIN_RESPONSE (0x00038000) — success body");
  const successBody = buildLoginSuccessBody();
  console.log(`  ${successBody.length} bytes`);
  console.log(hexDump(successBody, "  body:").split("\n").map(l => "  " + l).join("\n"));

  printSectionHeader("SERVER_LOGIN_RESPONSE (0x00038000) — failure body");
  const failBody = buildLoginFailBody();
  console.log(`  ${failBody.length} bytes`);
  console.log(hexDump(failBody).split("\n").map(l => "  " + l).join("\n"));

  printSectionHeader("SERVER_CHARACTER_SLOT_LIST (0x00038001) — 2 characters");
  const slotBody = buildCharSlotListBody();
  console.log(`  ${slotBody.length} bytes`);
  console.log(hexDump(slotBody).split("\n").map(l => "  " + l).join("\n"));

  printSectionHeader("SERVER_GAME_SERVER_INFO (0x00038005) — 127.0.0.1:24010");
  const gsBody = buildGameServerInfoBody();
  console.log(`  ${gsBody.length} bytes`);
  console.log(hexDump(gsBody).split("\n").map(l => "  " + l).join("\n"));

  // ── 4. Encode + decode round-trip ──────────────────────────────────────────
  printSectionHeader("Encode → decode round-trip (ServerLoginResponse38000)");

  const original = {
    resultCode:    LoginResultCode.SUCCESS,
    securityToken: 0x12345678,
    accountId:     0x01d33c7e,
    ucgmTag:       0x0000000a,
  };
  const encoded  = ServerLoginResponse38000Codec.encode(original);
  const decoded  = ServerLoginResponse38000Codec.decode(encoded);

  const fields: (keyof typeof original)[] = ["resultCode", "securityToken", "accountId", "ucgmTag"];
  for (const field of fields) {
    const orig = original[field];
    const dec  = decoded[field];
    const label = `${field}: 0x${orig.toString(16).padStart(8, "0")}`;
    if (orig === dec) {
      printPass(label);
      passed++;
    } else {
      printFail(label, `0x${dec.toString(16).padStart(8, "0")}`, `0x${orig.toString(16).padStart(8, "0")}`);
      failed++;
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log();
  printRule("═");
  const total = passed + failed;
  if (failed === 0) {
    console.log(c.BOLD + c.GREEN + `All ${total} checks passed.` + c.RESET);
  } else {
    console.log(c.BOLD + c.RED + `${failed}/${total} checks FAILED.` + c.RESET);
  }
  printRule("═");
}
