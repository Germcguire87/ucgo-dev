// Investigate the testuser/"a" vector discrepancy
import { UcgoBlowfish } from "ucgo-core";

const expected = Buffer.from("F1723D76FDC33C4A", "hex");

function tryDecrypt(label: string, key: Buffer, ct: Buffer): void {
  const bf    = new UcgoBlowfish(key);
  const plain = bf.decrypt(ct);
  const hex   = plain.toString("hex").toUpperCase();
  const utf16 = plain.toString("utf16le").replace(/\0/g, "·");
  const ascii = plain.toString("ascii").replace(/[^\x20-\x7e]/g, "·");
  console.log(`${label.padEnd(38)} → hex:${hex}  utf16:"${utf16}"  ascii:"${ascii}"`);
}

function tryEncrypt(label: string, key: Buffer, plain: Buffer): void {
  const padded = Buffer.alloc(Math.ceil(Math.max(plain.length, 8) / 8) * 8);
  plain.copy(padded);
  const bf   = new UcgoBlowfish(key);
  const ct   = bf.encrypt(padded);
  const got  = ct.subarray(0, 8).toString("hex").toUpperCase();
  const mark = got === "F1723D76FDC33C4A" ? " ← MATCH" : "";
  console.log(`${label.padEnd(38)} → ${got}${mark}`);
}

const username = "testuser";
const keyUtf16Null = Buffer.concat([Buffer.from(username, "utf16le"), Buffer.alloc(2)]);
const keyAscii     = Buffer.from(username, "ascii");
const keyUtf16     = Buffer.from(username, "utf16le");

console.log("=== Decrypt F1723D76FDC33C4A ===");
tryDecrypt("UTF-16LE + null (current)",  keyUtf16Null, expected);
tryDecrypt("ASCII key",                  keyAscii,     expected);
tryDecrypt("UTF-16LE no null",           keyUtf16,     expected);

console.log("\n=== Encrypt various plaintexts → expect F1723D76FDC33C4A ===");
tryEncrypt('"a" UTF-16LE',               keyUtf16Null, Buffer.from("a", "utf16le"));
tryEncrypt('"a" ASCII',                  keyUtf16Null, Buffer.from("a", "ascii"));
tryEncrypt('"aa" UTF-16LE',              keyUtf16Null, Buffer.from("aa", "utf16le"));
tryEncrypt('"a" UTF-16LE, ASCII key',    keyAscii,     Buffer.from("a", "utf16le"));
tryEncrypt('"a" ASCII, ASCII key',       keyAscii,     Buffer.from("a", "ascii"));
tryEncrypt('"a" UTF-16LE, no-null key',  keyUtf16,     Buffer.from("a", "utf16le"));
