export class BinaryWriter {
  private readonly chunks: Buffer[] = [];
  private _size = 0;

  private push(buf: Buffer): this {
    this.chunks.push(buf);
    this._size += buf.length;
    return this;
  }

  // ── Integer writes ───────────────────────────────────────────────────────────

  writeUInt8(v: number): this {
    const b = Buffer.allocUnsafe(1);
    b.writeUInt8(v, 0);
    return this.push(b);
  }

  writeUInt16LE(v: number): this {
    const b = Buffer.allocUnsafe(2);
    b.writeUInt16LE(v, 0);
    return this.push(b);
  }

  writeUInt32LE(v: number): this {
    const b = Buffer.allocUnsafe(4);
    b.writeUInt32LE(v, 0);
    return this.push(b);
  }

  writeUInt16BE(v: number): this {
    const b = Buffer.allocUnsafe(2);
    b.writeUInt16BE(v, 0);
    return this.push(b);
  }

  writeUInt32BE(v: number): this {
    const b = Buffer.allocUnsafe(4);
    b.writeUInt32BE(v, 0);
    return this.push(b);
  }

  writeInt16BE(v: number): this {
    const b = Buffer.allocUnsafe(2);
    b.writeInt16BE(v, 0);
    return this.push(b);
  }

  writeInt32BE(v: number): this {
    const b = Buffer.allocUnsafe(4);
    b.writeInt32BE(v, 0);
    return this.push(b);
  }

  // ── Raw bytes ────────────────────────────────────────────────────────────────

  writeBytes(buf: Buffer | Uint8Array): this {
    return this.push(Buffer.from(buf));
  }

  /** Write `n` bytes of `fill` (default 0x00). */
  writePadding(n: number, fill = 0x00): this {
    return this.push(Buffer.alloc(n, fill));
  }

  // ── Strings ──────────────────────────────────────────────────────────────────

  writeAscii(s: string): this {
    return this.push(Buffer.from(s, "ascii"));
  }

  writeUtf16LE(s: string): this {
    return this.push(Buffer.from(s, "utf16le"));
  }

  // ── Output ───────────────────────────────────────────────────────────────────

  size(): number {
    return this._size;
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }
}
