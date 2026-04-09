# SERVER_CHARACTER_DATA (0x00038002)

## Status

🟢 COMPLETE

## Direction

Login Server → Client

## Summary

Sent after `0x00038001`, one packet per character on the account (up to two). Contains the full character data needed to populate the character selection screen — identity, appearance, stats, skills, containers, position, and equipment. This is the largest packet in the login flow (~597 bytes body).

The server sends one packet per character. Each packet is self-contained and references its own character via the character ID embedded throughout as a section delimiter.

---

## Capture Metadata

| Field      | Value               |
| ---------- | ------------------- |
| Opcode     | 0x00038002          |
| Sequence   | 3 (first char), 4 (second char) |
| SysMessage | 0x00000000          |
| Direction  | LoginServerToClient |

---

## Header

Standard 64-byte UCGO packet header. `BlowfishSize` = 600, `XORSize` = 597.

---

## Body Structure

### Identity Header (offsets 0x000–0x00C)

| Offset | Size | Type   | Description |
| ------ | ---- | ------ | ----------- |
| 0x000  | 1    | byte   | Always `0x00` |
| 0x001  | 1    | byte   | Always `0x02` |
| 0x002  | 4    | uint32 | Account ID (BE) |
| 0x006  | 4    | uint32 | Character ID (BE) |
| 0x00A  | 1    | byte   | Gender: `0x01`=Female, `0x02`=Male |
| 0x00B  | 1    | byte   | Always `0x00` |
| 0x00C  | 1    | byte   | Faction: `0x01`=Zeon, `0x02`=Earth Federation |

---

### Appearance Block (offsets 0x00D–0x049)

The Norwegian server source marks this entire section as wrong and unknown: *"THIS IS WRONG! USE OF DATA IS UNKNOWN."* All values are hardcoded placeholders. Face, hair, and skin appear later in the clothing section.

| Offset | Size | Value | Note |
| ------ | ---- | ----- | ---- |
| 0x00D  | 1    | `0x8F` | Section marker |
| 0x00E  | 2    | `0x0000` | Hardcoded |
| 0x010  | 12   | `0xFF` × 12 | Three `writeIntBE(-1)` |
| 0x01C  | 2    | `0xFF` × 2 | Two `writeByte(-1)` |
| 0x01E  | 3    | `0x00` × 3 | Hardcoded zeros |
| 0x021  | 3    | `0x00` × 3 | Hardcoded zeros |
| 0x024  | 26   | `0x00` × 26 | Hardcoded zeros |
| 0x03E  | 3    | `0x00` × 3 | Hardcoded zeros |
| 0x041  | 9    | `0x00` × 9 | Hardcoded zeros |

---

### Rank and Name (offset 0x04A)

| Offset | Size     | Type     | Description |
| ------ | -------- | -------- | ----------- |
| 0x04A  | 4        | uint32   | Character rank (BE). `0` for new characters. |
| 0x04E  | 1        | byte     | `0x80 \| name_char_count` |
| 0x04F  | name×2   | UTF-16LE | Character name (no null terminator) |

---

### Create Time and Score (follows name)

| Size | Type   | Description |
| ---- | ------ | ----------- |
| 4    | uint32 | Creation timestamp — Unix epoch seconds (BE) |
| 1    | byte   | `0x8A` — section marker (`0x80\|10` = 10 values follow) |
| 4    | uint32 | Score |
| 4    | uint32 | Losses |
| 4    | uint32 | Score 2 (always 0) |
| 4    | uint32 | Losses 2 (always 0) |
| 4    | uint32 | Criminal flag (always 0) |
| 4    | uint32 | Unknown (always 0) |
| 4    | uint32 | Score 3 (always 0) |
| 4    | uint32 | Losses 3 (always 0) |
| 4    | uint32 | Score 4 (always 0) |
| 4    | uint32 | Losses 4 (always 0) |

---

### Container List

| Size | Type  | Description |
| ---- | ----- | ----------- |
| 1    | byte  | `0x80` — hardcoded |
| 1    | byte  | `0x8B` — section marker (`0x80\|11` = 11 containers) |

Then 11 container records of 8 bytes each: `[container_id: uint32 BE][capacity: uint32 BE]`

