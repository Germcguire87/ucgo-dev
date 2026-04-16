/**
 * SERVER_INFO_RESPONSE (0x00008000)
 *
 * Sent by the info server in response to CLIENT_INFO_REQUEST (0x00000000).
 * Reports whether the game is online or in maintenance.
 *
 * Body layout (8 bytes):
 *   0  8  status  BE uint64 — 0x00 = Online, 0x01 = Offline/Maintenance
 *
 * Reference: Opcode0x00.java (UCGOhost server source)
 */

import { BinaryWriter } from "../../binary/BinaryWriter.js";

export interface ServerInfoResponse8000 {
  /** 0x00 = Online, 0x01 = Offline/Maintenance */
  status: number;
}

export const ServerInfoResponse8000Codec = {
  encode(model: ServerInfoResponse8000): Buffer {
    const w = new BinaryWriter();
    w.writeUInt32BE(0);           // high dword of uint64 (always 0)
    w.writeUInt32BE(model.status); // low dword — 0x00=Online, 0x01=Offline
    return w.toBuffer();
  },
};
