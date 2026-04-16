/**
 * SERVER_CHARACTER_DATA (0x00038002)
 *
 * ~597 bytes body. One packet sent per character on the account.
 * See ucgo-protocol/docs/protocol/login/0x00038002-SERVER_CHARACTER_DATA.md
 * for the full field-by-field spec.
 *
 * The encoder builds the exact byte sequence the Norwegian server produces.
 * Unknown/hardcoded fields are preserved faithfully so the client renders
 * the character selection screen correctly.
 */

import { BinaryReader } from "../../binary/BinaryReader.js";
import { BinaryWriter } from "../../binary/BinaryWriter.js";

// ── Skill value encoding ────────────────────────────────────────────────────
// encoded = level + (direction << 28)

export function encodeSkillValue(level: number, direction = 0): number {
  return (level & 0x0fffffff) | ((direction & 0xf) << 28);
}

export function decodeSkillValue(encoded: number): { level: number; direction: number } {
  return {
    level:     encoded & 0x0fffffff,
    direction: (encoded >>> 28) & 0xf,
  };
}

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface CharacterPosition {
  zoneId: number;
  x: number;
  y: number;
  z: number;
  tilt: number;
  roll: number;
  direction: number;
}

export interface ServerCharacterData38002 {
  accountId: number;
  characterId: number;
  /** 0x01 = Female, 0x02 = Male */
  gender: number;
  /** 0x01 = Zeon, 0x02 = Earth Federation */
  faction: number;
  rank: number;
  name: string;
  createdAt: number;        // Unix epoch seconds
  score: number;
  losses: number;
  /** 21 encoded skill values — combat skills */
  combatSkills: number[];
  /** 7 encoded skill values — crafting group 1 */
  craftingSkills1: number[];
  /** 10 encoded skill values — crafting group 2 */
  craftingSkills2: number[];
  /** Strength (encoded) */
  strength: number;
  /** Spirit (encoded) */
  spirit: number;
  /** Luck (encoded) */
  luck: number;
  faceIndex: number;
  hairStyle: number;
  hairColor: number;
  position: CharacterPosition;
}

// ── Container capacities (hardcoded per Norwegian server) ────────────────────

const CONTAINER_CAPACITIES: number[] = [
  0x14, // Backpack
  0x14, // Weared
  0x14, // Bank
  0x13, // Money
  0x14, // Hangar
  0x14, // Self Storage
  0x14, // House
  0x14, // Productive
  0x14, // Real Estate
  0x14, // Swap Pack
  0x13, // Credit
];

