import { UcgoDecodeError } from "./errors.js";

export function assertMinLength(buf: Buffer, minLen: number, context: string): void {
  if (buf.length < minLen) {
    throw new UcgoDecodeError(
      `${context}: expected at least ${minLen} bytes, got ${buf.length}`,
    );
  }
}

export function assertExactLength(buf: Buffer, len: number, context: string): void {
  if (buf.length !== len) {
    throw new UcgoDecodeError(
      `${context}: expected exactly ${len} bytes, got ${buf.length}`,
    );
  }
}
