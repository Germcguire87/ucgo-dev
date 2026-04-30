# 0x00000070 — REQUEST_OCCUPATION_CITY_INFO_LIST

## Status
🟢 Confirmed — Packet structure annotated from hex data; consistent across all captures

## Direction
Client → Game Server

## Summary
Client requests the current territory occupation state for all cities/zones. Sent twice during bootstrap — once before and once after REQUEST_REGIST_COORD_MGR (0x00000000). Both instances are identical in body content; the server responds to each with a full copy of the occupation list.

## Confidence
Medium-High (name derived from private server opcode registry; body structure confirmed from captures)

## Observed In Captures
- `tiny_move_forward.txt`, `no_movement_pure_idle.txt`, `movement_test.txt`, `very_small_rotation.txt`, `rotation_only.txt`, `initial_game_load_no_movement.txt`
- Sequences: 21 and 24 (both occurrences per session)
- Both instances have **identical body bytes**

## Packet Structure

| Offset | Size | Type  | Name        | Value (observed) | Notes                                                     |
|--------|------|-------|-------------|------------------|-----------------------------------------------------------|
| 0x00   | 4    | u32   | unk0        | `00 00 00 00`    | Always zero; may be a filter or region ID                 |
| 0x04   | 4    | u32   | characterId | e.g. `09 7F 45 A0` | Requesting player's character ID                        |
| 0x08   | 1    | u8    | unk1        | `FF`             | Always `0xFF` in all captures                             |

**Total body size: 9 bytes** (XORSize = 9, BlowfishSize = 16)

## Capture Example
From `tiny_move_forward.txt`, Packet 21, Sequence 21:
```
0040:   00 00 00 00 09 7F 45 A0 FF                        ......E..
```
Packet 24, Sequence 24 — identical body:
```
0040:   00 00 00 00 09 7F 45 A0 FF                        ......E..
```

## Flow Context
Bootstrap sequence order (sequences 21–29):
1. **Seq 21**: REQUEST_OCCUPATION_CITY_INFO_LIST (this opcode)
2. **Seq 22**: REQUEST_REGIST_COORD_MGR (0x00000000)
3. **Seq 23**: REQUEST_PLAYER_COORD_DATA_LIST (0x00000003)
4. **Seq 24**: REQUEST_OCCUPATION_CITY_INFO_LIST (this opcode, repeated)
5. **Seq 25**: REQUEST_SIMPLE_PLAYER_INFO (0x00000006)
6. **Seq 26**: REQUEST_PLAYER_LOOKS_BUFF (0x0000000A)
7. **Seq 27–29**: REQUEST_SPACE_CIRCUIT_ITEM (0x00000005, ×3)

## Notes
- The `0xFF` sentinel at offset 0x08 is consistent across all captures; its purpose is unknown — possibly a "request all" wildcard or a fixed protocol marker
- Both requests receive a full RESPONSE_OCCUPATION_CITY_INFO_LIST (0x00008070) response
- The second occurrence (seq 24) appears to be a refresh after the coord manager registers the player
