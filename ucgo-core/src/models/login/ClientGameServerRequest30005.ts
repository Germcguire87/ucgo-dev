/**
 * CLIENT_GAME_SERVER_REQUEST (0x00030005)
 *
 * Sent by the client when the player selects a character and requests
 * game server handoff. This is the final client packet in the login flow.
 *
 * Body layout (inferred — no decoded capture available for this opcode):
 *   0  4  accountId   (BE uint32) — authenticated account
 *   4  4  characterId (BE uint32) — selected character
 *   8  1  terminator  (0x01 — matches sibling packet 0x00030002 pattern)
 *
 * NOTE: Layout is inferred from LOGIN_FLOW.md ("account ID + character ID")
 * and the consistent pattern of sibling packets (0x00030001, 0x00030002).
 * Verify against a live capture when available.
 */

import { BinaryReader } from "../../binary/BinaryReader.js";
import { BinaryWriter } from "../../binary/BinaryWriter.js";

export interface ClientGameServerRequest30005 {
  accountId: number;
  characterId: number;
  /** Always 0x01 (matching sibling packet pattern) */
  terminator: number;
}

export const ClientGameServerRequest30005Codec = {
  decode(body: Buffer): ClientGameServerRequest30005 {
    const r           = new BinaryReader(body);
    const accountId   = r.readUInt32BE();
    const characterId = r.readUInt32BE();
    const terminator  = r.readUInt8();
    return { accountId, characterId, terminator };
  },

  encode(model: ClientGameServerRequest30005): Buffer {
    const w = new BinaryWriter();
    w.writeUInt32BE(model.accountId);
    w.writeUInt32BE(model.characterId);
    w.writeUInt8(model.terminator);
    return w.toBuffer();
  },
};