| Container    | ID = char_id + | Capacity |
| ------------ | -------------- | -------- |
| Backpack     | `0x01`         | `0x14`   |
| Weared       | `0x02`         | `0x14`   |
| Bank         | `0x03`         | `0x14`   |
| Money        | `0x04`         | `0x13`   |
| Hangar       | `0x05`         | `0x14`   |
| Self Storage | `0x06`         | `0x14`   |
| House        | `0x07`         | `0x14`   |
| Productive   | `0x08`         | `0x14`   |
| Real Estate  | `0x09`         | `0x14`   |
| Swap Pack    | `0x0A`         | `0x14`   |
| Credit       | `0x0B`         | `0x13`   |

---

### Medals

| Size | Type   | Description |
| ---- | ------ | ----------- |
| 1    | byte   | `0x82` — section marker (`0x80\|2`) |
| 4    | uint32 | Richmond medal count (BE) |
| 4    | uint32 | Newman medal count (BE) |

Medal thresholds: 10=1 medal, 100=2 medals, 1000=3 medals, 2000=4 medals.

---

### Section Delimiter Pattern

From this point, every section begins with the character ID as a delimiter:

```
[char_id: 4 bytes BE][section_index: 1 byte][section_marker: 1 byte]
```

---

### Combat Skills

| Size | Type   | Description |
| ---- | ------ | ----------- |
| 4    | uint32 | Character ID delimiter |
| 1    | byte   | `0x00` — section index |
| 1    | byte   | `0x95` — section marker (`0x80\|21` = 21 skill values) |
| 84   | uint32 × 21 | Skill values (see encoding below) |

Skills in order:

| # | Skill |
| - | ----- |
| 0  | Mobile Suit |
| 1  | Critical / Mobile Armour |
| 2  | `0` — unused |
| 3  | Near Dodge / Fighter |
| 4  | Ranged Engagement / Space |
| 5  | Engagement / Ground |
| 6  | `0` — unused |
| 7  | Near Engagement / Air |
| 8  | Beam Cartridge Weapon |
| 9  | Shell Firing Weapon |
| 10 | `0` — unused |
| 11 | Weapon Manipulation |
| 12 | Shooting |
| 13 | Sniping |
| 14 | CQB |
| 15 | Hand to Hand Combat |
| 16 | Tactics |
| 17 | AMBAC |
| 18 | Defence |
| 19 | Far Dodge / Evasion |
| 20 | Emergency Repair |

---

### Crafting Skills — Group 1

| Size | Type   | Description |
| ---- | ------ | ----------- |
| 4    | uint32 | Character ID delimiter |
| 1    | byte   | `0x01` — section index |
| 1    | byte   | `0x87` — section marker (`0x80\|7` = 7 values) |

| # | Skill |
| - | ----- |
| 0 | Mining |
| 1 | Refinery |
| 2 | MS/MA Construction |
| 3 | Battleship Construction |
| 4 | Arms Construction |
| 5 | `0` — unused |
| 6 | `0` — unused |

---

### Crafting Skills — Group 2

| Size | Type   | Description |
| ---- | ------ | ----------- |
| 4    | uint32 | Character ID delimiter |
| 1    | byte   | `0x02` — section index |
| 1    | byte   | `0x8A` — section marker (`0x80\|10` = 10 values) |

| # | Skill |
| - | ----- |
| 0–4 | `0` — unused |
| 5   | Clothing Manufacturing |
| 6–9 | `0` — unused |

---

### Unknown Section

| Size | Type   | Description |
| ---- | ------ | ----------- |
| 4    | uint32 | Character ID delimiter |
| 1    | byte   | `0x03` — section index. Source note: *"Strange. Set to 0 or 1 and the client will disable several skills."* |
| 1    | byte   | `0x85` — section marker (`0x80\|5` = 5 values) |
| 20   | bytes  | `0x00000000` × 5 — all zero |

---

### Base Attributes

| Size | Type   | Description |
| ---- | ------ | ----------- |
| 4    | uint32 | Character ID delimiter |
| 1    | byte   | `0x83` — section marker (`0x80\|3` = 3 attributes + sum) |
| 4    | uint32 | Strength (skill encoding) |
| 4    | uint32 | Spirit (skill encoding) |
| 4    | uint32 | Luck (skill encoding) |
| 4    | uint32 | Attribute sum: `(str & 0x0FFFFFFF) + (spr & 0x0FFFFFFF) + (lck & 0x0FFFFFFF)` |

