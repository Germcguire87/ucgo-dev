/**
 * CLIENT_REQUEST_CHARACTER_DATA (0x00030002)
 *
 * Sent speculatively by the client for each character it remembers from a
 * prior session, in the same burst as 0x00030000 and 0x00030001.
 *
 * Body layout (9 bytes):
 *   0  4  Unknown — always 0x00000000, skipped by server (BE uint32)
 *   4  4  Character ID (BE uint32)
 *   8  1  Always 0x01
 */

import { BinaryReader } from "../../binary/BinaryReader.js";
import { BinaryWriter } from "../../binary/BinaryWriter.js";

export interface ClientRequestCharacterData30002 {
  /** Always 0x00000000; server ignores it */
  unknown: number;
  characterId: number;
  /** Always 0x01 */
  terminator: number;
}

export const ClientRequestCharacterData30002Codec = {
  decode(body: Buffer): ClientRequestCharacterData30002 {
    const r           = new BinaryReader(body);
    const unknown     = r.readUInt32BE();
    const characterId = r.readUInt32BE();
    const terminator  = r.readUInt8();
    return { unknown, characterId, terminator };
  },

  encode(model: ClientRequestCharacterData30002): Buffer {
    const w = new BinaryWriter();
    w.writeUInt32BE(model.unknown);
    w.writeUInt32BE(model.characterId);
    w.writeUInt8(model.terminator);
    return w.toBuffer();
  },
};
