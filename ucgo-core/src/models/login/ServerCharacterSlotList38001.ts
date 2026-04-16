/**
 * SERVER_CHARACTER_SLOT_LIST (0x00038001)
 *
 * Body layout:
 *   0  4  accountId        (BE uint32)
 *   4  1  unknown          (always 0x00)
 *   5  1  0x80 | count     (character count, max 2)
 *   6  n  slot records     (16 bytes each, see CharacterSlotRecord)
 *
 * CharacterSlotRecord (16 bytes):
 *   0  4  accountId   (BE uint32) — repeated per slot
 *   4  4  characterId (BE uint32) — 0xFFFFFFFF if empty
 *   8  4  unknown1    (BE uint32) — always 0xFFFFFFFF observed
 *   12 4  unknown2    (BE uint32) — always 0xFFFFFFFF observed
 */

import { BinaryReader } from "../../binary/BinaryReader.js";
import { BinaryWriter } from "../../binary/BinaryWriter.js";

export interface CharacterSlotRecord {
  accountId: number;
  characterId: number;
  unknown1: number;
  unknown2: number;
}

export interface ServerCharacterSlotList38001 {
  accountId: number;
  /** Always 0x00 */
  unknown: number;
  /** 0x80 | characterCount — raw byte */
  countMarker: number;
  slots: CharacterSlotRecord[];
}

export const ServerCharacterSlotList38001Codec = {
  decode(body: Buffer): ServerCharacterSlotList38001 {
    const r           = new BinaryReader(body);
    const accountId   = r.readUInt32BE();
    const unknown     = r.readUInt8();
    const countMarker = r.readUInt8();
    // Cap count to the bytes actually present — some servers send a 6-byte
    // body for 0-character accounts where the last 2 bytes are a session token
    // rather than a meaningful countMarker.
    const countFromMarker = countMarker & 0x7f;
    const count = Math.min(countFromMarker, Math.floor(r.remaining() / 16));

    const slots: CharacterSlotRecord[] = [];
    for (let i = 0; i < count; i++) {
      slots.push({
        accountId:   r.readUInt32BE(),
        characterId: r.readUInt32BE(),
        unknown1:    r.readUInt32BE(),
        unknown2:    r.readUInt32BE(),
      });
    }

    return { accountId, unknown, countMarker, slots };
  },

  encode(model: ServerCharacterSlotList38001): Buffer {
    const w = new BinaryWriter();
    w.writeUInt32BE(model.accountId);
    w.writeUInt8(model.unknown);
    w.writeUInt8(model.countMarker);
    for (const slot of model.slots) {
      w.writeUInt32BE(slot.accountId);
      w.writeUInt32BE(slot.characterId);
      w.writeUInt32BE(slot.unknown1);
      w.writeUInt32BE(slot.unknown2);
    }
    return w.toBuffer();
  },
};