export const ServerCharacterData38002Codec = {
  encode(c: ServerCharacterData38002): Buffer {
    const w = new BinaryWriter();
    const cid = c.characterId;

    // ── Identity header (0x000–0x00C) ──────────────────────────────────────
    w.writeUInt8(0x00);
    w.writeUInt8(0x02);
    w.writeUInt32BE(c.accountId);
    w.writeUInt32BE(cid);
    w.writeUInt8(c.gender);
    w.writeUInt8(0x00);
    w.writeUInt8(c.faction);

    // ── Appearance block (0x00D–0x049) — hardcoded unknowns ────────────────
    w.writeUInt8(0x8f);
    w.writeUInt16BE(0x0000);
    w.writeInt32BE(-1); w.writeInt32BE(-1); w.writeInt32BE(-1);  // 12 bytes FF
    w.writeUInt8(0xff); w.writeUInt8(0xff);                      // 2 bytes FF
    w.writePadding(3);  // 0x00 × 3
    w.writePadding(3);  // 0x00 × 3
    w.writePadding(26); // 0x00 × 26
    w.writePadding(3);  // 0x00 × 3
    w.writePadding(9);  // 0x00 × 9

    // ── Rank and name (0x04A) ───────────────────────────────────────────────
    w.writeUInt32BE(c.rank);
    const nameBuf = Buffer.from(c.name, "utf16le");
    w.writeUInt8(0x80 | (nameBuf.length / 2));
    w.writeBytes(nameBuf);

    // ── Create time + score section (0x8A = 0x80|10, 10 values) ────────────
    w.writeUInt32BE(c.createdAt);
    w.writeUInt8(0x8a);
    w.writeUInt32BE(c.score);
    w.writeUInt32BE(c.losses);
    w.writePadding(4 * 8); // 8 remaining uint32s, all zero

    // ── Container list ──────────────────────────────────────────────────────
    w.writeUInt8(0x80);
    w.writeUInt8(0x8b); // 0x80 | 11 = 11 containers
    for (let i = 0; i < 11; i++) {
      w.writeUInt32BE(cid + i + 1);                 // container ID
      w.writeUInt32BE(CONTAINER_CAPACITIES[i]!);    // capacity
    }

    // ── Medals ─────────────────────────────────────────────────────────────
    w.writeUInt8(0x82); // 0x80 | 2
    w.writeUInt32BE(0); // Richmond medals
    w.writeUInt32BE(0); // Newman medals

    // ── Combat skills (section 0x00) ────────────────────────────────────────
    w.writeUInt32BE(cid);
    w.writeUInt8(0x00);
    w.writeUInt8(0x95); // 0x80 | 21
    for (let i = 0; i < 21; i++) {
      w.writeUInt32BE(c.combatSkills[i] ?? 0);
    }

    // ── Crafting skills group 1 (section 0x01) ───────────────────────────────
    w.writeUInt32BE(cid);
    w.writeUInt8(0x01);
    w.writeUInt8(0x87); // 0x80 | 7
    for (let i = 0; i < 7; i++) {
      w.writeUInt32BE(c.craftingSkills1[i] ?? 0);
    }

    // ── Crafting skills group 2 (section 0x02) ───────────────────────────────
    w.writeUInt32BE(cid);
    w.writeUInt8(0x02);
    w.writeUInt8(0x8a); // 0x80 | 10
    for (let i = 0; i < 10; i++) {
      w.writeUInt32BE(c.craftingSkills2[i] ?? 0);
    }

    // ── Unknown section 0x03 ────────────────────────────────────────────────
    w.writeUInt32BE(cid);
    w.writeUInt8(0x03);
    w.writeUInt8(0x85); // 0x80 | 5
    w.writePadding(20); // 5 × uint32 zeros

    // ── Base attributes ─────────────────────────────────────────────────────
    w.writeUInt32BE(cid);
    w.writeUInt8(0x83); // 0x80 | 3
    w.writeUInt32BE(c.strength);
    w.writeUInt32BE(c.spirit);
    w.writeUInt32BE(c.luck);
    // attribute sum (lower 28 bits of each)
    const attrSum =
      (c.strength & 0x0fffffff) +
      (c.spirit   & 0x0fffffff) +
      (c.luck     & 0x0fffffff);
    w.writeUInt32BE(attrSum);

    // ── Clothing and appearance ─────────────────────────────────────────────
    w.writeUInt32BE(cid);
    w.writeUInt8(0x00);
    w.writeUInt8(0x01);
    w.writeUInt8(c.gender);
    w.writeUInt8(0x94); // clothing section marker

    // Default faction clothing
    const factionClothing = c.faction === 0x01 ? 0x00000000 : 0x00100000;
    w.writeUInt32BE(factionClothing);
    // 5 empty equipment slots
    for (let i = 0; i < 5; i++) w.writeInt32BE(-1);

    // Face and hair
    w.writeUInt32BE(0x00000000); // "cuts off body parts" if non-zero
    w.writeUInt8(c.faceIndex);
    w.writeUInt16BE(0x0000);
    w.writeUInt8(c.hairStyle);
    w.writeUInt8(c.hairColor);
    w.writePadding(27);

    // ── Mobile suit / vehicle (dismounted) ─────────────────────────────────
    w.writeInt32BE(-1); w.writeInt32BE(-1);
    w.writeUInt8(0x82);
    w.writeUInt32BE(0); w.writeUInt32BE(0);
    w.writeUInt8(0x82);
    w.writeUInt8(0x00); w.writeUInt8(0x00);

    // ── Position footer ─────────────────────────────────────────────────────
    w.writeUInt8(0x80);
    w.writeUInt16BE(0x0000);
    w.writeUInt32BE(cid);
    w.writeUInt8(0x00);
    w.writeUInt8(c.position.zoneId);
    w.writeInt32BE(c.position.x);
    w.writeInt32BE(c.position.y);
    w.writeInt32BE(c.position.z);
    w.writeInt16BE(c.position.tilt);
    w.writeInt16BE(c.position.roll);
    w.writeInt16BE(c.position.direction);
    w.writeInt32BE(-1); w.writeInt32BE(-1);
    w.writeInt16BE(-1);
    w.writeUInt32BE(0); w.writeUInt32BE(0); w.writeUInt32BE(0);

    return w.toBuffer();
  },

  /**
   * Decode is a best-effort parse of this large packet.
   * The Norwegian server's appearance block is explicitly marked "THIS IS WRONG"
   * so we skip it and read only the well-specified fields.
   */
  decode(body: Buffer): ServerCharacterData38002 {
    const r = new BinaryReader(body);

    // Identity header
    r.skip(1);                         // 0x00
    r.skip(1);                         // 0x02
    const accountId   = r.readUInt32BE();
    const characterId = r.readUInt32BE();
    const gender      = r.readUInt8();
    r.skip(1);                         // 0x00
    const faction     = r.readUInt8();

    // Appearance block (fixed 61 bytes — hardcoded unknowns)
    r.skip(61);

    // Rank and name
    const rank        = r.readUInt32BE();
    const nameMarker  = r.readUInt8();
    const nameLen     = nameMarker & 0x7f;
    const name        = r.readUtf16LE(nameLen);

    // Create time + score section
    const createdAt   = r.readUInt32BE();
    r.skip(1);                          // 0x8A marker
    const score       = r.readUInt32BE();
    const losses      = r.readUInt32BE();
    r.skip(4 * 8);                      // remaining zeros

    // Container list
    r.skip(1);  // 0x80
    r.skip(1);  // 0x8B
    r.skip(11 * 8); // 11 container records

    // Medals
    r.skip(1);  // 0x82
    r.skip(8);  // 2 medal counts

    // Combat skills
    r.skip(4);  // char ID delimiter
    r.skip(1);  // section index 0x00
    r.skip(1);  // 0x95
    const combatSkills: number[] = [];
    for (let i = 0; i < 21; i++) combatSkills.push(r.readUInt32BE());

    // Crafting skills group 1
    r.skip(4); r.skip(1); r.skip(1);
    const craftingSkills1: number[] = [];
    for (let i = 0; i < 7; i++) craftingSkills1.push(r.readUInt32BE());

    // Crafting skills group 2
    r.skip(4); r.skip(1); r.skip(1);
    const craftingSkills2: number[] = [];
    for (let i = 0; i < 10; i++) craftingSkills2.push(r.readUInt32BE());

    // Unknown section
    r.skip(4); r.skip(1); r.skip(1); r.skip(20);

    // Base attributes
    r.skip(4);  // char ID delimiter
    r.skip(1);  // 0x83
    const strength = r.readUInt32BE();
    const spirit   = r.readUInt32BE();
    const luck     = r.readUInt32BE();
    r.skip(4);  // attribute sum

    // Clothing and appearance
    r.skip(4);  // char ID delimiter
    r.skip(1);  // 0x00
    r.skip(1);  // 0x01
    r.skip(1);  // gender repeated
    r.skip(1);  // 0x94
    r.skip(4);  // faction clothing
    r.skip(20); // 5 equipment slots
    r.skip(4);  // 0x00000000
    const faceIndex = r.readUInt8();
    r.skip(2);  // 0x0000
    const hairStyle = r.readUInt8();
    const hairColor = r.readUInt8();
    r.skip(27);

    // Mobile suit (dismounted)
    r.skip(8);  // 2 × 0xFFFFFFFF
    r.skip(1);  // 0x82
    r.skip(8);  // 2 × 0x00000000
    r.skip(1);  // 0x82
    r.skip(2);  // 0x00 0x00

    // Position footer
    r.skip(1);  // 0x80
    r.skip(2);  // 0x0000
    r.skip(4);  // char ID delimiter
    r.skip(1);  // 0x00
    const zoneId    = r.readUInt8();
    const x         = r.readInt32BE();
    const y         = r.readInt32BE();
    const z         = r.readInt32BE();
    const tilt      = r.readInt16BE();
    const roll      = r.readInt16BE();
    const direction = r.readInt16BE();

    return {
      accountId, characterId, gender, faction,
      rank, name, createdAt, score, losses,
      combatSkills, craftingSkills1, craftingSkills2,
      strength, spirit, luck,
      faceIndex, hairStyle, hairColor,
      position: { zoneId, x, y, z, tilt, roll, direction },
    };
  },
};
