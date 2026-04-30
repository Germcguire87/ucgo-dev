# 0x00008006 — RESPONSE_SIMPLE_PLAYER_INFO

## Status
🟢 Confirmed — Packet structure annotated from hex data; character name decoded from UTF-16LE string

## Direction
Game Server → Client

## Summary
Returns a compact player info record including the character's display name as a UTF-16LE string. The name field is length-prefixed using the protocol's high-bit length encoding (`0x80 | charCount`).

## Confidence
Medium-High (structure confirmed; name semantics clear from decoded string)

## Observed In Captures
- `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `movement_test.txt`, `very_small_rotation.txt`, `rotation_only.txt`, `initial_game_load_no_movement.txt`
- Sequence: 25 (mirrors request)
- Occurs: once per session

## Packet Structure

| Offset | Size     | Type    | Name         | Value (observed)     | Notes                                                                      |
|--------|----------|---------|--------------|----------------------|----------------------------------------------------------------------------|
| 0x00   | 4        | u32     | unk0         | `FF FF FF FF`        | Always `0xFFFFFFFF`; possibly a placeholder account/result field           |
| 0x04   | 4        | u32     | characterId  | e.g. `09 7F 45 A0`  | Character ID being described                                               |
| 0x08   | 2        | bytes   | unk1         | `00 01`              | Purpose unknown; may be a faction or sub-type field                        |
| 0x0A   | 1        | u8      | nameLen      | e.g. `8B`            | High-bit encoded string length: `0x80 \| charCount` (e.g. `0x8B` = 11 chars) |
| 0x0B   | variable | UTF-16LE| characterName| e.g. `41 00 6E 00…` | Character display name, **no null terminator** (length from nameLen)       |

**Total body size: variable** (11 + 2 × charCount bytes)

**Example**: character name "Another Guy" (11 chars) → body = 11 + 22 = 33 bytes (XORSize = 33, BlowfishSize = 40)

## String Length Encoding
`nameLen` uses the same high-bit length marker seen elsewhere in the UCGO protocol:
- `nameLen = 0x80 | charCount`
- The string that follows is `charCount × 2` bytes of UTF-16LE
- No null terminator is included; the string ends exactly at `offset 0x0B + charCount * 2`

Example: `nameLen = 0x8B` → `0x8B & 0x7F = 11` characters → 22 bytes of UTF-16LE follow

## Capture Example
From `tiny_move_forward.txt`, Packet 66, Sequence 25 — character name "Another Guy":
```
0040:   FF FF FF FF 09 7F 45 A0 00 01 8B 41 00 6E 00 6F   ......E....A.n.o
0050:   00 74 00 68 00 65 00 72 00 20 00 47 00 75 00 79   .t.h.e.r. .G.u.y
0060:   00                                                .
```

Decoded:
- `unk0` = `FF FF FF FF`
- `characterId` = `09 7F 45 A0`
- `unk1` = `00 01`
- `nameLen` = `8B` → 11 characters
- `characterName` = `41 00 6E 00 6F 00 74 00 68 00 65 00 72 00 20 00 47 00 75 00 79 00` → "Another Guy"

Wait — the bytes show `41 00 6E 00...` = UTF-16LE "A", "n", "o"... = "Another Guy" but the hex dump ends with `00` at 0x60 which is 33rd byte. The string is 11 chars × 2 = 22 bytes with nameLen omitting the null. Final byte at 0x60 = `00` is part of the last UTF-16LE char `79 00` = 'y'. The XORSize confirms 33 bytes total body.

## Flow Context
- Responds to 0x00000006 (REQUEST_SIMPLE_PLAYER_INFO) at sequence 25
- Followed immediately by 0x0000800A (RESPONSE_PLAYER_LOOKS_BUFF)
- Client likely uses this to display the player's own name in the UI

## Implementation Notes
- Encode `nameLen = 0x80 | (name.length)` where length is in Unicode characters, not bytes
- Write name as UTF-16LE without a null terminator; the client reads exactly `charCount * 2` bytes
- The `unk0 = 0xFFFFFFFF` and `unk1 = 0x0001` appear to be fixed values; replicate verbatim
- Body size varies with character name length; compute `XORSize = 11 + charCount * 2`

## Open Questions
- Exact semantics of `unk0 = 0xFFFFFFFF` (could be account ID, result code, or unused)
- Whether `unk1` encodes a faction, character class, or other attribute
