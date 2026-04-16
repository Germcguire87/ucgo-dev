import type { XorTable } from "../crypto/xorTable.js";
import { SequenceCounter } from "./SequenceCounter.js";

export interface PacketSessionOptions {
  xorTable: XorTable;
  blowfishKey: Buffer | string;
}

/**
 * Groups the crypto context and sequence counter for one TCP connection.
 * The login server creates one PacketSession per client connection.
 */
export class PacketSession {
  readonly xorTable: XorTable;
  readonly blowfishKey: Buffer | string;
  readonly sequence: SequenceCounter;

  constructor(opts: PacketSessionOptions) {
    this.xorTable    = opts.xorTable;
    this.blowfishKey = opts.blowfishKey;
    this.sequence    = new SequenceCounter(1);
  }

  /** Convenience: returns DecodeContext / EncodeContext shape for codec functions. */
  get cryptoOptions(): { xorTable: XorTable; blowfishKey: Buffer | string } {
    return { xorTable: this.xorTable, blowfishKey: this.blowfishKey };
  }
}
