/**
 * CLIENT_ACCOUNT_ECHO (0x00030001)
 *
 * Sent immediately after 0x00030000 in the same TCP burst.
 * Body layout (9 bytes):
 *   0  4  Unknown — always 0x00000000 (BE uint32)
 *   4  4  Account ID (BE uint32) — client's stored account ID from prior login
 *   8  1  Terminator — always 0x00
 */

import { BinaryReader } from "../../binary/BinaryReader.js";
import { BinaryWriter } from "../../binary/BinaryWriter.js";

export interface ClientAccountEcho30001 {
  /** Always 0x00000000 observed; purpose unknown */
  unknown: number;
  /** Account ID from prior session (0 on first login) */
  accountId: number;
  /** Always 0x00 */
  terminator: number;
}

export const ClientAccountEcho30001Codec = {
  decode(body: Buffer): ClientAccountEcho30001 {
    const r          = new BinaryReader(body);
    const unknown    = r.readUInt32BE();
    const accountId  = r.readUInt32BE();
    const terminator = r.readUInt8();
    return { unknown, accountId, terminator };
  },

  encode(model: ClientAccountEcho30001): Buffer {
    const w = new BinaryWriter();
    w.writeUInt32BE(model.unknown);
    w.writeUInt32BE(model.accountId);
    w.writeUInt8(model.terminator);
    return w.toBuffer();
  },
};
