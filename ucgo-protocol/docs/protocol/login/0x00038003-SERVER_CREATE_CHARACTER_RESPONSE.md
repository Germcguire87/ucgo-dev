# SERVER_CREATE_CHARACTER_RESPONSE (0x00038003)

## Status

🟡 PARTIAL (STRUCTURE KNOWN, FIELD MEANINGS PARTIALLY UNKNOWN)

## Direction

Login Server → Client

## Summary

Response to `0x00030003`. Sent after the server attempts to create a new character. Contains the new character's ID on success, or all-`0xFF` sentinel values on failure.

---

## Capture Metadata

| Field      | Value               |
| ---------- | ------------------- |
| Opcode     | 0x00038003          |
| Sequence   | varies              |
| SysMessage | 0x00000000          |
| Direction  | LoginServerToClient |

---

## Body Structure

### Success Variant (28 bytes)

| Offset | Size | Type   | Description                                     |
| ------ | ---- | ------ | ----------------------------------------------- |
| 0x40   | 4    | uint32 | `0x00040002` — success indicator constant (BE)  |
| 0x44   | 8    | bytes  | `0x0000000000000000` — always zero              |
| 0x4C   | 4    | uint32 | New character ID (BE)                           |
| 0x50   | 8    | bytes  | `0x0000000000000000` — always zero              |
| 0x58   | 4    | uint32 | `0x00000000`                                    |

### Raw bytes (success):
```
00 04 00 02   success constant
00 00 00 00 00 00 00 00   zeros
XX XX XX XX   character ID
00 00 00 00 00 00 00 00   zeros
00 00 00 00
```

### Failure Variant (28 bytes)

| Offset | Size | Type   | Description              |
| ------ | ---- | ------ | ------------------------ |
| 0x40   | 4    | int32  | `-1` = `0xFFFFFFFF` (BE) |
| 0x44   | 8    | bytes  | `0xFFFFFFFFFFFFFFFF`     |
| 0x4C   | 4    | int32  | `-1` = `0xFFFFFFFF` (BE) |
| 0x50   | 8    | bytes  | `0xFFFFFFFFFFFFFFFF`     |
| 0x58   | 4    | int32  | `-1` = `0xFFFFFFFF` (BE) |

---

## Source Reference

From `Opcode0x30003.java` (success path):
```java
svar.writeIntBE(0x040002);
svar.writeLongBE(0x0L);
svar.writeIntBE(character.getCharacterID());
svar.writeLongBE(0x0L);
svar.writeIntBE(0x0);
```

---

## Unknowns / Open Questions

- Meaning of the `0x00040002` success constant — possibly a sub-opcode or state indicator
- Whether failure can occur for reasons other than `character == null` (e.g. name taken, max characters reached)
