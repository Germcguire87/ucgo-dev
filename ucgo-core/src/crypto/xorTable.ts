import { readFile } from "node:fs/promises";
import { UcgoCryptoError } from "../utils/errors.js";

/** Opaque type alias — must be exactly 131,072 bytes (65,536 × 2-byte entries). */
export type XorTable = Buffer;

export const XOR_TABLE_SIZE = 131_072;

export async function loadXorTable(filePath: string): Promise<XorTable> {
  const buf = await readFile(filePath);
  if (buf.length !== XOR_TABLE_SIZE) {
    throw new UcgoCryptoError(
      `xortable.dat must be exactly ${XOR_TABLE_SIZE} bytes, got ${buf.length}`,
    );
  }
  return buf;
}

/**
 * Derive the 4-byte XOR key for a given 16-bit index.
 *
 * key[0] = table[index * 2]
 * key[1] = table[index * 2 + 1]
 * key[2] = index & 0xFF
 * key[3] = (index >> 8) & 0xFF
 */
export function deriveXorKey(index: number, table: XorTable): Buffer {
  const base = index * 2;
  if (base < 0 || base + 1 >= table.length) {
    throw new UcgoCryptoError(`XOR index ${index} out of range for table of length ${table.length}`);
  }
  return Buffer.from([
    table[base]!,
    table[base + 1]!,
    index & 0xff,
    (index >> 8) & 0xff,
  ]);
}
