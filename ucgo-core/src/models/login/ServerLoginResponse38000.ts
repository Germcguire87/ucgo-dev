/**
 * SERVER_LOGIN_RESPONSE (0x00038000)
 *
 * Body layout (16 bytes fixed):
 *   0   4  resultCode    (BE uint32)
 *   4   4  securityToken (BE uint32) — 0x12345678 in UCGOhost (hardcoded stub)
 *   8   4  accountId     (BE uint32) — 0xFFFFFFFF on failure
 *   12  4  ucgmTag       (BE uint32) — 0x0A = normal account; 0xFFFFFFFF on failure
 */

import { BinaryReader } from "../../binary/BinaryReader.js";
import { BinaryWriter } from "../../binary/BinaryWriter.js";

export const LoginResultCode = {
  SUCCESS:         0x01,
  BAD_CREDENTIALS: 0x09,
  MAINTENANCE:     0x0b,
  WRONG_VERSION:   0x0c,
  ALREADY_LOGGED_IN: 0x15,
} as const;

export type LoginResultCode = (typeof LoginResultCode)[keyof typeof LoginResultCode];

export interface ServerLoginResponse38000 {
  resultCode: number;
  /** Security token — purpose unknown in original server; UCGOhost hardcodes 0x12345678 */
  securityToken: number;
  /** Session account ID; 0xFFFFFFFF on failure */
  accountId: number;
  /** GM privilege level; 0x0A for normal accounts; 0xFFFFFFFF on failure */
  ucgmTag: number;
}

export const ServerLoginResponse38000Codec = {
  decode(body: Buffer): ServerLoginResponse38000 {
    const r             = new BinaryReader(body);
    const resultCode    = r.readUInt32BE();
    const securityToken = r.readUInt32BE();
    const accountId     = r.readUInt32BE();
    const ucgmTag       = r.readUInt32BE();
    return { resultCode, securityToken, accountId, ucgmTag };
  },

  encode(model: ServerLoginResponse38000): Buffer {
    const w = new BinaryWriter();
    w.writeUInt32BE(model.resultCode);
    w.writeUInt32BE(model.securityToken);
    w.writeUInt32BE(model.accountId);
    w.writeUInt32BE(model.ucgmTag);
    return w.toBuffer();
  },
};
