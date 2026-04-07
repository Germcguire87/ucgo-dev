# SERVER_CHARACTER_SLOT_LIST (0x00038001)

## Status

🟢 COMPLETE

## Direction

Login Server → Client

## Summary

Sent immediately after a successful `0x00038000`. Lists the character slots available for the authenticated account. Each account has a maximum of two character slots. Empty slots are indicated by sentinel values. The client uses this to populate the character selection screen.

---

## Capture Metadata (Representative)

| Field      | Value               |
| ---------- | ------------------- |
| Opcode     | 0x00038001          |
| Sequence   | 2                   |
| SysMessage | 0x00000000          |
| Direction  | LoginServerToClient |

---

## Header

Standard 64-byte UCGO packet header. See `0x00030000` for field layout.

---

## Body Structure

The body is variable-length depending on how many characters exist. There are two variants: no characters, and with characters.

### No Characters Variant (6 bytes)

Observed for accounts with zero characters created.

| Offset | Size | Type   | Description                       |
| ------ | ---- | ------ | --------------------------------- |
| 0x40   | 4    | uint32 | Account ID (BE)                   |
| 0x44   | 1    | byte   | Always `0x00`                     |
| 0x45   | 1    | byte   | `0x80 \| character_count` = `0x80` (0 chars) |

### Raw bytes (no characters):
```
01 45 D7 C2   account ID
00            unknown
80            0x80 | 0 = no characters
```

---

### With Characters Variant

Each character slot is a fixed 16-byte record appended after the header fields.

| Offset | Size | Type   | Description                                          |
| ------ | ---- | ------ | ---------------------------------------------------- |
| 0x40   | 4    | uint32 | Account ID (BE)                                      |
| 0x44   | 1    | byte   | Always `0x00`                                        |
| 0x45   | 1    | byte   | `0x80 \| character_count`                            |
| 0x46   | var  | array  | Character slot records (16 bytes each, see below)    |

#### Character Slot Record (16 bytes per slot)

| Offset | Size | Type   | Description                                                        |
| ------ | ---- | ------ | ------------------------------------------------------------------ |
| +0x00  | 4    | uint32 | Account ID (BE) — repeated per slot                                |
| +0x04  | 4    | uint32 | Character ID (BE) — `0xFFFFFFFF` if slot is empty                  |
| +0x08  | 4    | uint32 | Unknown — `0xFFFFFFFF` in all observed captures                    |
| +0x0C  | 4    | uint32 | Unknown — `0xFFFFFFFF` in all observed captures                    |

### Raw bytes (2 characters, account `0x00033E3C`, chars `0x0000BE2E` and `0x000097D6`):
```
00 03 3E 3C   account ID
00            unknown
82            0x80 | 2 = two characters

00 03 3E 3C   account ID (slot 0)
00 00 BE 2E   character ID (slot 0)
FF FF FF FF   unknown
FF FF FF FF   unknown

00 03 3E 3C   account ID (slot 1)
00 00 97 D6   character ID (slot 1)
FF FF FF FF   unknown
FF FF FF FF   unknown
```

---

## Character Count Field

The byte at offset 0x45 encodes the character count in its lower 7 bits with the high bit always set:

| Characters | Byte value |
| ---------- | ---------- |
| 0          | `0x80`     |
| 1          | `0x81`     |
| 2          | `0x82`     |

Maximum observed: 2 characters per account.

---

## Character IDs

Character IDs from this packet are used in `0x00038002` (character data) and in `0x00030004` (character deletion). They are the primary identifier for a character throughout the login flow and into the game server.

---

## Login Flow Position

```
1. Client → Server   0x00030000   Login request
2. Client → Server   0x00030001   Account ID echo
3. Server → Client   0x00038000   Login response (success)
4. Server → Client   0x00038001   ← this packet
5. Server → Client   0x00038002   Character data (one packet per character)
```

---

## Source Reference

From `Opcode0x30001.java` (Norwegian server):

```java
svar.writeIntBE(p.getAccountID());
svar.writeByte((byte) 0x0);
svar.writeByte((byte) (antall_chars | 0x80));

for (int c = 0; c < antall_chars; c++) {
    svar.writeIntBE(p.getAccountID());
    svar.writeIntBE(chars[c]);          // character ID
    svar.writeIntBE(0xFFFFFFFF);
    svar.writeIntBE(0xFFFFFFFF);
}
```

---

## Unknowns / Open Questions

- Purpose of the `0x00` byte at offset 0x44
- Purpose of the two `0xFFFFFFFF` fields in each character slot record — possibly reserved for future use or used by the original server for additional data
