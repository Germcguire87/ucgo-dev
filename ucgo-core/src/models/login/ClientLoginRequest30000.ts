/**
 * CLIENT_LOGIN_REQUEST (0x00030000)
 *
 * Body layout (offsets relative to start of decrypted body):
 *   0     1      0x80 | username char count
 *   1     n*2    Username (UTF-16LE, n chars, no null terminator)
 *   1+n*2 4      Client version (BE uint32, always 0x000010A9 observed)
 *   5+n*2 1      0x80 | encrypted password byte length
 *   6+n*2 m      UCGOblowfish-encrypted password
 *
 * Note: there is NO separate null terminator between username and clientVersion.
 * The two 0x00 bytes visible in captures are the high bytes of clientVersion 0x000010A9.
 *
 * The encrypted password is produced by loginPasswordCrypto.encryptLoginPassword().
 */

import { BinaryReader } from "../../binary/BinaryReader.js";
import { BinaryWriter } from "../../binary/BinaryWriter.js";
import { UcgoDecodeError } from "../../utils/errors.js";

export interface ClientLoginRequest30000 {
  /** 0x80 | charCount — raw byte from wire */
  usernameLengthMarker: number;
  username: string;
  /** Always 0x000010A9 observed */
  clientVersion: number;
  /** 0x80 | ciphertext.length — raw byte from wire */
  payloadSizeMarker: number;
  /** UCGOblowfish ciphertext of the password — decrypt with loginPasswordCrypto */
  encryptedPassword: Buffer;
}

export const ClientLoginRequest30000Codec = {
  decode(body: Buffer): ClientLoginRequest30000 {
    const r = new BinaryReader(body);

    const usernameLengthMarker = r.readUInt8();
    const charCount            = usernameLengthMarker & 0x7f;
    const username      = r.readUtf16LE(charCount);
    const clientVersion = r.readUInt32BE();

    const payloadSizeMarker  = r.readUInt8();
    const payloadByteLength  = payloadSizeMarker & 0x7f;

    if (r.remaining() < payloadByteLength) {
      throw new UcgoDecodeError(
        `ClientLoginRequest30000: expected ${payloadByteLength} encrypted bytes, ` +
          `got ${r.remaining()}`,
      );
    }
    const encryptedPassword = r.readBytes(payloadByteLength);

    return { usernameLengthMarker, username, clientVersion, payloadSizeMarker, encryptedPassword };
  },

  encode(model: ClientLoginRequest30000): Buffer {
    const w = new BinaryWriter();
    w.writeUInt8(model.usernameLengthMarker);
    w.writeUtf16LE(model.username);
    w.writeUInt32BE(model.clientVersion);
    w.writeUInt8(model.payloadSizeMarker);
    w.writeBytes(model.encryptedPassword);
    return w.toBuffer();
  },
};
