# CLIENT_DELETE_CHARACTER (0x00030004)

## Status

🟢 COMPLETE

## Direction

Client → Login Server

## Summary

Sent when the player deletes a character from the character selection screen. The server validates that the character belongs to the authenticated account before deleting it.

---

## Capture Metadata

| Field      | Value               |
| ---------- | ------------------- |
| Opcode     | 0x00030004          |
| Sequence   | varies              |
| SysMessage | 0x00000000          |
| Direction  | clientToLoginServer |

---

## Body Structure (8 bytes)

| Offset | Size | Type   | Description                                              |
| ------ | ---- | ------ | -------------------------------------------------------- |
| 0x40   | 4    | uint32 | Character ID to delete (BE)                              |
| 0x44   | 4    | uint32 | Account ID (BE) — validated against authenticated session |

---

## Server Validation

```java
int character_id = pd.readIntBE();
if (p.getAccountID() == pd.readIntBE()) {
    // verify character belongs to this account
    GameCharacter gc = ManageCharacters.getGameCharacter(character_id);
    if (gc.getKonto().getAccountID() != p.getAccountID()) {
        // reject — character doesn't belong to account
        return;
    }
    // delete character
}
```

---

## Source Reference

From `Opcode0x30004.java`.

---

# SERVER_DELETE_CHARACTER_RESPONSE (0x00038004)

## Status

🟢 COMPLETE

## Direction

Login Server → Client

## Summary

Response to `0x00030004`. Confirms character deletion or signals an error.

---

## Body Structure

### Success Variant (28 bytes)

| Offset | Size | Type   | Description                       |
| ------ | ---- | ------ | --------------------------------- |
| 0x40   | 4    | uint32 | `0x00050002` — success constant   |
| 0x44   | 24   | bytes  | `0x00` × 24 — all zeros           |

### Failure Variant (4 bytes)

| Offset | Size | Type   | Description              |
| ------ | ---- | ------ | ------------------------ |
| 0x40   | 4    | int32  | `-1` = `0xFFFFFFFF`      |

---

## Source Reference

From `Opcode0x30004.java` (success path):
```java
svar.writeIntBE(0x050002);
svar.writeByteMultiple((byte) 0x0, 24);
```

---

## Unknowns / Open Questions

- Meaning of the `0x00050002` success constant
- Whether additional error codes exist beyond the `-1` failure case
