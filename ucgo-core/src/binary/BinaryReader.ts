import { UcgoDecodeError } from "../utils/errors.js";

export class BinaryReader {
  private readonly buf: Buffer;
  private pos: number;

  constructor(buf: Buffer) {
    this.buf = buf;
    this.pos = 0;
  }

  // ── Position ────────────────────────────────────────────────────────────────

  tell(): number {
    return this.pos;
  }

  seek(offset: number): void {
    if (offset < 0 || offset > this.buf.length) {
      throw new UcgoDecodeError(
        `seek out of bounds: ${offset} (buffer length ${this.buf.length})`,
      );
    }
    this.pos = offset;
  }

  skip(n: number): void {
    this.seek(this.pos + n);
  }

  remaining(): number {
    return this.buf.length - this.pos;
  }

  // ── Private guard ────────────────────────────────────────────────────────────

  private need(n: number): void {
    if (this.pos + n > this.buf.length) {
      throw new UcgoDecodeError(
        `read past end of buffer: need ${n} bytes at offset ${this.pos}, ` +
          `have ${this.remaining()} remaining`,
      );
    }
  }

  // ── Integer reads ────────────────────────────────────────────────────────────

  readUInt8(): number {
    this.need(1);
    return this.buf[this.pos++]!;
  }

  readUInt16LE(): number {
    this.need(2);
    const v = this.buf.readUInt16LE(this.pos);
    this.pos += 2;
    return v;
  }

  readUInt32LE(): number {
    this.need(4);
    const v = this.buf.readUInt32LE(this.pos);
    this.pos += 4;
    return v;
  }

  readUInt16BE(): number {
    this.need(2);
    const v = this.buf.readUInt16BE(this.pos);
    this.pos += 2;
    return v;
  }

  readUInt32BE(): number {
    this.need(4);
    const v = this.buf.readUInt32BE(this.pos);
    this.pos += 4;
    return v;
  }

  readInt16BE(): number {
    this.need(2);
    const v = this.buf.readInt16BE(this.pos);
    this.pos += 2;
    return v;
  }

  readInt32BE(): number {
    this.need(4);
    const v = this.buf.readInt32BE(this.pos);
    this.pos += 4;
    return v;
  }

  // ── Raw bytes ────────────────────────────────────────────────────────────────

  /** Returns a copy of the next n bytes. */
  readBytes(n: number): Buffer {
    this.need(n);
    const copy = Buffer.from(this.buf.subarray(this.pos, this.pos + n));
    this.pos += n;
    return copy;
  }

  /** Zero-copy view into the underlying buffer. Do not mutate the result. */
  readSlice(n: number): Buffer {
    this.need(n);
    const slice = this.buf.subarray(this.pos, this.pos + n);
    this.pos += n;
    return slice;
  }

  // ── Strings ──────────────────────────────────────────────────────────────────

  readAscii(n: number): string {
    this.need(n);
    const s = this.buf.toString("ascii", this.pos, this.pos + n);
    this.pos += n;
    return s;
  }

  /**
   * Read `charCount` UTF-16LE characters (charCount * 2 bytes).
   * Does NOT consume a null terminator — call skip(2) separately if needed.
   */
  readUtf16LE(charCount: number): string {
    const byteCount = charCount * 2;
    this.need(byteCount);
    const s = this.buf.toString("utf16le", this.pos, this.pos + byteCount);
    this.pos += byteCount;
    return s;
  }
}