---

### Clothing and Appearance

| Size | Type   | Description |
| ---- | ------ | ----------- |
| 4    | uint32 | Character ID delimiter |
| 1    | byte   | `0x00` — hardcoded |
| 1    | byte   | `0x01` — section index |
| 1    | byte   | Gender (repeated): `0x01`=Female, `0x02`=Male |
| 1    | byte   | `0x94` — clothing section marker |

**Default clothing** (new character / no equipment):

| Size | Type   | Description |
| ---- | ------ | ----------- |
| 4    | uint32 | Faction clothing: Zeon=`0x00000000`, EF=`0x00100000` |
| 20   | bytes  | `0xFFFFFFFF` × 5 — five empty equipment slots |

**Face and hair** (follows clothing):

| Size | Type   | Description |
| ---- | ------ | ----------- |
| 4    | uint32 | `0x00000000` — source: *"cuts off body parts"* if non-zero |
| 1    | byte   | Face type index (0-based, from character creation) |
| 2    | bytes  | `0x0000` — hardcoded |
| 1    | byte   | Hair style index (0-based) |
| 1    | byte   | Hair color index (0-based) |
| 27   | bytes  | `0x00` × 27 — hardcoded zeros |

**Note:** Skin color encoding is unknown and is not written by the Norwegian server.

---

### Mobile Suit / Vehicle

For dismounted characters (no active vehicle):

| Size | Type   | Description |
| ---- | ------ | ----------- |
| 4    | uint32 | `0xFFFFFFFF` — no vehicle |
| 4    | uint32 | `0xFFFFFFFF` — no vehicle |
| 1    | byte   | `0x82` |
| 4    | uint32 | `0x00000000` |
| 4    | uint32 | `0x00000000` |
| 1    | byte   | `0x82` |
| 1    | byte   | `0x00` |
| 1    | byte   | `0x00` |

---

### Position Footer

| Size | Type   | Description |
| ---- | ------ | ----------- |
| 1    | byte   | `0x80` — hardcoded |
| 2    | bytes  | `0x0000` — hardcoded |
| 4    | uint32 | Character ID — final delimiter |
| 1    | byte   | `0x00` — hardcoded |
| 1    | byte   | Zone ID |
| 4    | int32  | X coordinate (BE) |
| 4    | int32  | Y coordinate (BE) |
| 4    | int32  | Z coordinate (BE) |
| 2    | int16  | Tilt (BE) |
| 2    | int16  | Roll (BE) |
| 2    | int16  | Direction / heading (BE) |
| 4    | int32  | `0xFFFFFFFF` |
| 4    | int32  | `0xFFFFFFFF` |
| 2    | int16  | `0xFFFF` |
| 4    | uint32 | `0x00000000` |
| 4    | uint32 | `0x00000000` |
| 4    | uint32 | `0x00000000` |

### Starting Position Reference

| Location       | Zone | X          | Y           | Z    | Direction |
| -------------- | ---- | ---------- | ----------- | ---- | --------- |
| Sydney         | 1    | 72536537   | -59308704   | 311  | -1518     |
| Perth          | 1    | 55469796   | -58348671   | 39   | 15487     |
| Canberra       | 1    | 71572874   | -60098021   | 2435 | -17575    |
| Adelaide       | 1    | 66390755   | -59786294   | 35   | -14090    |
| Melbourne      | 1    | 69404973   | -61194815   | 1899 | 1714      |
| Darwin         | 1    | 62637658   | -49079842   | 39   | 4291      |
| Brisbane       | 1    | 73447582   | -56285669   | 200  | 0         |
| Southern Cross | 1    | 57289989   | -58213606   | 1750 | -25778    |

---

## Skill Value Encoding

All skill and attribute values use the same 32-bit encoding:

```typescript
// Encode
const encoded = skillLevel + (skillDirection << 28)

// Decode
const level     = encoded & 0x0FFFFFFF
const direction = (encoded >>> 28) & 0xF
```

`direction` encodes the skill's progression state.

---

## Unknowns / Open Questions

- Skin color — field location and encoding unknown; not written by the Norwegian server
- The `0x03` section byte comment ("disables several skills") — exact client-side effect unknown
- The `0x00000000` field before face type — what non-zero values do and what they encode
- Full weared container clothing data format when character has existing equipment