/**
 * SERVER_GAME_SERVER_INFO (0x00038005)
 *
 * Final packet in the login server flow. Provides the game server IP and port.
 *
 * Body layout:
 *   0    4   resultCode   (BE uint32) — always 0x00000001 (success)
 *   4    1   0x80 | ipLength
 *   5    n   gameServerIp (ASCII, no null terminator)
 *   5+n  2   gameServerPort (BE uint16) — 0x5DCA = 24010
 *   7+n  4   unknown      (BE uint32) — always 0x00000000 observed
 */

import { BinaryReader } from "../../binary/BinaryReader.js";
import { BinaryWriter } from "../../binary/BinaryWriter.js";

export interface ServerGameServerInfo38005 {
  /** Always 0x00000001 */
  resultCode: number;
  /** 0x80 | ipLength — raw byte */
  ipLengthMarker: number;
  /** ASCII IP address string */
  gameServerIp: string;
  /** Game server TCP port (24010 = 0x5DCA observed) */
  gameServerPort: number;
  /** Always 0x00000000 observed; purpose unknown */
  unknown: number;
}

export const ServerGameServerInfo38005Codec = {
  decode(body: Buffer): ServerGameServerInfo38005 {
    const r               = new BinaryReader(body);
    const resultCode      = r.readUInt32BE();
    const ipLengthMarker  = r.readUInt8();
    const ipLength        = ipLengthMarker & 0x7f;
    const gameServerIp    = r.readAscii(ipLength);
    const gameServerPort  = r.readUInt16BE();
    const unknown         = r.readUInt32BE();
    return { resultCode, ipLengthMarker, gameServerIp, gameServerPort, unknown };
  },

  encode(model: ServerGameServerInfo38005): Buffer {
    const w = new BinaryWriter();
    w.writeUInt32BE(model.resultCode);
    w.writeUInt8(model.ipLengthMarker);
    w.writeAscii(model.gameServerIp);
    w.writeUInt16BE(model.gameServerPort);
    w.writeUInt32BE(model.unknown);
    return w.toBuffer();
  },
};
