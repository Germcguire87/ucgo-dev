/**
 * CLIENT_GAME_SERVER_REQUEST (0x00030005)
 *
 * Sent by the client when the player selects a character and clicks Play.
 * This is the final exchange before the client connects to the game server.
 *
 * Body layout (9 bytes, verified from live capture):
 *   0  4  securityToken (BE uint32) — echoed from SERVER_LOGIN_RESPONSE (0x00038000) field 2
 *   4  4  accountId     (BE uint32) — authenticated account
 *   8  1  terminator    (always 0x01, matching sibling packet pattern)
 *
 * Note: there is no characterId in this packet. The server tracks the selected
 * character via the prior CLIENT_REQUEST_CHARACTER_DATA (0x00030002) exchange.
 * The securityToken is hardcoded to 0x12345678 in the original UCGOhost server.
 */

import { BinaryReader } from "../../binary/BinaryReader.js";
import { BinaryWriter } from "../../binary/BinaryWriter.js";

export interface ClientGameServerRequest30005 {
  /** Echoed from SERVER_LOGIN_RESPONSE securityToken (0x12345678 in UCGOhost) */
  securityToken: number;
  accountId: number;
  /** Always 0x01 */
  terminator: number;
}

export const ClientGameServerRequest30005Codec = {
  decode(body: Buffer): ClientGameServerRequest30005 {
    const r             = new BinaryReader(body);
    const securityToken = r.readUInt32BE();
    const accountId     = r.readUInt32BE();
    const terminator    = r.readUInt8();
    return { securityToken, accountId, terminator };
  },

  encode(model: ClientGameServerRequest30005): Buffer {
    const w = new BinaryWriter();
    w.writeUInt32BE(model.securityToken);
    w.writeUInt32BE(model.accountId);
    w.writeUInt8(model.terminator);
    return w.toBuffer();
  },
};
